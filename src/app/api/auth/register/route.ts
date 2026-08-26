import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyName, fullName, email, password } = body;

    if (!email || !password || !fullName || !companyName) {
      return NextResponse.json(
        { error: 'Tüm alanların doldurulması zorunludur.' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = fullName.trim();
    const trimmedCompany = companyName.trim();

    // 1. Check if email already exists
    const existing = await query(`
      SELECT id FROM auth.users WHERE email = $1 LIMIT 1
    `, [trimmedEmail]);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi ile kayıtlı bir hesap zaten mevcut.' },
        { status: 409 }
      );
    }

    // 2. Create User in auth.users
    const nameParts = trimmedName.split(' ');
    const firstName = nameParts[0] || 'Davut';
    const lastName = nameParts.slice(1).join(' ') || 'Akbulut';

    const userRes = await query(`
      INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        $1,
        crypt($2, gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        json_build_object('full_name', $3::text),
        NOW(),
        NOW()
      ) RETURNING id, email;
    `, [trimmedEmail, password, trimmedName]);

    const newUser = userRes[0];
    const userId = newUser.id;

    // 3. Create Company with valid columns
    const randomTaxNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const compRes = await query(`
      INSERT INTO companies (
        id, 
        name, 
        tax_number, 
        tax_office,
        email, 
        phone, 
        address, 
        city, 
        country, 
        created_at, 
        updated_at
      ) VALUES (
        gen_random_uuid(), 
        $1, 
        $2, 
        'Fatih V.D.',
        $3, 
        '0 537 882 68 58', 
        'Molla Gürani, Uygar Sokağı No:17/A', 
        'İstanbul', 
        'Türkiye', 
        NOW(), 
        NOW()
      ) RETURNING id, name;
    `, [trimmedCompany, randomTaxNumber, trimmedEmail]);

    const companyId = compRes[0].id;

    // 4. Create User-Company Role (Admin)
    await query(`
      INSERT INTO user_company_roles (id, user_id, company_id, role, created_at)
      VALUES (gen_random_uuid(), $1, $2, 'admin', NOW());
    `, [userId, companyId]);

    // 5. Create Default Company Settings
    await query(`
      INSERT INTO company_settings (
        id,
        company_id,
        first_name,
        last_name,
        phone,
        email,
        address,
        city,
        district,
        country,
        postal_code,
        extra_operation_rate,
        early_payout_rate,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        '0 537 882 68 58',
        $4,
        'Molla Gürani, Uygar Sokağı No:17/A',
        'İstanbul',
        'Fatih',
        'Türkiye',
        '34093',
        6.00,
        0.16,
        NOW()
      );
    `, [companyId, firstName, lastName, trimmedEmail]);

    // 6. Create Initial Store with lowercase 'trendyol'
    const randomSellerId = Math.floor(100000 + Math.random() * 900000).toString();
    const storeRes = await query(`
      INSERT INTO stores (
        id,
        company_id,
        store_name,
        marketplace,
        seller_id,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        $1,
        $2,
        'trendyol',
        $3,
        true,
        NOW(),
        NOW()
      ) RETURNING id, store_name, marketplace, seller_id;
    `, [companyId, `${trimmedCompany} Trendyol Mağazası`, randomSellerId]);

    const storeId = storeRes[0].id;

    // 7. Assign User Store Permissions
    await query(`
      INSERT INTO user_store_permissions (
        id,
        user_id,
        store_id,
        permissions
      ) VALUES (
        gen_random_uuid(),
        $1,
        $2,
        '{"can_view_profit": true, "allowed_modules": ["all"]}'::jsonb
      );
    `, [userId, storeId]);

    return NextResponse.json({
      success: true,
      message: 'Firma ve kullanıcı hesabı başarıyla oluşturuldu.',
      user: {
        id: userId,
        email: trimmedEmail,
        fullName: trimmedName,
        companyId,
        companyName: trimmedCompany,
        storeId,
        sellerId: randomSellerId
      }
    });

  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: 'Kayıt işlemi sırasında bir hata oluştu: ' + error.message },
      { status: 500 }
    );
  }
}
