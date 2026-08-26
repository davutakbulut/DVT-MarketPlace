import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { syncTrendyolOrders, syncTrendyolProducts } from '@/lib/integrations/trendyol';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { storeId, marketplace, syncProducts = true, syncOrders = true } = body;

    let targetStores: any[] = [];

    if (storeId) {
      targetStores = await query(
        `SELECT id, marketplace, store_name, seller_id, supplier_id, api_key, api_secret
         FROM stores
         WHERE id::text = $1 AND is_active = true`,
        [storeId]
      );
    } else if (marketplace && marketplace !== 'all') {
      targetStores = await query(
        `SELECT id, marketplace, store_name, seller_id, supplier_id, api_key, api_secret
         FROM stores
         WHERE marketplace = $1 AND is_active = true`,
        [marketplace.toLowerCase()]
      );
    } else {
      targetStores = await query(
        `SELECT id, marketplace, store_name, seller_id, supplier_id, api_key, api_secret
         FROM stores
         WHERE is_active = true`
      );
    }

    if (targetStores.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Senkronize edilecek aktif mağaza bulunamadı.',
      }, { status: 404 });
    }

    const syncResults: any[] = [];

    for (const store of targetStores) {
      if (store.marketplace === 'trendyol' && store.api_key && !store.api_key.includes('mock')) {
        try {
          let prodRes: any = null;
          let ordRes: any = null;

          if (syncProducts) {
            prodRes = await syncTrendyolProducts(store.id, { maxPages: 2 });
          }
          if (syncOrders) {
            ordRes = await syncTrendyolOrders(store.id, { maxPages: 2 });
          }

          syncResults.push({
            storeId: store.id,
            storeName: store.store_name,
            marketplace: 'trendyol',
            status: 'success',
            products: prodRes,
            orders: ordRes,
          });
        } catch (err: any) {
          syncResults.push({
            storeId: store.id,
            storeName: store.store_name,
            marketplace: 'trendyol',
            status: 'error',
            error: err.message,
          });
        }
      } else {
        // Mock or non-Trendyol store simulation
        syncResults.push({
          storeId: store.id,
          storeName: store.store_name,
          marketplace: store.marketplace,
          status: 'simulated',
          message: `${store.store_name} (${store.marketplace}) mağazası başarıyla güncellendi.`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      lastSyncTime: new Date().toISOString(),
      storesCount: targetStores.length,
      results: syncResults,
      message: `${targetStores.length} adet mağaza senkronizasyonu tamamlandı.`,
    });
  } catch (e: any) {
    console.error('Universal sync error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
