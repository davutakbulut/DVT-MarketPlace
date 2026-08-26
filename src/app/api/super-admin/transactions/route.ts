import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const companyId = searchParams.get('companyId') || '';
    const marketplace = searchParams.get('marketplace') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '25', 10);
    const offset = (page - 1) * pageSize;

    let whereClause = '1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (o.marketplace_order_number ILIKE $${paramIndex} OR o.package_number ILIKE $${paramIndex} OR o.customer_city ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex} OR s.store_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (companyId && companyId !== 'all') {
      whereClause += ` AND s.company_id = $${paramIndex}`;
      params.push(companyId);
      paramIndex++;
    }

    if (marketplace && marketplace !== 'all') {
      whereClause += ` AND (s.marketplace = $${paramIndex} OR o.marketplace = $${paramIndex})`;
      params.push(marketplace);
      paramIndex++;
    }

    // 1. Total matching count
    const countRes = await query(`
      SELECT COUNT(*)::int as total
      FROM orders o
      JOIN stores s ON s.id = o.store_id
      JOIN companies c ON c.id = s.company_id
      WHERE ${whereClause}
    `, params);

    const total = countRes[0]?.total || 0;

    // 2. Fetch paginated rows
    const dataQuery = `
      SELECT 
        o.id,
        COALESCE(o.marketplace_order_number, o.package_number, o.id::text) as order_number,
        COALESCE(o.marketplace, s.marketplace, 'trendyol') as marketplace,
        o.status,
        o.customer_city,
        o.gross_amount,
        o.net_profit,
        o.profit_margin_percent as profit_margin,
        o.total_commission as commission_amount,
        o.total_shipping_cost as shipping_cost,
        o.withholding_tax as tax_withholding_amount,
        o.net_vat as kdv_amount,
        o.order_date,
        s.id as store_id,
        s.store_name,
        c.id as company_id,
        c.name as company_name
      FROM orders o
      JOIN stores s ON s.id = o.store_id
      JOIN companies c ON c.id = s.company_id
      WHERE ${whereClause}
      ORDER BY o.order_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const orders = await query(dataQuery, [...params, pageSize, offset]);

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });

  } catch (error: any) {
    console.error('Super Admin Transactions Error:', error);
    return NextResponse.json(
      { error: 'İşlemler alınamadı: ' + error.message },
      { status: 500 }
    );
  }
}
