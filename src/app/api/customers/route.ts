import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerName = searchParams.get('name');

    if (customerName) {
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
          s.marketplace as "marketplace"
        FROM orders o
        LEFT JOIN stores s ON s.id = o.store_id
        WHERE o.customer_name ILIKE $1
        ORDER BY o.order_date DESC
      `, [`%${customerName}%`]);

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
        ROUND(AVG(COALESCE(o.paid_amount, o.gross_amount)), 2) as "averageOrderValue",
        TO_CHAR(MIN(o.order_date), 'YYYY-MM-DD') as "firstOrderDate",
        TO_CHAR(MAX(o.order_date), 'YYYY-MM-DD HH24:MI') as "lastOrderDate",
        CASE 
          WHEN COUNT(o.id) >= 3 THEN 'VIP Sadık Müşteri'
          WHEN COUNT(o.id) = 2 THEN 'Tekrarlayan Müşteri'
          ELSE 'Yeni Müşteri'
        END as "customerTier"
      FROM orders o
      WHERE o.customer_name IS NOT NULL AND o.customer_name != ''
      GROUP BY o.customer_name, o.customer_city, o.customer_district, o.customer_email, o.customer_phone
      ORDER BY SUM(COALESCE(o.paid_amount, o.gross_amount)) DESC
    `);

    const summary = {
      totalCustomers: customers.length,
      totalOrders: customers.reduce((sum: number, c: any) => sum + parseInt(c.totalOrdersCount || 0), 0),
      totalRevenue: customers.reduce((sum: number, c: any) => sum + parseFloat(c.totalSpendAmount || 0), 0),
      totalProfit: customers.reduce((sum: number, c: any) => sum + parseFloat(c.totalNetProfit || 0), 0),
      vipCustomersCount: customers.filter((c: any) => c.customerTier !== 'Yeni Müşteri').length,
    };

    return NextResponse.json({ summary, customers });
  } catch (error: any) {
    console.error('Customers API error:', error);
    return NextResponse.json({ error: 'Müşteri verileri alınamadı: ' + error.message }, { status: 500 });
  }
}
