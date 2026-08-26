/**
 * Trendyol Delta Order Status Synchronization Service
 * Smart incremental updater: Pulls latest package modifications from Trendyol API,
 * detects changes (status, tracking, carrier, return, cancellation) and ONLY updates
 * records in PostgreSQL when a real change occurs (Delta detection).
 */

import { query } from '@/lib/db';
import { TrendyolClient } from './client';
import { TrendyolOrderPackage } from './types';
import { calculateTrendyolShipping, BaremTier, DesiRate } from '@/lib/shippingCalculator';
import { calculateOrderFinancials } from '@/lib/financialEngine';
import { notificationScanner } from '@/lib/notificationScanner';

export interface StatusTransition {
  orderNumber: string;
  customerName: string;
  fromStatus: string;
  toStatus: string;
  trackingCode?: string;
  changedAt: string;
}

export interface OrderStatusSyncResult {
  success: boolean;
  storeId: string;
  storeName: string;
  totalExamined: number;
  changedCount: number;
  unchangedCount: number;
  transitionsSummary: Record<string, number>;
  transitions: StatusTransition[];
  durationMs: number;
  errors: string[];
  message: string;
}

export async function syncTrendyolOrderStatuses(
  storeId: string,
  options: {
    maxPages?: number;
    pageSize?: number;
    startDate?: number;
    endDate?: number;
    onlyActiveStatuses?: boolean; // When true, focuses on Created, Picking, Shipped, ReadyToShip
  } = {}
): Promise<OrderStatusSyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  // 1. Fetch Store Credentials from DB
  const storeRows = await query(
    `SELECT id, company_id, store_name, marketplace, seller_id, supplier_id, api_key, api_secret, extra_config
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

  // 2. Fetch Active Cargo Barem Tiers & Desi Rates
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

  const client = new TrendyolClient({
    supplierId,
    apiKey,
    apiSecret,
  });

  const pageSize = Math.min(50, Math.max(10, options.pageSize || 50));
  const maxPages = options.maxPages || 10;
  const affectedDates = new Set<string>();

  let totalExamined = 0;
  let changedCount = 0;
  let unchangedCount = 0;
  const transitionsSummary: Record<string, number> = {};
  const transitions: StatusTransition[] = [];

  // Determine status list to query
  const statusFilterList: (string | undefined)[] = options.onlyActiveStatuses
    ? ['Picking', 'Shipped', 'Created', 'ReadyToShip']
    : [undefined]; // undefined queries all by last modified date

  for (const stFilter of statusFilterList) {
    let page = 0;
    let hasMore = true;

    while (hasMore && page < maxPages) {
      try {
        const queryParams: any = {
          page,
          size: pageSize,
          orderByField: 'PackageLastModifiedDate',
          orderByDirection: 'DESC',
        };

        if (stFilter) queryParams.status = stFilter;
        if (options.startDate) queryParams.startDate = options.startDate;
        if (options.endDate) queryParams.endDate = options.endDate;

        const response = await client.getOrders(queryParams);
        const packages: TrendyolOrderPackage[] = response?.content || [];

        if (packages.length === 0) {
          break;
        }

        for (const pkg of packages) {
          try {
            const orderNumber = String(pkg.orderNumber || pkg.id);
            totalExamined++;

            const rawStatus = pkg.shipmentPackageStatus || pkg.status || 'Created';
            let newStatus = rawStatus;
            let newReturnReason: string | null = null;
            let newReturnStatus: string | null = null;
            let newCancellationReason: string | null = null;

            if (rawStatus === 'Cancelled') {
              newStatus = 'Cancelled';
              newCancellationReason = 'Trendyol Sipariş İptali';
            } else if (rawStatus === 'Returned' || rawStatus === 'UnDeliveredAndReturned') {
              newStatus = 'Returned';
              newReturnReason = 'Trendyol Müşteri İadesi / Teslim Edilemedi';
              newReturnStatus = 'Approved';
            } else if (rawStatus === 'Delivered') {
              newStatus = 'Delivered';
            }

            const newTracking = pkg.cargoTrackingNumber ? String(pkg.cargoTrackingNumber).trim() : null;
            const newCarrier = pkg.cargoProviderName ? String(pkg.cargoProviderName).trim() : 'MNG';
            const orderDate = pkg.orderDate ? new Date(pkg.orderDate) : new Date();

            // 3. FETCH CURRENT DB RECORD FOR DELTA COMPARISON
            const existingRows = await query(
              `SELECT id, status, tracking_code, carrier_name, return_status, 
                      cancellation_reason, paid_amount, raw_metadata
               FROM orders
               WHERE store_id = $1 AND marketplace_order_number = $2
               LIMIT 1`,
              [store.id, orderNumber]
            );

            if (existingRows.length === 0) {
              // Order doesn't exist yet in DB -> Needs full insert
              // (Handled by general sync or created here)
              continue;
            }

            const currentDb = existingRows[0];
            const currentStatus = currentDb.status || 'Created';
            const currentTracking = currentDb.tracking_code || null;
            const currentCarrier = currentDb.carrier_name || null;
            const currentReturnStatus = currentDb.return_status || null;
            const currentCancellation = currentDb.cancellation_reason || null;

            // 4. DELTA CHECK: Did anything change?
            const isStatusChanged = currentStatus !== newStatus;
            const isTrackingChanged = currentTracking !== newTracking && newTracking !== null;
            const isCarrierChanged = currentCarrier !== newCarrier;
            const isReturnChanged = newReturnStatus !== null && currentReturnStatus !== newReturnStatus;
            const isCancellationChanged = newCancellationReason !== null && currentCancellation !== newCancellationReason;

            const hasAnyDelta = isStatusChanged || isTrackingChanged || isCarrierChanged || isReturnChanged || isCancellationChanged;

            if (!hasAnyDelta) {
              // NO CHANGE DETECTED -> SKIP DATABASE UPDATE TO SAVE IO
              unchangedCount++;
              continue;
            }

            // 5. CHANGE DETECTED -> PERFORM TARGETED DELTA UPDATE
            changedCount++;
            const transitionKey = `${currentStatus} ➔ ${newStatus}`;
            transitionsSummary[transitionKey] = (transitionsSummary[transitionKey] || 0) + 1;

            transitions.push({
              orderNumber,
              customerName: `${pkg.customerFirstName || ''} ${pkg.customerLastName || ''}`.trim() || 'Müşteri',
              fromStatus: currentStatus,
              toStatus: newStatus,
              trackingCode: newTracking || undefined,
              changedAt: new Date().toISOString(),
            });

            affectedDates.add(orderDate.toISOString().split('T')[0]);

            // Update status history array in raw_metadata
            const prevMeta = currentDb.raw_metadata || {};
            const statusHistory = Array.isArray(prevMeta.status_history) ? prevMeta.status_history : [];
            statusHistory.push({
              from: currentStatus,
              to: newStatus,
              at: new Date().toISOString(),
              tracking: newTracking,
            });

            const updatedMeta = {
              ...prevMeta,
              status_history: statusHistory,
              last_status_sync_at: new Date().toISOString(),
            };

            // Set specific transition dates
            let deliveredDateSql = 'delivered_date';
            let dispatchedDateSql = 'dispatched_date';
            let cancellationDateSql = 'cancellation_date';
            let returnDateSql = 'return_date';

            if (newStatus === 'Delivered') deliveredDateSql = 'COALESCE(delivered_date, NOW())';
            if (newStatus === 'Shipped') dispatchedDateSql = 'COALESCE(dispatched_date, NOW())';
            if (newStatus === 'Cancelled') cancellationDateSql = 'COALESCE(cancellation_date, NOW())';
            if (newStatus === 'Returned') returnDateSql = 'COALESCE(return_date, NOW())';

            await query(
              `UPDATE orders
               SET status = $1,
                   tracking_code = COALESCE($2, tracking_code),
                   carrier_name = COALESCE($3, carrier_name),
                   return_reason = COALESCE($4, return_reason),
                   return_status = COALESCE($5, return_status),
                   cancellation_reason = COALESCE($6, cancellation_reason),
                   delivered_date = ${deliveredDateSql},
                   dispatched_date = ${dispatchedDateSql},
                   cancellation_date = ${cancellationDateSql},
                   return_date = ${returnDateSql},
                   raw_metadata = $7,
                   updated_at = NOW()
               WHERE id = $8`,
              [
                newStatus,
                newTracking,
                newCarrier,
                newReturnReason,
                newReturnStatus,
                newCancellationReason,
                JSON.stringify(updatedMeta),
                currentDb.id,
              ]
            );
          } catch (itemErr: any) {
            errors.push(`Sipariş ${pkg.orderNumber} delta kontrolünde hata: ${itemErr.message}`);
          }
        }

        if (page >= (response.totalPages || 1) - 1) {
          hasMore = false;
        } else {
          page++;
        }
      } catch (pageErr: any) {
        errors.push(`Durum senkronizasyonu sayfa ${page} API hatası: ${pageErr.message}`);
        break;
      }
    }
  }

  // 6. Refresh Rollups for Affected Dates if any change occurred
  if (changedCount > 0) {
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
             COALESCE(SUM(CASE WHEN o.status = 'Cancelled' THEN 0 ELSE o.paid_amount END), 0) as total_gross_revenue,
             COALESCE(SUM(o.total_cost), 0) as total_cogs,
             COALESCE(SUM(CASE WHEN o.status = 'Cancelled' THEN 0 ELSE o.total_commission END), 0) as total_commission,
             COALESCE(SUM(CASE WHEN o.status = 'Cancelled' THEN 0 ELSE o.total_shipping_cost END), 0) as total_shipping_cost,
             COALESCE(SUM(CASE WHEN o.status = 'Cancelled' THEN 0 ELSE o.service_fee END), 0) as total_service_fee,
             COALESCE(SUM(CASE WHEN o.status = 'Cancelled' THEN 0 ELSE o.withholding_tax END), 0) as total_withholding,
             COALESCE(SUM(CASE WHEN o.status = 'Cancelled' THEN 0 ELSE o.net_vat END), 0) as total_net_vat,
             COALESCE(SUM(CASE WHEN o.status = 'Cancelled' THEN 0 ELSE o.extra_cost END), 0) as total_extra_costs,
             COALESCE(SUM(CASE WHEN o.status = 'Cancelled' THEN 0 ELSE o.net_profit END), 0) as total_net_profit,
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
        console.warn(`Rollup delta error for date ${dateStr}:`, rollupErr.message);
      }
    }

    // Trigger Notification Scanner
    try {
      await notificationScanner.scanAllAnomalies();
    } catch {}
  }

  // Update store last sync timestamp
  await query(
    `UPDATE stores SET last_synced_at = NOW(), sync_status = 'synced' WHERE id = $1`,
    [store.id]
  );

  const durationMs = Date.now() - startTime;

  return {
    success: errors.length === 0,
    storeId: store.id,
    storeName: store.store_name,
    totalExamined,
    changedCount,
    unchangedCount,
    transitionsSummary,
    transitions,
    durationMs,
    errors,
    message: changedCount > 0
      ? `${store.store_name} için ${totalExamined} sipariş incelendi: ${changedCount} siparişin durumu güncellendi, ${unchangedCount} sipariş değişmedi.`
      : `${store.store_name} için ${totalExamined} sipariş incelendi: Tüm sipariş durumları zaten en güncel halinde (0 değişiklik).`,
  };
}
