import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { buildDateConditions } from '@/lib/dateFilterHelper';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    // Fetch dynamic extra operation rate from company_settings (default 6.00%)
    const settingsRes = await query(`SELECT extra_operation_rate as "extraOperationRate" FROM company_settings LIMIT 1`);
    const extraOpRate = parseFloat(settingsRes[0]?.extraOperationRate ?? 6.00);
    const extraOpFraction = extraOpRate / 100.0;

    let conditions: string[] = [];
    let params: any[] = [];
    let pIdx = 1;

    if (storeId && storeId !== 'all') {
      conditions.push(`o.store_id::text = $${pIdx}`);
      params.push(storeId);
      pIdx++;
    }

    // Apply Date Conditions
    const dateHelper = buildDateConditions(searchParams, 'o.order_date', pIdx);
    if (dateHelper.whereClause && dateHelper.whereClause !== '1=1') {
      conditions.push(dateHelper.whereClause);
      params.push(...dateHelper.params);
      pIdx = dateHelper.nextIndex;
    }

    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';

    // Add extraOpFraction as parameter for dynamic calculation
    const extraParamIdx = pIdx;
    params.push(extraOpFraction);
    pIdx++;

    // Overall Totals for Selected Period with Dynamic Extra Operation Cost
    const orderAgg = await query(`
      SELECT 
        COALESCE(SUM(o.gross_amount), 0) as gross_revenue,
        COALESCE(SUM(o.paid_amount), 0) as invoiced_revenue,
        COALESCE(SUM(o.total_cost), 0) as total_cogs,
        COALESCE(SUM(o.total_commission), 0) as commission_total,
        COALESCE(SUM(o.total_shipping_cost), 0) as shipping_total,
        COALESCE(SUM(o.service_fee), 0) as service_fee_total,
        COALESCE(SUM(o.withholding_tax + o.net_vat), 0) as taxes_total,
        COALESCE(SUM(o.gross_amount * $${extraParamIdx}), 0) as extra_operation_total,
        COALESCE(SUM(o.paid_amount - (o.total_cost + o.total_commission + o.total_shipping_cost + o.service_fee + o.withholding_tax + o.net_vat + (o.gross_amount * $${extraParamIdx}))), 0) as net_profit,
        COUNT(o.id) as total_orders
      FROM orders o
      WHERE ${whereClause}
    `, params);

    const agg = orderAgg[0] || {};
    const gross = parseFloat(agg.gross_revenue) || 0;
    const paid = parseFloat(agg.invoiced_revenue) || gross;
    const netProfit = parseFloat(agg.net_profit) || 0;
    const cogs = parseFloat(agg.total_cogs) || 0;
    const extraOperationTotal = parseFloat(agg.extra_operation_total) || 0;
    const netProfitMargin = paid > 0 ? (netProfit / paid) * 100 : 0;
    const netProfitMarkup = cogs > 0 ? (netProfit / cogs) * 100 : 0;

    // Monthly breakdown (All Months)
    const monthlyTrends = await query(`
      SELECT 
        TO_CHAR(o.order_date, 'YYYY-MM') as "monthKey",
        TO_CHAR(o.order_date, 'TMMonth YYYY') as "monthLabel",
        COUNT(o.id) as "orderCount",
        COALESCE(SUM(o.gross_amount), 0) as "revenue",
        COALESCE(SUM(o.paid_amount - (o.total_cost + o.total_commission + o.total_shipping_cost + o.service_fee + o.withholding_tax + o.net_vat + (o.gross_amount * $1))), 0) as "profit",
        ROUND((COALESCE(SUM(o.paid_amount - (o.total_cost + o.total_commission + o.total_shipping_cost + o.service_fee + o.withholding_tax + o.net_vat + (o.gross_amount * $1))), 0) / NULLIF(SUM(o.paid_amount), 0) * 100)::numeric, 1) as "margin"
      FROM orders o
      GROUP BY TO_CHAR(o.order_date, 'YYYY-MM'), TO_CHAR(o.order_date, 'TMMonth YYYY')
      ORDER BY TO_CHAR(o.order_date, 'YYYY-MM') ASC
    `, [extraOpFraction]);

    // Carrier distribution for Selected Period
    const carrierDistribution = await query(`
      SELECT 
        COALESCE(o.carrier_name, 'Trendyol Express') as "carrier",
        COUNT(o.id) as "orderCount",
        SUM(o.total_shipping_cost) as "totalShippingCost",
        ROUND(AVG(o.billed_desi), 1) as "avgDesi",
        SUM(o.paid_amount - (o.total_cost + o.total_commission + o.total_shipping_cost + o.service_fee + o.withholding_tax + o.net_vat + (o.gross_amount * $${extraParamIdx}))) as "profit"
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
        SUM(o.paid_amount - (o.total_cost + o.total_commission + o.total_shipping_cost + o.service_fee + o.withholding_tax + o.net_vat + (o.gross_amount * $${extraParamIdx}))) as "profit"
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
        SUM(oi.invoiced_amount - (oi.unit_cost_price * oi.quantity + (oi.invoiced_amount * 0.16) + (oi.invoiced_amount * $${extraParamIdx}))) as "totalProfit",
        ROUND((SUM(oi.invoiced_amount - (oi.unit_cost_price * oi.quantity + (oi.invoiced_amount * 0.16) + (oi.invoiced_amount * $${extraParamIdx}))) / NULLIF(SUM(oi.invoiced_amount), 0) * 100)::numeric, 1) as "avgMargin"
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE ${whereClause}
      GROUP BY oi.barcode, oi.title, oi.brand
      ORDER BY SUM(oi.invoiced_amount) DESC
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
        ROUND((o.paid_amount - (o.total_cost + o.total_commission + o.total_shipping_cost + o.service_fee + o.withholding_tax + o.net_vat + (o.gross_amount * $${extraParamIdx})))::numeric, 2) as "netProfit",
        ROUND(((o.paid_amount - (o.total_cost + o.total_commission + o.total_shipping_cost + o.service_fee + o.withholding_tax + o.net_vat + (o.gross_amount * $${extraParamIdx}))) / NULLIF(o.paid_amount, 0) * 100)::numeric, 1) as "marginPercent",
        o.status
      FROM orders o
      WHERE ${whereClause}
      ORDER BY o.order_date DESC
      LIMIT 8
    `, params);

    // Stores list
    const stores = await query(`SELECT id, store_name as "storeName", marketplace FROM stores ORDER BY created_at ASC`);

    return NextResponse.json({
      grossRevenue: gross,
      invoicedRevenue: paid,
      grossProfit: gross - cogs,
      netProfit,
      extraOperationTotal,
      extraOperationRate: extraOpRate,
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
