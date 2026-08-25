import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_STORE_ID = '22222222-2222-2222-2222-222222222221';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let storeId = searchParams.get('storeId');

    // If storeId is missing, empty, or not a valid UUID (e.g. 'store-1'), resolve to default store UUID
    if (!storeId || !UUID_REGEX.test(storeId)) {
      const storeRows = await query('SELECT id FROM stores LIMIT 1');
      storeId = storeRows.length > 0 ? storeRows[0].id : DEFAULT_STORE_ID;
    }

    const orderAgg = await query(`
      SELECT 
        COALESCE(SUM(gross_amount), 0) as gross_revenue,
        COALESCE(SUM(total_cost), 0) as total_cogs,
        COALESCE(SUM(total_commission), 0) as commission_total,
        COALESCE(SUM(total_shipping_cost), 0) as shipping_total,
        COALESCE(SUM(service_fee), 0) as service_fee_total,
        COALESCE(SUM(withholding_tax + net_vat), 0) as taxes_total,
        COALESCE(SUM(net_profit), 0) as net_profit,
        COUNT(id) as total_orders
      FROM orders
      WHERE store_id = $1
    `, [storeId]);

    const agg = orderAgg[0] || {};
    const gross = parseFloat(agg.gross_revenue) || 0;
    const netProfit = parseFloat(agg.net_profit) || 0;
    const cogs = parseFloat(agg.total_cogs) || 0;

    const netProfitMargin = gross > 0 ? (netProfit / gross) * 100 : 0;
    const netProfitMarkup = cogs > 0 ? (netProfit / cogs) * 100 : 0;

    const missingCosts = await query(`
      SELECT COUNT(id) as count
      FROM products
      WHERE store_id = $1 AND current_cost = 0
    `, [storeId]);

    return NextResponse.json({
      grossRevenue: gross,
      costCoveredRevenue: gross,
      grossProfit: gross - cogs,
      netProfit,
      netProfitMargin: Math.round(netProfitMargin * 100) / 100,
      netProfitMarkup: Math.round(netProfitMarkup * 100) / 100,
      shippingTotal: parseFloat(agg.shipping_total) || 0,
      commissionTotal: parseFloat(agg.commission_total) || 0,
      taxesTotal: parseFloat(agg.taxes_total) || 0,
      serviceFeeTotal: parseFloat(agg.service_fee_total) || 0,
      totalOrders: parseInt(agg.total_orders) || 0,
      missingCostsCount: parseInt(missingCosts[0]?.count) || 0,
    });
  } catch (error: any) {
    console.error('Dashboard DB fetch error:', error);
    return NextResponse.json({ error: 'Veritabanından çekilemedi.' }, { status: 500 });
  }
}
