import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await query(`
      SELECT 
        u.id,
        u.email,
        u.is_super_admin,
        COALESCE(u.raw_user_meta_data->>'full_name', u.email) as full_name,
        u.created_at,
        u.last_sign_in_at,
        ucr.role,
        c.id as company_id,
        c.name as company_name,
        (
          SELECT json_agg(json_build_object(
            'id', s.id,
            'name', s.store_name,
            'marketplace', s.marketplace
          ))
          FROM stores s
          WHERE s.company_id = c.id
        ) as stores
      FROM auth.users u
      LEFT JOIN user_company_roles ucr ON ucr.user_id = u.id
      LEFT JOIN companies c ON c.id = ucr.company_id
      ORDER BY u.created_at DESC
    `);

    return NextResponse.json({
      success: true,
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        fullName: u.full_name,
        role: u.role || 'user',
        isSuperAdmin: !!u.is_super_admin,
        companyId: u.company_id,
        companyName: u.company_name || 'Atanmamış',
        stores: u.stores || [],
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at
      }))
    });
  } catch (error: any) {
    console.error('Super Admin Users Error:', error);
    return NextResponse.json(
      { error: 'Kullanıcılar alınamadı: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { userId, isSuperAdmin, role } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Kullanıcı ID gereklidir.' }, { status: 400 });
    }

    if (typeof isSuperAdmin === 'boolean') {
      await query(`
        UPDATE auth.users 
        SET 
          is_super_admin = $1,
          raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{is_super_admin}', $2::jsonb)
        WHERE id = $3
      `, [isSuperAdmin, isSuperAdmin ? 'true' : 'false', userId]);
    }

    if (role) {
      await query(`
        UPDATE user_company_roles
        SET role = $1
        WHERE user_id = $2
      `, [role, userId]);
    }

    return NextResponse.json({
      success: true,
      message: 'Kullanıcı yetkileri başarıyla güncellendi.'
    });
  } catch (error: any) {
    console.error('Super Admin User Update Error:', error);
    return NextResponse.json(
      { error: 'Kullanıcı güncellenemedi: ' + error.message },
      { status: 500 }
    );
  }
}
