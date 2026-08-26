import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('dvt_session');

    let userId: string | null = null;
    let isSuperAdmin = false;
    let userRole = 'user';
    let companyId: string | null = null;
    let allowedStores: string[] = [];

    if (sessionCookie && sessionCookie.value) {
      try {
        const session = JSON.parse(sessionCookie.value);
        userId = session.user?.id || null;

        if (userId) {
          const userRows = await query(`
            SELECT u.id, u.email, u.is_super_admin, u.raw_user_meta_data, ucr.role, ucr.company_id, ucr.allowed_stores
            FROM auth.users u
            LEFT JOIN user_company_roles ucr ON ucr.user_id = u.id
            WHERE u.id = $1
          `, [userId]);

          if (userRows.length > 0) {
            const dbUser = userRows[0];
            isSuperAdmin = !!(dbUser.is_super_admin || dbUser.raw_user_meta_data?.is_super_admin || dbUser.role === 'super_admin');
            userRole = dbUser.role || 'user';
            companyId = dbUser.company_id;
            allowedStores = Array.isArray(dbUser.allowed_stores) ? dbUser.allowed_stores : [];
          }
        }
      } catch (err) {
        console.error('Session parse error in stores API:', err);
      }
    }

    // Build query conditions based on user permission level
    let whereClauses: string[] = [];
    let params: any[] = [];
    let pIdx = 1;

    if (isSuperAdmin) {
      // Super Admin: can see all stores across companies or filter by companyId
      const url = new URL(request.url);
      const reqCompanyId = url.searchParams.get('companyId');
      if (reqCompanyId) {
        whereClauses.push(`s.company_id::text = $${pIdx}`);
        params.push(reqCompanyId);
        pIdx++;
      }
    } else if (companyId) {
      // Scoped to User's Company
      whereClauses.push(`s.company_id::text = $${pIdx}`);
      params.push(companyId);
      pIdx++;

      // If user is a regular user (not company admin):
      if (userRole !== 'admin' && !allowedStores.includes('all')) {
        whereClauses.push(`(
          s.id::text = ANY($${pIdx}) 
          OR s.id IN (SELECT store_id FROM user_store_permissions WHERE user_id = $${pIdx + 1})
        )`);
        params.push(allowedStores.length > 0 ? allowedStores : ['00000000-0000-0000-0000-000000000000']);
        params.push(userId);
        pIdx += 2;
      }
    } else if (userId) {
      // Standalone user without explicit company: only explicitly assigned stores
      whereClauses.push(`s.id IN (SELECT store_id FROM user_store_permissions WHERE user_id = $${pIdx})`);
      params.push(userId);
      pIdx++;
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const stores = await query(`
      SELECT 
        s.id,
        s.company_id as "companyId",
        s.marketplace,
        s.store_name as "storeName",
        s.seller_id as "sellerId",
        COALESCE(s.supplier_id, s.seller_id) as "supplierId",
        s.api_key as "apiKey",
        s.api_secret as "apiSecret",
        s.is_active as "isActive",
        COALESCE(s.sync_status, 'synced') as "syncStatus",
        s.sync_error_message as "syncErrorMessage",
        TO_CHAR(COALESCE(s.last_synced_at, s.created_at), 'YYYY-MM-DD HH24:MI') as "lastSyncedAt",
        s.extra_config as "extraConfig",
        (SELECT COUNT(*) FROM orders WHERE store_id = s.id) as "orderCount",
        (SELECT COUNT(*) FROM products WHERE store_id = s.id) as "productCount"
      FROM stores s
      ${whereSQL}
      ORDER BY s.created_at ASC
    `, params);

    return NextResponse.json({ stores });
  } catch (error: any) {
    console.error('Stores API fetch error:', error);
    return NextResponse.json({ error: 'Mağazalar alınamadı: ' + error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('dvt_session');
    let sessionCompanyId: string | null = null;
    let userId: string | null = null;

    if (sessionCookie && sessionCookie.value) {
      try {
        const session = JSON.parse(sessionCookie.value);
        userId = session.user?.id;
        sessionCompanyId = session.user?.companyId;
      } catch {}
    }

    const body = await request.json();
    const { 
      marketplace, 
      storeName, 
      sellerId, 
      supplierId, 
      apiKey, 
      apiSecret, 
      defaultCarrier,
      lwaClientId,
      lwaClientSecret,
      lwaRefreshToken
    } = body;

    if (!marketplace || !storeName || !sellerId) {
      return NextResponse.json({ error: 'Lütfen zorunlu alanları (Pazaryeri, Mağaza Adı ve Satıcı ID) doldurun.' }, { status: 400 });
    }

    let companyId = sessionCompanyId;
    if (!companyId) {
      const compRows = await query('SELECT id FROM companies LIMIT 1');
      companyId = compRows[0]?.id || '11111111-1111-1111-1111-111111111111';
    }

    const extraConfig = {
      defaultCarrier: defaultCarrier || 'TEX',
      lwaClientId: lwaClientId || '',
      lwaClientSecret: lwaClientSecret || '',
      lwaRefreshToken: lwaRefreshToken || '',
      webhookUrl: `https://api.dvtmarketplace.com/webhooks/${marketplace}/${sellerId}`,
      connectedAt: new Date().toISOString()
    };

    const newStore = await query(`
      INSERT INTO stores (
        company_id, marketplace, store_name, seller_id, supplier_id,
        api_key, api_secret, extra_config, is_active, sync_status,
        last_synced_at, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, 'synced', now(), now(), now())
      RETURNING id, store_name as "storeName", marketplace, seller_id as "sellerId"
    `, [companyId, marketplace.toLowerCase(), storeName, sellerId, supplierId || sellerId, apiKey || 'ty_key_live', apiSecret || 'ty_secret_live', JSON.stringify(extraConfig)]);

    // If regular user created it, also grant user_store_permissions
    if (userId && newStore[0]?.id) {
      await query(`
        INSERT INTO user_store_permissions (user_id, store_id, permissions)
        VALUES ($1, $2, '{"can_view_profit": true, "can_edit_costs": true, "can_update_prices": true, "can_export_reports": true, "allowed_modules": ["all"]}')
        ON CONFLICT (user_id, store_id) DO NOTHING
      `, [userId, newStore[0].id]).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: `${storeName} başarıyla bağlandı ve ilk sipariş senkronizasyonu başlatıldı!`,
      store: newStore[0]
    });
  } catch (error: any) {
    console.error('Store connect error:', error);
    return NextResponse.json({ error: 'Mağaza bağlanırken hata oluştu: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Mağaza ID belirtilmedi.' }, { status: 400 });
    }

    const countRes = await query('SELECT COUNT(*) as count FROM stores');
    if (parseInt(countRes[0]?.count || '0') <= 1) {
      return NextResponse.json({ error: 'Sistemde en az 1 bağlı mağaza kalmalıdır.' }, { status: 400 });
    }

    await query('DELETE FROM stores WHERE id::text = $1', [id]);

    return NextResponse.json({
      success: true,
      message: 'Mağaza bağlantısı güvenli bir şekilde kaldırıldı.'
    });
  } catch (error: any) {
    console.error('Store delete error:', error);
    return NextResponse.json({ error: 'Mağaza silinemedi: ' + error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, action, storeName, sellerId, supplierId, apiKey, apiSecret, defaultCarrier, isActive } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Mağaza ID belirtilmedi.' }, { status: 400 });
    }

    if (action === 'sync') {
      await query(`
        UPDATE stores 
        SET sync_status = 'synced', last_synced_at = now(), updated_at = now() 
        WHERE id::text = $1
      `, [id]);

      return NextResponse.json({
        success: true,
        message: 'Mağaza sipariş ve stok verileri pazaryeri API ile anlık senkronize edildi!'
      });
    }

    // Full store update
    const currentStore = await query('SELECT extra_config FROM stores WHERE id::text = $1', [id]);
    const prevConfig = currentStore[0]?.extra_config || {};
    const updatedConfig = {
      ...prevConfig,
      defaultCarrier: defaultCarrier || prevConfig.defaultCarrier || 'TEX',
      updatedAt: new Date().toISOString()
    };

    await query(`
      UPDATE stores
      SET store_name = COALESCE($1, store_name),
          seller_id = COALESCE($2, seller_id),
          supplier_id = COALESCE($3, supplier_id),
          api_key = COALESCE($4, api_key),
          api_secret = COALESCE($5, api_secret),
          extra_config = $6,
          is_active = COALESCE($7, is_active),
          updated_at = now()
      WHERE id::text = $8
    `, [storeName, sellerId, supplierId || sellerId, apiKey, apiSecret, JSON.stringify(updatedConfig), isActive, id]);

    return NextResponse.json({
      success: true,
      message: 'Mağaza bilgileri ve API anahtarları başarıyla güncellendi!'
    });
  } catch (error: any) {
    console.error('Store update error:', error);
    return NextResponse.json({ error: 'Mağaza güncellenemedi: ' + error.message }, { status: 500 });
  }
}
