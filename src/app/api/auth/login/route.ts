import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email, password, rememberMe } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'E-posta ve şifre zorunludur.' }, { status: 400 });
    }

    // Verify user in auth.users using pgcrypto crypt
    const users = await query(`
      SELECT id, email, raw_user_meta_data, encrypted_password, is_super_admin
      FROM auth.users
      WHERE email = $1 AND encrypted_password = crypt($2, encrypted_password)
    `, [email, password]);

    if (users.length === 0) {
      return NextResponse.json({ error: 'Geçersiz e-posta veya şifre.' }, { status: 401 });
    }

    const user = users[0];

    // Fetch user's company and roles
    const roles = await query(`
      SELECT ucr.role, ucr.company_id, c.name as company_name
      FROM user_company_roles ucr
      JOIN companies c ON c.id = ucr.company_id
      WHERE ucr.user_id = $1
    `, [user.id]);

    const role = roles.length > 0 ? roles[0].role : 'user';
    const companyId = roles.length > 0 ? roles[0].company_id : null;
    const companyName = roles.length > 0 ? roles[0].company_name : '';
    const isSuperAdmin = !!(user.is_super_admin || user.raw_user_meta_data?.is_super_admin || role === 'super_admin');

    // Fetch permitted stores
    const stores = await query(`
      SELECT s.id, s.store_name, s.marketplace, s.seller_id, usp.permissions
      FROM stores s
      LEFT JOIN user_store_permissions usp ON usp.store_id = s.id AND usp.user_id = $1
      WHERE s.company_id = $2 AND s.is_active = true
    `, [user.id, companyId]);

    const sessionPayload = {
      user: {
        id: user.id,
        email: user.email,
        name: user.raw_user_meta_data?.full_name || user.email,
        role: role,
        isSuperAdmin: isSuperAdmin,
        companyId: companyId,
        companyName: companyName,
      },
      stores: stores.map(s => ({
        id: s.id,
        name: s.store_name,
        marketplace: s.marketplace,
        sellerId: s.seller_id,
        permissions: s.permissions || { can_view_profit: true, allowed_modules: ['all'] },
      }))
    };

    const cookieMaxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // 30 days vs 1 day

    const response = NextResponse.json({ success: true, ...sessionPayload });
    response.cookies.set('dvt_session', JSON.stringify(sessionPayload), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: cookieMaxAge,
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Giriş yapılırken sunucu hatası oluştu.' }, { status: 500 });
  }
}
