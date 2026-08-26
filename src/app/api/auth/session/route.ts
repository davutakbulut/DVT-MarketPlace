import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('dvt_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const userId = session.user?.id;

    if (!userId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Direct Database check: Verify user is still active in auth.users
    const userRows = await query(`
      SELECT u.id, u.email, u.is_super_admin, u.raw_user_meta_data, ucr.role, ucr.company_id, c.name as company_name
      FROM auth.users u
      LEFT JOIN user_company_roles ucr ON ucr.user_id = u.id
      LEFT JOIN companies c ON c.id = ucr.company_id
      WHERE u.id = $1
    `, [userId]);

    if (userRows.length === 0) {
      return NextResponse.json({ authenticated: false, error: 'Kullanıcı veritabanında bulunamadı.' }, { status: 401 });
    }

    const dbUser = userRows[0];
    const isSuperAdmin = !!(dbUser.is_super_admin || dbUser.raw_user_meta_data?.is_super_admin || dbUser.role === 'super_admin');

    // Fetch user's active stores directly from DB
    const storeRows = await query(`
      SELECT s.id, s.store_name as name, s.marketplace, s.seller_id as "sellerId", usp.permissions
      FROM stores s
      LEFT JOIN user_store_permissions usp ON usp.store_id = s.id AND usp.user_id = $1
      WHERE s.company_id = $2 AND s.is_active = true
      ORDER BY s.created_at ASC
    `, [userId, dbUser.company_id]);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.raw_user_meta_data?.full_name || dbUser.email,
        role: dbUser.role || 'user',
        isSuperAdmin: isSuperAdmin,
        companyId: dbUser.company_id,
        companyName: dbUser.company_name || 'Firma',
      },
      stores: storeRows.map((s) => ({
        id: s.id,
        name: s.name,
        marketplace: s.marketplace,
        sellerId: s.sellerId,
        permissions: s.permissions || { can_view_profit: true, allowed_modules: ['all'] },
      })),
    });
  } catch (error: any) {
    console.error('Session DB check error:', error);
    return NextResponse.json({ authenticated: false, error: 'Oturum doğrulanamadı.' }, { status: 500 });
  }
}
