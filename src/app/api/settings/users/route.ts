import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const users = await query(`
      SELECT 
        u.id, u.email,
        COALESCE(u.raw_user_meta_data->>'full_name', u.email) as "fullName",
        COALESCE(ucr.role, 'admin') as "role",
        COALESCE(ucr.can_view_margins, true) as "canViewMargins",
        COALESCE(ucr.can_view_cogs, true) as "canViewCogs",
        COALESCE(ucr.can_export_reports, true) as "canExportReports",
        COALESCE(ucr.can_edit_prices, true) as "canEditPrices",
        COALESCE(ucr.allowed_stores, ARRAY['all']) as "allowedStores",
        TO_CHAR(u.created_at, 'YYYY-MM-DD') as "createdAt"
      FROM auth.users u
      LEFT JOIN user_company_roles ucr ON ucr.user_id = u.id
      ORDER BY u.created_at ASC
    `);

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Users fetch error:', error);
    return NextResponse.json({ error: 'Kullanıcılar alınamadı.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, role, canViewMargins, canViewCogs, canExportReports, canEditPrices, allowedStores } = await request.json();
    if (!userId || !role) {
      return NextResponse.json({ error: 'Eksik parametre.' }, { status: 400 });
    }

    const compRes = await query('SELECT id FROM companies LIMIT 1');
    const compId = compRes[0]?.id || '11111111-1111-1111-1111-111111111111';

    const existing = await query('SELECT id FROM user_company_roles WHERE user_id = $1', [userId]);

    if (existing.length > 0) {
      await query(`
        UPDATE user_company_roles
        SET role = $1, can_view_margins = $2, can_view_cogs = $3,
            can_export_reports = $4, can_edit_prices = $5, allowed_stores = $6, updated_at = now()
        WHERE user_id = $7
      `, [role, canViewMargins ?? true, canViewCogs ?? true, canExportReports ?? true, canEditPrices ?? true, allowedStores || ['all'], userId]);
    } else {
      await query(`
        INSERT INTO user_company_roles (
          user_id, company_id, role, can_view_margins, can_view_cogs, can_export_reports, can_edit_prices, allowed_stores
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [userId, compId, role, canViewMargins ?? true, canViewCogs ?? true, canExportReports ?? true, canEditPrices ?? true, allowedStores || ['all']]);
    }

    return NextResponse.json({ success: true, message: 'Kullanıcı rolü ve kâr maskeleme yetkileri veritabanına kaydedildi!' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Yetkiler güncellenemedi.' }, { status: 500 });
  }
}
