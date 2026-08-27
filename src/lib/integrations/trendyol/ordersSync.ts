/**
 * Trendyol Orders Synchronization & Real-time Financial Engine
 * Pulls live and full historical orders (including Delivered, Cancelled, Returned)
 * using 14-day sliding windows to bypass Trendyol API window limitations.
 * Computes official cargo barem, desi rates, and line-by-line net profit.
 */

import { query } from '@/lib/db';
import { TrendyolClient } from './client';
import { TrendyolOrderPackage, TrendyolOrderLine } from './types';
import { calculateTrendyolShipping, BaremTier, DesiRate } from '@/lib/shippingCalculator';
import { calculateOrderFinancials } from '@/lib/financialEngine';
import { notificationScanner } from '@/lib/notificationScanner';

export interface OrdersSyncResult {
  success: boolean;
  storeId: string;
  storeName: string;
  totalOrdersFetched: number;
  newOrdersCount: number;
  updatedOrdersCount: number;
  deliveredCount: number;
  cancelledCount: number;
  returnedCount: number;
  totalRevenue: number;
  errors: string[];
  durationMs: number;
}

export async function syncTrendyolOrders(
  storeId: string,
  options: {
    startDate?: number; // Unix timestamp in ms
    endDate?: number;   // Unix timestamp in ms
    status?: any;
    maxPages?: number;
    pageSize?: number;
    daysBack?: number;
    fullHistory?: boolean;
  } = {}
): Promise<OrdersSyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  // 1. Fetch Store Credentials from DB
  const storeRows = await query(
    `SELECT id, company_id, store_name, marketplace, seller_id, supplier_id, api_key, api_secret, extra_config, last_synced_at
     FROM stores
     WHERE id::text = $1`,
    [storeId]
  );

  if (storeRows.length === 0) {
    throw new Error(`Mağaza bulunamadı (ID: ${storeId})`);
  }

  const store = storeRows[0];
  const companyId = store.company_id;
  const supplierId = store.supplier_id || store.seller_id;
  const apiKey = store.api_key;
  const apiSecret = store.api_secret;

  if (!supplierId || !apiKey || !apiSecret) {
    throw new Error(`Mağaza için Trendyol API kimlik bilgileri eksik.`);
  }

  // 2. Fetch Active Cargo Barem Tiers & Desi Rates for precise calculation
  const baremRows = await query<BaremTier>(
    `SELECT carrier_name as "carrierName", tier_name as "tierName",
            min_amount as "minAmount", max_amount as "maxAmount",
            discounted_price_ex_vat as "discountedPriceExVat",
            standard_price_ex_vat as "standardPriceExVat"
     FROM cargo_barem_tiers
     WHERE is_active = true`
  ).catch(() => [] as BaremTier[]);

  const desiRows = await query<DesiRate>(
    `SELECT carrier_name as "carrierName", min_desi as "minDesi",
            max_desi as "maxDesi", base_price as "basePrice"
     FROM carrier_desi_rates
     WHERE is_active = true`
  ).catch(() => [] as DesiRate[]);

  const desiMatrixRows = await query<any>(
    `SELECT carrier_name as "carrierName", desi, price_ex_vat as "priceExVat"
     FROM carrier_desi_matrices
     WHERE is_active = true`
  ).catch(() => []);

  const client = new TrendyolClient({
    supplierId,
    apiKey,
    apiSecret,
  });

  const pageSize = Math.min(50, Math.max(10, options.pageSize || 50));
  const nowMs = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  // Build 14-day sliding intervals to pull complete history from Trendyol
  interface TimeInterval {
    startMs?: number;
    endMs?: number;
  }

  const intervals: TimeInterval[] = [];

  if (options.startDate && options.endDate) {
    intervals.push({ startMs: options.startDate, endMs: options.endDate });
  } else {
    // Default to full 180 days (6 months) in 14-day chunks
    const totalDays = options.daysBack || 180;
    for (let daysAgo = 0; daysAgo < totalDays; daysAgo += 14) {
      const end = nowMs - (daysAgo * DAY_MS);
      const start = nowMs - (Math.min(totalDays, daysAgo + 14) * DAY_MS);
      intervals.push({ startMs: start, endMs: end });
    }
  }

  let totalOrdersFetched = 0;
  let newOrdersCount = 0;
  let updatedOrdersCount = 0;
  let deliveredCount = 0;
  let cancelledCount = 0;
  let returnedCount = 0;
  let totalRevenue = 0;
  const affectedDates = new Set<string>();
  const seenOrderNumbers = new Set<string>();

  for (const interval of intervals) {
    let page = 0;
    let hasMore = true;
    const maxPagesPerInterval = options.maxPages || 20;

    while (hasMore && page < maxPagesPerInterval) {
      try {
        const queryParams: any = {
          page,
          size: pageSize,
          status: options.status,
          orderByField: 'CreatedDate',
          orderByDirection: 'DESC',
        };

        if (interval.startMs) queryParams.startDate = interval.startMs;
        if (interval.endMs) queryParams.endDate = interval.endMs;

        const response = await client.getOrders(queryParams);
        const packages: TrendyolOrderPackage[] = response?.content || [];

        if (packages.length === 0) {
          break;
        }

        for (const pkg of packages) {
          try {
            const orderNumber = String(pkg.orderNumber || pkg.id);
            if (seenOrderNumbers.has(orderNumber)) {
              continue; // Avoid duplicate processing in overlapping intervals
            }
            seenOrderNumbers.add(orderNumber);
            totalOrdersFetched++;

            const packageNumber = String(pkg.id || pkg.orderNumber);
            const orderDate = pkg.orderDate ? new Date(pkg.orderDate) : new Date();
            const orderDateStr = orderDate.toISOString().split('T')[0];
            affectedDates.add(orderDateStr);

            const rawStatus = pkg.shipmentPackageStatus || pkg.status || 'Created';
            let status = rawStatus;
            let returnReason: string | null = null;
            let returnStatus: string | null = null;
            let returnDate: Date | null = null;
            let cancellationReason: string | null = null;
            let cancellationDate: Date | null = null;

            if (rawStatus === 'Cancelled') {
              status = 'Cancelled';
              cancellationReason = 'Trendyol Sipariş İptali';
              cancellationDate = orderDate;
              cancelledCount++;
            } else if (rawStatus === 'Returned' || rawStatus === 'UnDeliveredAndReturned') {
              status = 'Returned';
              returnReason = 'Müşteri İadesi / Teslim Edilemedi';
              returnStatus = 'Approved';
              returnDate = orderDate;
              returnedCount++;
            } else if (rawStatus === 'Delivered') {
              status = 'Delivered';
              deliveredCount++;
            }

            const deliveryType = pkg.deliveryType || (pkg.fastDelivery ? 'fast_delivery' : 'standard');
            const isFastDelivery = pkg.fastDelivery === true;

            // Customer info
            const customerName = `${pkg.customerFirstName || ''} ${pkg.customerLastName || ''}`.trim() || 'Trendyol Müşterisi';
            const customerCity = pkg.shipmentAddress?.city || 'Bilinmiyor';
            const customerDistrict = pkg.shipmentAddress?.district || '';
            const deliveryAddress = pkg.shipmentAddress?.fullAddress || pkg.shipmentAddress?.address1 || '';
            const customerEmail = pkg.customerEmail || null;

            // Corporate Invoice info
            const invoiceRecipient = pkg.invoiceAddress?.fullName || customerName;
            const invoiceAddress = pkg.invoiceAddress?.fullAddress || deliveryAddress;
            const isCorporateInvoice = Boolean(pkg.invoiceAddress?.taxNumber && pkg.invoiceAddress?.company);
            const taxId = pkg.invoiceAddress?.taxNumber || null;
            const taxOffice = pkg.invoiceAddress?.taxOffice || null;
            const companyName = pkg.invoiceAddress?.company || null;

            // Carrier & Shipping info
            const carrierRaw = pkg.cargoProviderName || 'TEX';
            const trackingCode = pkg.cargoTrackingNumber || null;

            // Money amounts
            const grossAmount = Number(pkg.grossAmount || pkg.totalPrice) || 0;
            const discountAmount = Number(pkg.totalDiscount) || 0;
            const paidAmount = Number(pkg.totalPrice || pkg.grossAmount) || 0;
            if (status !== 'Cancelled') {
              totalRevenue += paidAmount;
            }

            // Process lines
            const lines: TrendyolOrderLine[] = pkg.lines || [];
            let orderTotalDesi = 0;
            let orderTotalCogs = 0;
            let orderTotalCommission = 0;
            let orderHasMissingCost = false;

            interface ProcessedLine {
              line: TrendyolOrderLine;
              productId: string | null;
              unitCost: number;
              vatRate: number;
              commissionRate: number;
              commissionAmount: number;
              desi: number;
              shippingShare: number;
              financials: any;
            }

            const processedLines: ProcessedLine[] = [];

            for (const line of lines) {
              const barcode = (line.barcode || '').trim();
              const quantity = Math.max(1, Number(line.quantity) || 1);
              const unitSalePrice = Number(line.price) || 0;

              // Find product in DB
              const prodRows = await query(
                `SELECT id, current_cost, vat_rate, commission_rate, shipment_desi, category_id
                 FROM products
                 WHERE store_id = $1 AND barcode = $2
                 LIMIT 1`,
                [store.id, barcode]
              );

              let productId: string | null = null;
              let unitCost = 0;
              let vatRate = 20;
              let commRate = Number(line.commissionRate) || 15.0;
              let lineDesi = 1.0;

              const slugify = (text: string) => {
                const trMap: Record<string, string> = { 'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u', 'ı': 'i', 'İ': 'i', 'ö': 'o', 'Ö': 'o' };
                return String(text || '').replace(/[çÇğĞşŞüÜıİöÖ]/g, c => trMap[c] || c).toLowerCase().replace(/,\s*one size/gi, '').replace(/,\s*\(k:\d+\)/gi, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'urun';
              };
              const directProductUrl = line.productCode 
                ? `https://www.trendyol.com/genject/${slugify(line.productName || barcode)}-p-${line.productCode}?merchantId=${supplierId || '230566'}&filterOverPriceListings=false` 
                : null;

              if (prodRows.length > 0) {
                const prod = prodRows[0];
                productId = prod.id;
                unitCost = Number(prod.current_cost) || 0;
                vatRate = Number(prod.vat_rate) || 20;
                commRate = Number(line.commissionRate ?? prod.commission_rate) || 15.0;
                lineDesi = Math.max(0.5, Number(prod.shipment_desi) || 1.0);

                if (directProductUrl) {
                  await query(
                    `UPDATE products 
                     SET marketplace_product_url = COALESCE(marketplace_product_url, $1),
                         model_code = COALESCE(model_code, $2),
                         updated_at = NOW()
                     WHERE id = $3 AND (marketplace_product_url IS NULL OR marketplace_product_url = '')`,
                    [directProductUrl, line.productCode ? String(line.productCode) : null, prod.id]
                  );
                }
              } else if (barcode) {
                // Auto-insert product into database products catalog
                const newProd = await query(
                  `INSERT INTO products (
                     store_id, company_id, barcode, sku, model_code, title,
                     current_sale_price, current_cost, vat_rate, shipment_desi,
                     measured_desi, commission_rate, stock_quantity, delivery_type,
                     is_active, marketplace, marketplace_product_url, created_at, updated_at
                   ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 20, 1.0, 1.0, $8, 10, 'standard', true, 'trendyol', $9, NOW(), NOW())
                   ON CONFLICT (store_id, barcode) DO UPDATE SET 
                     current_sale_price = EXCLUDED.current_sale_price,
                     marketplace_product_url = COALESCE(EXCLUDED.marketplace_product_url, products.marketplace_product_url)
                   RETURNING id`,
                  [
                    store.id,
                    companyId,
                    barcode,
                    line.sku || line.merchantSku || barcode,
                    line.productCode ? String(line.productCode) : null,
                    line.productName || 'Trendyol Ürünü',
                    unitSalePrice,
                    commRate,
                    directProductUrl,
                  ]
                );
                if (newProd.length > 0) {
                  productId = newProd[0].id;
                }
                orderHasMissingCost = true;
              } else {
                orderHasMissingCost = true;
              }

              if (unitCost <= 0) {
                orderHasMissingCost = true;
              }

              const totalLineCost = unitCost * quantity;
              const lineCommAmount = (unitSalePrice * quantity) * (commRate / 100);

              orderTotalCogs += totalLineCost;
              orderTotalCommission += lineCommAmount;
              orderTotalDesi += lineDesi * quantity;

              processedLines.push({
                line,
                productId,
                unitCost,
                vatRate,
                commissionRate: commRate,
                commissionAmount: lineCommAmount,
                desi: lineDesi,
                shippingShare: 0,
                financials: null,
              });
            }

            // Compute Official Shipping Cost
            const leadTimeDays = isFastDelivery ? 1 : 2;
            const shippingResult = calculateTrendyolShipping(
              paidAmount,
              orderTotalDesi,
              carrierRaw,
              leadTimeDays,
              baremRows,
              desiRows,
              desiMatrixRows
            );

            const totalShippingCost = status === 'Cancelled' ? 0 : shippingResult.appliedPriceIncVat;

            // Distribute shipping and compute line financials
            const totalLineAmount = lines.reduce((acc, l) => acc + (Number(l.price) * (Number(l.quantity) || 1)), 0) || 1;

            for (const pl of processedLines) {
              const lineTotalSale = (Number(pl.line.price) || 0) * (Number(pl.line.quantity) || 1);
              const lineRatio = lineTotalSale / totalLineAmount;
              pl.shippingShare = Math.round(totalShippingCost * lineRatio * 100) / 100;

              pl.financials = calculateOrderFinancials({
                paidAmount: status === 'Cancelled' ? 0 : lineTotalSale,
                grossAmount: status === 'Cancelled' ? 0 : lineTotalSale,
                cogs: pl.unitCost * (Number(pl.line.quantity) || 1),
                commission: status === 'Cancelled' ? 0 : pl.commissionAmount,
                shippingCost: pl.shippingShare,
                serviceFee: status === 'Cancelled' ? 0 : 13.19 * lineRatio,
                stopaj: (status === 'Cancelled' ? 0 : lineTotalSale) * 0.01,
                netVat: status === 'Cancelled' ? 0 : (lineTotalSale / 1.20) * 0.20 - ((pl.unitCost * (Number(pl.line.quantity) || 1)) / 1.20) * 0.20,
                extraOperationRate: status === 'Cancelled' ? 0 : 6.00,
              });
            }

            // Order-level financial calculation
            const orderFinancials = calculateOrderFinancials({
              paidAmount: status === 'Cancelled' ? 0 : paidAmount,
              grossAmount: status === 'Cancelled' ? 0 : grossAmount,
              cogs: orderTotalCogs,
              commission: status === 'Cancelled' ? 0 : orderTotalCommission,
              shippingCost: totalShippingCost,
              serviceFee: status === 'Cancelled' ? 0 : 13.19,
              stopaj: (status === 'Cancelled' ? 0 : paidAmount) * 0.01,
              netVat: status === 'Cancelled' ? 0 : (paidAmount / 1.20) * 0.20 - (orderTotalCogs / 1.20) * 0.20,
              extraOperationRate: status === 'Cancelled' ? 0 : 6.00,
            });

            // Check existing in DB
            const existingOrder = await query(
              `SELECT id FROM orders WHERE store_id = $1 AND marketplace_order_number = $2`,
              [store.id, orderNumber]
            );

            let orderDbId: string;

            if (existingOrder.length > 0) {
              orderDbId = existingOrder[0].id;
              await query(
                `UPDATE orders
                 SET package_number = $1,
                     order_date = $2,
                     status = $3,
                     delivery_type = $4,
                     customer_name = $5,
                     customer_city = $6,
                     customer_district = $7,
                     customer_email = $8,
                     delivery_address = $9,
                     invoice_address = $10,
                     invoice_recipient = $11,
                     carrier_name = $12,
                     tracking_code = $13,
                     is_fast_delivery = $14,
                     is_corporate_invoice = $15,
                     tax_id = $16,
                     tax_office = $17,
                     company_name = $18,
                     gross_amount = $19,
                     discount_amount = $20,
                     paid_amount = $21,
                     total_cost = $22,
                     total_commission = $23,
                     total_shipping_cost = $24,
                     service_fee = $25,
                     withholding_tax = $26,
                     net_vat = $27,
                     extra_cost = $28,
                     net_profit = $29,
                     profit_margin_percent = $30,
                     has_missing_cost = $31,
                     calculated_desi = $32,
                     return_reason = $33,
                     return_status = $34,
                     return_date = $35,
                     cancellation_reason = $36,
                     cancellation_date = $37,
                     marketplace = 'trendyol',
                     updated_at = NOW()
                 WHERE id = $38`,
                [
                  packageNumber,
                  orderDate,
                  status,
                  deliveryType,
                  customerName,
                  customerCity,
                  customerDistrict,
                  customerEmail,
                  deliveryAddress,
                  invoiceAddress,
                  invoiceRecipient,
                  carrierRaw,
                  trackingCode,
                  isFastDelivery,
                  isCorporateInvoice,
                  taxId,
                  taxOffice,
                  companyName,
                  grossAmount,
                  discountAmount,
                  paidAmount,
                  orderFinancials.cogs,
                  orderFinancials.commission,
                  orderFinancials.shippingCost,
                  orderFinancials.serviceFee,
                  orderFinancials.stopaj,
                  orderFinancials.netVat,
                  orderFinancials.extraOperationCost,
                  orderFinancials.netProfit,
                  orderFinancials.marginPercent,
                  orderHasMissingCost,
                  orderTotalDesi,
                  returnReason,
                  returnStatus,
                  returnDate,
                  cancellationReason,
                  cancellationDate,
                  orderDbId,
                ]
              );
              updatedOrdersCount++;
            } else {
              const insRes = await query(
                `INSERT INTO orders (
                   store_id, company_id, marketplace_order_number, package_number,
                   order_date, status, delivery_type, customer_name, customer_city,
                   customer_district, customer_email, delivery_address, invoice_address,
                   invoice_recipient, carrier_name, tracking_code, is_fast_delivery,
                   is_corporate_invoice, tax_id, tax_office, company_name, gross_amount,
                   discount_amount, paid_amount, total_cost, total_commission,
                   total_shipping_cost, service_fee, withholding_tax, net_vat,
                   extra_cost, net_profit, profit_margin_percent, has_missing_cost,
                   calculated_desi, return_reason, return_status, return_date,
                   cancellation_reason, cancellation_date, marketplace, created_at, updated_at
                 ) VALUES (
                   $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
                   $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
                   $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, 'trendyol', NOW(), NOW()
                 ) RETURNING id`,
                [
                  store.id,
                  companyId,
                  orderNumber,
                  packageNumber,
                  orderDate,
                  status,
                  deliveryType,
                  customerName,
                  customerCity,
                  customerDistrict,
                  customerEmail,
                  deliveryAddress,
                  invoiceAddress,
                  invoiceRecipient,
                  carrierRaw,
                  trackingCode,
                  isFastDelivery,
                  isCorporateInvoice,
                  taxId,
                  taxOffice,
                  companyName,
                  grossAmount,
                  discountAmount,
                  paidAmount,
                  orderFinancials.cogs,
                  orderFinancials.commission,
                  orderFinancials.shippingCost,
                  orderFinancials.serviceFee,
                  orderFinancials.stopaj,
                  orderFinancials.netVat,
                  orderFinancials.extraOperationCost,
                  orderFinancials.netProfit,
                  orderFinancials.marginPercent,
                  orderHasMissingCost,
                  orderTotalDesi,
                  returnReason,
                  returnStatus,
                  returnDate,
                  cancellationReason,
                  cancellationDate,
                ]
              );
              orderDbId = insRes[0]?.id;
              newOrdersCount++;
            }

            // Clean & Insert order_items
            if (orderDbId) {
              await query(`DELETE FROM order_items WHERE order_id = $1`, [orderDbId]);

              for (const pl of processedLines) {
                const qty = Math.max(1, Number(pl.line.quantity) || 1);
                const unitPrice = Number(pl.line.price) || 0;
                const title = pl.line.productName || 'Trendyol Ürünü';
                const sku = pl.line.sku || pl.line.merchantSku || null;
                const barcode = pl.line.barcode || 'NO_BARCODE';

                await query(
                  `INSERT INTO order_items (
                     order_id, product_id, barcode, sku, title, quantity,
                     unit_sale_price, unit_cost_price, unit_cost_vat_rate, sale_vat_rate,
                     commission_rate, commission_amount, shipping_desi, shipping_amount,
                     service_fee_share, withholding_tax, net_vat, extra_cost,
                     net_profit, margin_percent, has_missing_cost, status
                   ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, 'active')`,
                  [
                    orderDbId,
                    pl.productId,
                    barcode,
                    sku,
                    title,
                    qty,
                    unitPrice,
                    pl.unitCost,
                    pl.vatRate,
                    pl.vatRate,
                    pl.commissionRate,
                    pl.commissionAmount,
                    pl.desi,
                    pl.shippingShare,
                    pl.financials.serviceFee,
                    pl.financials.stopaj,
                    pl.financials.netVat,
                    pl.financials.extraOperationCost,
                    pl.financials.netProfit,
                    pl.financials.marginPercent,
                    pl.unitCost <= 0,
                  ]
                );
              }
            }
          } catch (orderErr: any) {
            errors.push(`Sipariş ${pkg.orderNumber} kaydedilirken hata: ${orderErr.message}`);
          }
        }

        if (page >= (response.totalPages || 1) - 1) {
          hasMore = false;
        } else {
          page++;
        }
      } catch (pageErr: any) {
        errors.push(`Interval ${interval.startMs} - ${interval.endMs} sayfa ${page} API hatası: ${pageErr.message}`);
        break;
      }
    }
  }

  // 3. Update daily_financial_rollups for affected dates
  for (const dateStr of affectedDates) {
    try {
      await query(
        `INSERT INTO daily_financial_rollups (
           company_id, store_id, rollup_date, total_orders, total_items_sold,
           total_gross_revenue, total_cogs, total_commission, total_shipping_cost,
           total_service_fee, total_withholding, total_net_vat, total_extra_costs,
           total_net_profit, missing_cost_items_count, updated_at
         )
         SELECT 
           o.company_id,
           o.store_id,
           o.order_date::date as rollup_date,
           COUNT(o.id) as total_orders,
           COALESCE(SUM(oi.quantity), 0) as total_items_sold,
           COALESCE(SUM(o.paid_amount), 0) as total_gross_revenue,
           COALESCE(SUM(o.total_cost), 0) as total_cogs,
           COALESCE(SUM(o.total_commission), 0) as total_commission,
           COALESCE(SUM(o.total_shipping_cost), 0) as total_shipping_cost,
           COALESCE(SUM(o.service_fee), 0) as total_service_fee,
           COALESCE(SUM(o.withholding_tax), 0) as total_withholding,
           COALESCE(SUM(o.net_vat), 0) as total_net_vat,
           COALESCE(SUM(o.extra_cost), 0) as total_extra_costs,
           COALESCE(SUM(o.net_profit), 0) as total_net_profit,
           COALESCE(SUM(CASE WHEN o.has_missing_cost THEN 1 ELSE 0 END), 0) as missing_cost_items_count,
           NOW() as updated_at
         FROM orders o
         LEFT JOIN order_items oi ON oi.order_id = o.id
         WHERE o.store_id = $1 AND o.order_date::date = $2::date
         GROUP BY o.company_id, o.store_id, o.order_date::date
         ON CONFLICT (store_id, rollup_date) DO UPDATE SET
           total_orders = EXCLUDED.total_orders,
           total_items_sold = EXCLUDED.total_items_sold,
           total_gross_revenue = EXCLUDED.total_gross_revenue,
           total_cogs = EXCLUDED.total_cogs,
           total_commission = EXCLUDED.total_commission,
           total_shipping_cost = EXCLUDED.total_shipping_cost,
           total_service_fee = EXCLUDED.total_service_fee,
           total_withholding = EXCLUDED.total_withholding,
           total_net_vat = EXCLUDED.total_net_vat,
           total_extra_costs = EXCLUDED.total_extra_costs,
           total_net_profit = EXCLUDED.total_net_profit,
           missing_cost_items_count = EXCLUDED.missing_cost_items_count,
           updated_at = NOW()`,
        [store.id, dateStr]
      );
    } catch (rollupErr: any) {
      console.warn(`Rollup error for date ${dateStr}:`, rollupErr.message);
    }
  }

  // 4. Trigger Automatic Anomaly & Crash Scanner
  try {
    await notificationScanner.scanAllAnomalies();
  } catch (scanErr: any) {
    console.warn('Anomaly scanner triggered with warning:', scanErr.message);
  }

  // 5. Update store status in DB
  await query(
    `UPDATE stores
     SET last_synced_at = NOW(), sync_status = 'synced', sync_error_message = $1
     WHERE id = $2`,
    [errors.length > 0 ? errors.slice(0, 3).join('; ') : null, store.id]
  );

  const durationMs = Date.now() - startTime;

  return {
    success: errors.length === 0 || totalOrdersFetched > 0,
    storeId: store.id,
    storeName: store.store_name,
    totalOrdersFetched,
    newOrdersCount,
    updatedOrdersCount,
    deliveredCount,
    cancelledCount,
    returnedCount,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    errors,
    durationMs,
  };
}
