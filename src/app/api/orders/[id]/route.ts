import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch extra operation rate from company_settings
    const settingsRes = await query(`SELECT extra_operation_rate as "extraOperationRate" FROM company_settings LIMIT 1`);
    const extraOpRate = parseFloat(settingsRes[0]?.extraOperationRate ?? 6.00);
    const extraOpFraction = extraOpRate / 100.0;

    const orderRes = await query(`
      SELECT 
        o.id,
        o.marketplace_order_number as "orderNumber",
        o.package_number as "packageNumber",
        TO_CHAR(o.order_date, 'YYYY-MM-DD HH24:MI:SS') as "orderDate",
        TO_CHAR(o.lead_time_deadline, 'YYYY-MM-DD HH24:MI:SS') as "leadTimeDeadline",
        TO_CHAR(o.dispatched_date, 'YYYY-MM-DD HH24:MI:SS') as "dispatchedDate",
        TO_CHAR(o.delivered_date, 'YYYY-MM-DD HH24:MI:SS') as "deliveredDate",
        o.status,
        o.customer_name as "customerName",
        o.customer_city as "city",
        o.customer_district as "district",
        o.customer_country as "country",
        o.customer_email as "email",
        o.customer_phone as "phone",
        o.customer_age as "customerAge",
        o.customer_gender as "customerGender",
        o.customer_order_count_label as "customerOrderCountLabel",
        o.delivery_address as "deliveryAddress",
        o.invoice_address as "invoiceAddress",
        o.invoice_recipient as "invoiceRecipient",
        o.carrier_name as "carrierName",
        o.tracking_code as "trackingCode",
        o.delivery_number as "deliveryNumber",
        o.boutique_number as "boutiqueNumber",
        o.gross_amount as "grossAmount",
        o.discount_amount as "sellerDiscount",
        o.platform_discount_amount as "platformDiscount",
        o.paid_amount as "paidAmount",
        o.total_cost as "cogs",
        o.total_commission as "commission",
        o.total_shipping_cost as "shippingCost",
        o.service_fee as "serviceFee",
        o.withholding_tax as "withholdingTax",
        o.net_vat as "netVat",
        o.billed_desi as "billedDesi",
        o.calculated_desi as "calculatedDesi",
        o.is_corporate_invoice as "isCorporate",
        o.company_name as "companyName",
        o.tax_id as "taxId",
        o.tax_office as "taxOffice",
        o.has_invoice as "hasInvoice",
        o.invoice_number as "invoiceNumber",
        TO_CHAR(o.invoice_date, 'YYYY-MM-DD') as "invoiceDate",
        o.hs_code as "hsCode",
        o.invoice_reject_reason as "invoiceRejectReason",
        s.store_name as "storeName",
        s.marketplace as "marketplace"
      FROM orders o
      LEFT JOIN stores s ON s.id = o.store_id
      WHERE o.id::text = $1 OR o.marketplace_order_number = $1 OR o.package_number = $1
      LIMIT 1
    `, [id]);

    if (orderRes.length === 0) {
      return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 });
    }

    const order = orderRes[0];
    const gross = parseFloat(order.grossAmount || 0);
    const paid = parseFloat(order.paidAmount || 0);
    const cogs = parseFloat(order.cogs || 0);
    const comm = parseFloat(order.commission || 0);
    const ship = parseFloat(order.shippingCost || 0);
    const sFee = parseFloat(order.serviceFee || 0);
    const wTax = parseFloat(order.withholdingTax || 0);
    const nVat = parseFloat(order.netVat || 0);

    const extraOpCost = Math.round((gross * extraOpFraction) * 100) / 100;
    const netProf = Math.round((paid - (cogs + comm + ship + sFee + wTax + nVat + extraOpCost)) * 100) / 100;
    const margin = paid > 0 ? Math.round((netProf / paid) * 1000) / 10 : 0;

    order.extraOperationRate = extraOpRate;
    order.extraOperationCost = extraOpCost;
    order.netProfit = netProf;
    order.marginPercent = margin;

    // Fetch Order Items
    const items = await query(`
      SELECT 
        oi.id,
        oi.barcode,
        oi.sku,
        oi.title,
        oi.brand,
        oi.quantity,
        oi.unit_sale_price as "unitSalePrice",
        oi.unit_cost_price as "unitCostPrice",
        oi.commission_rate as "commissionRate",
        oi.commission_amount as "commissionAmount",
        oi.shipping_desi as "shippingDesi",
        oi.shipping_amount as "shippingAmount",
        oi.service_fee_share as "serviceFeeShare",
        oi.withholding_tax as "withholdingTax",
        oi.net_vat as "netVat",
        oi.net_profit as "netProfit",
        oi.margin_percent as "marginPercent",
        oi.seller_discount as "sellerDiscount",
        oi.platform_discount as "platformDiscount",
        oi.invoiced_amount as "invoicedAmount",
        p.image_url as "imageUrl"
      FROM order_items oi
      LEFT JOIN products p ON p.id::text = oi.product_id::text
      WHERE oi.order_id::text = $1
    `, [order.id]);

    return NextResponse.json({ order, items });
  } catch (error: any) {
    console.error('Order detail fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { itemId, newCost } = body;

    if (!itemId || newCost === undefined) {
      return NextResponse.json({ error: 'itemId ve newCost gereklidir.' }, { status: 400 });
    }

    const numCost = parseFloat(newCost);

    // 1. Update order_items cost
    await query(`
      UPDATE order_items
      SET unit_cost_price = $1,
          net_profit = invoiced_amount - ($1 * quantity + commission_amount + shipping_amount + service_fee_share + withholding_tax + net_vat),
          margin_percent = ROUND(((invoiced_amount - ($1 * quantity + commission_amount + shipping_amount + service_fee_share + withholding_tax + net_vat)) / NULLIF(invoiced_amount, 0) * 100)::numeric, 1)
      WHERE id::text = $2
    `, [numCost, itemId]);

    // 2. Also update catalog products table if barcode exists
    const itemRes = await query(`SELECT barcode FROM order_items WHERE id::text = $1`, [itemId]);
    if (itemRes.length > 0 && itemRes[0].barcode) {
      await query(`UPDATE products SET cost_price = $1 WHERE barcode = $2`, [numCost, itemRes[0].barcode]);
    }

    // 3. Recalculate order totals
    await query(`
      UPDATE orders
      SET total_cost = (SELECT COALESCE(SUM(unit_cost_price * quantity), 0) FROM order_items WHERE order_id = orders.id),
          updated_at = now()
      WHERE id::text = $1
    `, [id]);

    return NextResponse.json({ success: true, message: `Birim maliyet ₺${numCost.toFixed(2)} olarak güncellendi ve kâr yeniden hesaplandı!` });
  } catch (error: any) {
    console.error('Order item cost update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
