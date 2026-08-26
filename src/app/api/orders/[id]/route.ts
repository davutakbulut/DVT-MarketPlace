import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
        o.net_profit as "netProfit",
        o.profit_margin_percent as "marginPercent",
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
      ORDER BY oi.id ASC
    `, [order.id.toString()]);

    return NextResponse.json({ order, items });
  } catch (error: any) {
    console.error('Order detail API error:', error);
    return NextResponse.json({ error: 'Sipariş detayları alınamadı: ' + error.message }, { status: 500 });
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

    if (itemId && newCost !== undefined) {
      await query(`
        UPDATE order_items
        SET unit_cost_price = $1,
            net_profit = (invoiced_amount + platform_discount) - ($1 * quantity + commission_amount + shipping_amount + service_fee_share + withholding_tax + net_vat),
            margin_percent = ROUND((((invoiced_amount + platform_discount) - ($1 * quantity + commission_amount + shipping_amount + service_fee_share + withholding_tax + net_vat)) / NULLIF(invoiced_amount, 0)) * 100, 2)
        WHERE id::text = $2
      `, [newCost, itemId]);

      await query(`
        WITH item_sums AS (
          SELECT 
            SUM(unit_cost_price * quantity) as new_total_cost,
            SUM(net_profit) as new_net_profit
          FROM order_items
          WHERE order_id::text = $1
        )
        UPDATE orders
        SET total_cost = item_sums.new_total_cost,
            net_profit = item_sums.new_net_profit,
            profit_margin_percent = ROUND((item_sums.new_net_profit / NULLIF(paid_amount, 0)) * 100, 2)
        FROM item_sums
        WHERE id::text = $1
      `, [id]);

      return NextResponse.json({ success: true, message: 'Ürün maliyeti ve kâr tutarları güncellendi!' });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
