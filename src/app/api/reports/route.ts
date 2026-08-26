import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'order';
    const limit = parseInt(searchParams.get('limit') || '100');

    if (type === 'order') {
      const orders = await query(`
        SELECT 
          o.id,
          o.marketplace_order_number as "orderNumber",
          o.package_number as "packageNumber",
          TO_CHAR(o.order_date, 'YYYY-MM-DD HH24:MI') as "orderDate",
          o.customer_name as "customerName",
          o.customer_city as "city",
          o.carrier_name as "carrierName",
          o.paid_amount as "paidAmount",
          o.total_cost as "cogs",
          o.total_commission as "commission",
          o.total_shipping_cost as "shippingCost",
          o.service_fee as "serviceFee",
          o.withholding_tax as "withholdingTax",
          o.net_vat as "netVat",
          o.net_profit as "netProfit",
          o.profit_margin_percent as "marginPercent",
          o.status
        FROM orders o
        ORDER BY o.order_date DESC
        LIMIT $1
      `, [limit]);

      return NextResponse.json({ type, count: orders.length, data: orders });
    }

    if (type === 'product') {
      const products = await query(`
        SELECT 
          oi.barcode,
          oi.title,
          oi.brand,
          SUM(oi.quantity) as "totalQuantity",
          SUM(oi.invoiced_amount) as "totalRevenue",
          SUM(oi.unit_cost_price * oi.quantity) as "totalCogs",
          SUM(oi.commission_amount) as "totalCommission",
          SUM(oi.shipping_amount) as "totalShipping",
          SUM(oi.net_profit) as "totalProfit",
          ROUND((SUM(oi.net_profit) / NULLIF(SUM(oi.invoiced_amount), 0)) * 100, 1) as "avgMarginPercent"
        FROM order_items oi
        GROUP BY oi.barcode, oi.title, oi.brand
        ORDER BY SUM(oi.net_profit) DESC
        LIMIT $1
      `, [limit]);

      return NextResponse.json({ type, count: products.length, data: products });
    }

    if (type === 'category' || type === 'brand') {
      const brands = await query(`
        SELECT 
          COALESCE(oi.brand, 'Genel') as "brand",
          COUNT(DISTINCT oi.order_id) as "orderCount",
          SUM(oi.quantity) as "totalQuantity",
          SUM(oi.invoiced_amount) as "totalRevenue",
          SUM(oi.net_profit) as "totalProfit",
          ROUND((SUM(oi.net_profit) / NULLIF(SUM(oi.invoiced_amount), 0)) * 100, 1) as "marginPercent"
        FROM order_items oi
        GROUP BY oi.brand
        ORDER BY SUM(oi.net_profit) DESC
        LIMIT $1
      `, [limit]);

      return NextResponse.json({ type, count: brands.length, data: brands });
    }

    if (type === 'returns') {
      const returns = await query(`
        SELECT 
          o.id,
          o.marketplace_order_number as "orderNumber",
          TO_CHAR(o.order_date, 'YYYY-MM-DD HH24:MI') as "orderDate",
          o.customer_name as "customerName",
          o.carrier_name as "carrierName",
          o.paid_amount as "paidAmount",
          o.total_shipping_cost as "shippingLoss",
          o.service_fee as "serviceFeeLoss",
          (o.total_shipping_cost + o.service_fee) as "totalReturnLoss",
          o.status
        FROM orders o
        WHERE o.status ILIKE '%İade%' OR o.status ILIKE '%İptal%' OR o.net_profit < 0
        ORDER BY o.order_date DESC
        LIMIT $1
      `, [limit]);

      return NextResponse.json({ type, count: returns.length, data: returns });
    }

    if (type === 'shipping') {
      const carriers = await query(`
        SELECT 
          COALESCE(o.carrier_name, 'Trendyol Express') as "carrier",
          COUNT(o.id) as "totalShipments",
          SUM(o.total_shipping_cost) as "totalShippingFee",
          ROUND(AVG(o.billed_desi), 1) as "avgBilledDesi",
          ROUND(AVG(o.calculated_desi), 1) as "avgCalculatedDesi",
          SUM(o.net_profit) as "totalGeneratedProfit"
        FROM orders o
        GROUP BY o.carrier_name
        ORDER BY COUNT(o.id) DESC
      `);

      return NextResponse.json({ type, count: carriers.length, data: carriers });
    }

    return NextResponse.json({ type, count: 0, data: [] });
  } catch (error: any) {
    console.error('Reports API error:', error);
    return NextResponse.json({ error: 'Rapor verileri alınamadı: ' + error.message }, { status: 500 });
  }
}
