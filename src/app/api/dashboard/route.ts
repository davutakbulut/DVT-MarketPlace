import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const period = searchParams.get('period') || 'all'; // 'all', '2026-05', '2026-06', '2026-07', '2026-08', 'last30', 'thisWeek'

    let conditions = ['1=1'];
    let params: any[] = [];
    let pIdx = 1;

    if (storeId && storeId !== 'all') {
      conditions.push(`o.store_id = $${pIdx}`);
      params.push(storeId);
      pIdx++;
    }

    if (period === '2026-05' || period === '2026-06' || period === '2026-07' || period === '2026-08') {
      conditions.push(`TO_CHAR(o.order_date, 'YYYY-MM') = $${pIdx}`);
      params.push(period);
      pIdx++;
    } else if (period === 'last30') {
      conditions.push(`o.order_date >= (SELECT MAX(order_date) - INTERVAL '30 days' FROM orders)`);
    } else if (period === 'thisWeek') {
      conditions.push(`o.order_date >= (SELECT MAX(order_date) - INTERVAL '7 days' FROM orders)`);
    }

    const whereClause = conditions.join(' AND ');

    // Overall Totals for Selected Period
    const orderAgg = await query(`
      SELECT 
        COALESCE(SUM(o.gross_amount), 0) as gross_revenue,
        COALESCE(SUM(o.paid_amount), 0) as invoiced_revenue,
        COALESCE(SUM(o.total_cost), 0) as total_cogs,
        COALESCE(SUM(o.total_commission), 0) as commission_total,
        COALESCE(SUM(o.total_shipping_cost), 0) as shipping_total,
        COALESCE(SUM(o.service_fee), 0) as service_fee_total,
        COALESCE(SUM(o.withholding_tax + o.net_vat), 0) as taxes_total,
        COALESCE(SUM(o.net_profit), 0) as net_profit,
        COUNT(o.id) as total_orders
      FROM orders o
      WHERE ${whereClause}
    `, params);

    const agg = orderAgg[0] || {};
    const gross = parseFloat(agg.gross_revenue) || 0;
    const paid = parseFloat(agg.invoiced_revenue) || gross;
    const netProfit = parseFloat(agg.net_profit) || 0;
    const cogs = parseFloat(agg.total_cogs) || 0;
    const netProfitMargin = paid > 0 ? (netProfit / paid) * 100 : 0;
    const netProfitMarkup = cogs > 0 ? (netProfit / cogs) * 100 : 0;

    // Monthly breakdown
    const monthlyTrends = await query(`
      SELECT 
        TO_CHAR(o.order_date, 'YYYY-MM') as "monthKey",
        TO_CHAR(o.order_date, 'TMMonth YYYY') as "monthLabel",
        COUNT(o.id) as "orderCount",
        SUM(o.gross_amount) as "revenue",
        SUM(o.net_profit) as "profit",
        ROUND(AVG(o.profit_margin_percent), 1) as "margin"
      FROM orders o
      GROUP BY TO_CHAR(o.order_date, 'YYYY-MM'), TO_CHAR(o.order_date, 'TMMonth YYYY')
      ORDER BY TO_CHAR(o.order_date, 'YYYY-MM') ASC
    `);

    // Carrier distribution for Selected Period
    const carrierDistribution = await query(`
      SELECT 
        COALESCE(o.carrier_name, 'Trendyol Express') as "carrier",
        COUNT(o.id) as "orderCount",
        SUM(o.total_shipping_cost) as "totalShippingCost",
        ROUND(AVG(o.billed_desi), 1) as "avgDesi",
        SUM(o.net_profit) as "profit"
      FROM orders o
      WHERE ${whereClause}
      GROUP BY o.carrier_name
      ORDER BY COUNT(o.id) DESC
    `, params);

    // Hourly Order Distribution (Heatmap 0-23 hours)
    const hourlyDistribution = await query(`
      SELECT 
        EXTRACT(HOUR FROM o.order_date)::int as "hour",
        COUNT(o.id) as "orderCount",
        SUM(o.paid_amount) as "revenue",
        SUM(o.net_profit) as "profit"
      FROM orders o
      WHERE ${whereClause}
      GROUP BY EXTRACT(HOUR FROM o.order_date)
      ORDER BY EXTRACT(HOUR FROM o.order_date) ASC
    `, params);

    // Top profitable products for Selected Period
    const topProducts = await query(`
      SELECT 
        oi.barcode,
        oi.title,
        oi.brand,
        SUM(oi.quantity) as "totalQuantity",
        SUM(oi.invoiced_amount) as "totalRevenue",
        SUM(oi.net_profit) as "totalProfit",
        ROUND(AVG(oi.margin_percent), 1) as "avgMargin"
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE ${whereClause}
      GROUP BY oi.barcode, oi.title, oi.brand
      ORDER BY SUM(oi.net_profit) DESC
      LIMIT 5
    `, params);

    // Recent orders for Selected Period
    const recentOrders = await query(`
      SELECT 
        o.id,
        o.marketplace_order_number as "orderNumber",
        TO_CHAR(o.order_date, 'YYYY-MM-DD HH24:MI') as "orderDate",
        o.customer_name as "customerName",
        o.customer_city as "city",
        o.carrier_name as "carrierName",
        o.paid_amount as "paidAmount",
        o.net_profit as "netProfit",
        o.profit_margin_percent as "marginPercent",
        o.status
      FROM orders o
      WHERE ${whereClause}
      ORDER BY o.order_date DESC
      LIMIT 8
    `, params);

    // Stores list for Store Dropdown
    const stores = await query(`
      SELECT id, store_name as "storeName", marketplace FROM stores ORDER BY created_at ASC
    `);

    return NextResponse.json({
      selectedPeriod: period,
      grossRevenue: gross,
      invoicedRevenue: paid,
      grossProfit: gross - cogs,
      netProfit,
      netProfitMargin: Math.round(netProfitMargin * 100) / 100,
      netProfitMarkup: Math.round(netProfitMarkup * 100) / 100,
      shippingTotal: parseFloat(agg.shipping_total) || 0,
      commissionTotal: parseFloat(agg.commission_total) || 0,
      taxesTotal: parseFloat(agg.taxes_total) || 0,
      serviceFeeTotal: parseFloat(agg.service_fee_total) || 0,
      totalOrders: parseInt(agg.total_orders) || 0,
      monthlyTrends,
      carrierDistribution,
      hourlyDistribution,
      topProducts,
      recentOrders,
      stores
    });
  } catch (error: any) {
    console.error('Dashboard DB fetch error:', error);
    return NextResponse.json({ error: 'Veritabanından çekilemedi: ' + error.message }, { status: 500 });
  }
}
