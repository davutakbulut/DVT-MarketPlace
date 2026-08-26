import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Total Global KPIs across all tenants
    const totalsRes = await query(`
      SELECT 
        COUNT(DISTINCT o.id)::int as total_orders,
        COALESCE(SUM(o.gross_amount), 0)::float as total_gmv,
        COALESCE(SUM(o.net_profit), 0)::float as total_profit,
        COALESCE(AVG(o.gross_amount), 0)::float as avg_order_value
      FROM orders o
    `);

    const totals = totalsRes[0] || {
      total_orders: 0,
      total_gmv: 0,
      total_profit: 0,
      avg_order_value: 0
    };

    // 2. Count of Companies, Stores, Users, Active Crashes
    const countsRes = await query(`
      SELECT 
        (SELECT COUNT(*)::int FROM companies) as total_companies,
        (SELECT COUNT(*)::int FROM stores WHERE is_active = true) as total_stores,
        (SELECT COUNT(*)::int FROM auth.users) as total_users,
        (SELECT COUNT(*)::int FROM system_crash_logs WHERE resolved_at IS NULL) as active_crashes
    `);

    const counts = countsRes[0] || {
      total_companies: 0,
      total_stores: 0,
      total_users: 0,
      active_crashes: 0
    };

    // 3. Performance by Company
    const companiesRes = await query(`
      SELECT 
        c.id,
        c.name,
        c.tax_number,
        c.city,
        c.created_at,
        COUNT(DISTINCT s.id)::int as store_count,
        COUNT(DISTINCT o.id)::int as order_count,
        COALESCE(SUM(o.gross_amount), 0)::float as gmv,
        COALESCE(SUM(o.net_profit), 0)::float as profit
      FROM companies c
      LEFT JOIN stores s ON s.company_id = c.id
      LEFT JOIN orders o ON o.store_id = s.id
      GROUP BY c.id, c.name, c.tax_number, c.city, c.created_at
      ORDER BY gmv DESC
      LIMIT 10
    `);

    // 4. Marketplace Distribution
    const marketplaceRes = await query(`
      SELECT 
        COALESCE(s.marketplace, 'trendyol') as marketplace,
        COUNT(DISTINCT o.id)::int as orders,
        COALESCE(SUM(o.gross_amount), 0)::float as gmv,
        COALESCE(SUM(o.net_profit), 0)::float as profit
      FROM orders o
      JOIN stores s ON s.id = o.store_id
      GROUP BY s.marketplace
    `);

    // 5. Recent Global Orders across all tenants
    const recentOrdersRes = await query(`
      SELECT 
        o.id,
        COALESCE(o.marketplace_order_number, o.package_number, o.id::text) as order_number,
        COALESCE(o.marketplace, s.marketplace, 'trendyol') as marketplace,
        o.customer_city,
        o.status,
        o.gross_amount,
        o.net_profit,
        o.profit_margin_percent as profit_margin,
        o.order_date,
        s.store_name,
        c.name as company_name
      FROM orders o
      LEFT JOIN stores s ON s.id = o.store_id
      LEFT JOIN companies c ON c.id = s.company_id
      ORDER BY o.order_date DESC
      LIMIT 12
    `);

    return NextResponse.json({
      success: true,
      totals: {
        totalGMV: totals.total_gmv,
        totalNetProfit: totals.total_profit,
        totalOrders: totals.total_orders,
        avgOrderValue: totals.avg_order_value,
        totalCompanies: counts.total_companies,
        totalStores: counts.total_stores,
        totalUsers: counts.total_users,
        activeCrashes: counts.active_crashes,
        platformProfitMargin: totals.total_gmv > 0 ? (totals.total_profit / totals.total_gmv) * 100 : 0
      },
      companies: companiesRes,
      marketplaceShare: marketplaceRes,
      recentOrders: recentOrdersRes
    });

  } catch (error: any) {
    console.error('Super Admin Stats Error:', error);
    return NextResponse.json(
      { error: 'Süper admin istatistikleri alınamadı: ' + error.message },
      { status: 500 }
    );
  }
}
