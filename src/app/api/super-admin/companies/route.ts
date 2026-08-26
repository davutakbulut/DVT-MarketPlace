import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const companies = await query(`
      SELECT 
        c.id,
        c.name,
        c.tax_number,
        c.tax_office,
        c.email,
        c.phone,
        c.address,
        c.city,
        c.country,
        c.created_at,
        (
          SELECT json_agg(json_build_object(
            'id', s.id,
            'name', s.store_name,
            'marketplace', s.marketplace,
            'sellerId', s.seller_id,
            'isActive', s.is_active,
            'lastSyncedAt', s.last_synced_at
          ))
          FROM stores s
          WHERE s.company_id = c.id
        ) as stores,
        (
          SELECT json_agg(json_build_object(
            'id', u.id,
            'email', u.email,
            'fullName', COALESCE(u.raw_user_meta_data->>'full_name', u.email),
            'role', ucr.role
          ))
          FROM user_company_roles ucr
          JOIN auth.users u ON u.id = ucr.user_id
          WHERE ucr.company_id = c.id
        ) as users,
        COUNT(DISTINCT o.id)::int as total_orders,
        COALESCE(SUM(o.gross_amount), 0)::float as total_gmv,
        COALESCE(SUM(o.net_profit), 0)::float as total_profit
      FROM companies c
      LEFT JOIN stores s ON s.company_id = c.id
      LEFT JOIN orders o ON o.store_id = s.id
      GROUP BY c.id, c.name, c.tax_number, c.tax_office, c.email, c.phone, c.address, c.city, c.country, c.created_at
      ORDER BY total_gmv DESC, c.created_at DESC
    `);

    return NextResponse.json({
      success: true,
      companies: companies.map(c => ({
        id: c.id,
        name: c.name,
        taxNumber: c.tax_number,
        taxOffice: c.tax_office,
        email: c.email,
        phone: c.phone,
        address: c.address,
        city: c.city,
        country: c.country,
        createdAt: c.created_at,
        stores: c.stores || [],
        users: c.users || [],
        totalOrders: c.total_orders,
        totalGMV: c.total_gmv,
        totalProfit: c.total_profit
      }))
    });
  } catch (error: any) {
    console.error('Super Admin Companies Error:', error);
    return NextResponse.json(
      { error: 'Firmalar alınamadı: ' + error.message },
      { status: 500 }
    );
  }
}
