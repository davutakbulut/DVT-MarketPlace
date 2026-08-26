import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerName = searchParams.get('name');
    const storeId = searchParams.get('storeId') || 'all';

    let storeCondition = '1=1';
    let storeParams: any[] = [];
    if (storeId && storeId !== 'all') {
      storeCondition = `o.store_id::text = $1`;
      storeParams = [storeId];
    }

    if (customerName) {
      let params = [`%${customerName}%`];
      let cond = `o.customer_name ILIKE $1`;
      if (storeId && storeId !== 'all') {
        cond += ` AND o.store_id::text = $2`;
        params.push(storeId);
      }

      // Return specific customer order details
      const customerOrders = await query(`
        SELECT 
          o.id,
          o.marketplace_order_number as "orderNumber",
          TO_CHAR(o.order_date, 'YYYY-MM-DD HH24:MI') as "orderDate",
          COALESCE(o.status, 'Delivered') as "status",
          COALESCE(o.customer_name, 'Bilinmeyen Müşteri') as "customerName",
          o.customer_city as "city",
          o.customer_district as "district",
          o.customer_email as "email",
          o.customer_phone as "phone",
          COALESCE(o.paid_amount, o.gross_amount) as "paidAmount",
          o.total_cost as "cogs",
          o.total_commission as "commission",
          o.total_shipping_cost as "shippingCost",
          o.service_fee as "serviceFee",
          o.net_profit as "netProfit",
          o.profit_margin_percent as "marginPercent",
          s.store_name as "storeName",
          COALESCE(o.marketplace, s.marketplace, 'trendyol') as "marketplace"
        FROM orders o
        LEFT JOIN stores s ON s.id = o.store_id
        WHERE ${cond}
        ORDER BY o.order_date DESC
      `, params);

      return NextResponse.json({ orders: customerOrders });
    }

    // Aggregate unique customer metrics from orders
    const customers = await query(`
      SELECT 
        COALESCE(o.customer_name, 'Bilinmeyen Müşteri') as "name",
        COALESCE(o.customer_city, 'Belirtilmedi') as "city",
        COALESCE(o.customer_district, '-') as "district",
        COALESCE(o.customer_email, '-') as "email",
        COALESCE(o.customer_phone, '-') as "phone",
        COUNT(o.id) as "totalOrdersCount",
        SUM(COALESCE(o.paid_amount, o.gross_amount)) as "totalSpendAmount",
        SUM(COALESCE(o.net_profit, 0)) as "totalNetProfit",
        MAX(TO_CHAR(o.order_date, 'YYYY-MM-DD HH24:MI')) as "lastOrderDate"
      FROM orders o
      WHERE ${storeCondition}
      GROUP BY o.customer_name, o.customer_city, o.customer_district, o.customer_email, o.customer_phone
      ORDER BY SUM(COALESCE(o.paid_amount, o.gross_amount)) DESC
      LIMIT 100
    `, storeParams);

    const subCondition = storeId && storeId !== 'all' ? `store_id::text = '${storeId}'` : '1=1';

    const summaryRes = await query(`
      SELECT 
        COUNT(DISTINCT o.customer_name) as "totalCustomers",
        COUNT(DISTINCT o.customer_name) as "totalCustomersCount",
        COUNT(o.id) as "totalOrders",
        COALESCE(SUM(o.paid_amount), 0) as "totalRevenue",
        COALESCE(SUM(o.paid_amount), 0) as "totalLTV",
        COALESCE(SUM(o.net_profit), 0) as "totalProfit",
        ROUND(COALESCE(AVG(o.paid_amount), 0)::numeric, 2) as "avgOrderValue",
        (
          SELECT COUNT(*) FROM (
            SELECT customer_name FROM orders 
            WHERE ${subCondition}
            GROUP BY customer_name 
            HAVING COUNT(id) > 1
          ) sub
        ) as "vipCustomersCount"
      FROM orders o
      WHERE ${storeCondition}
    `, storeParams);

    const summary = summaryRes[0] || {
      totalCustomers: 0,
      totalCustomersCount: 0,
      totalOrders: 0,
      totalRevenue: 0,
      totalLTV: 0,
      totalProfit: 0,
      avgOrderValue: 0,
      vipCustomersCount: 0,
    };

    return NextResponse.json({
      customers,
      summary
    });
  } catch (error: any) {
    console.error('Customers API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
