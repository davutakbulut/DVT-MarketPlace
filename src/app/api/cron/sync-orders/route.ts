import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { syncTrendyolOrders, syncTrendyolOrderStatuses } from '@/lib/integrations/trendyol';
import { notificationScanner } from '@/lib/notificationScanner';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dvt_marketplace_cron_secret_2026';

    // Verify secret if provided
    if (authHeader && authHeader !== `Bearer ${cronSecret}` && searchParams.get('secret') !== cronSecret) {
      return NextResponse.json({ error: 'Yetkisiz cron çağrısı' }, { status: 401 });
    }

    // Find all active Trendyol stores
    const activeStores = await query(
      `SELECT id, store_name, marketplace, supplier_id, seller_id, api_key, api_secret
       FROM stores
       WHERE is_active = true AND marketplace = 'trendyol'`
    );

    const results: any[] = [];

    for (const store of activeStores) {
      if (store.api_key && !store.api_key.includes('mock')) {
        try {
          // 1. Delta Status Sync for existing orders
          const statusRes = await syncTrendyolOrderStatuses(store.id, { maxPages: 5 });
          // 2. Ingest brand new incoming orders
          const orderRes = await syncTrendyolOrders(store.id, { maxPages: 2 });
          
          results.push({
            storeId: store.id,
            storeName: store.store_name,
            status: 'synced',
            newOrders: orderRes.newOrdersCount,
            statusChangedCount: statusRes.changedCount,
            statusUnchangedCount: statusRes.unchangedCount,
            transitions: statusRes.transitionsSummary,
          });
        } catch (err: any) {
          results.push({
            storeId: store.id,
            storeName: store.store_name,
            status: 'error',
            error: err.message,
          });
        }
      }
    }

    // Run system anomaly audit
    try {
      await notificationScanner.scanAllAnomalies();
    } catch {}

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      storesProcessed: results.length,
      results,
    });
  } catch (error: any) {
    console.error('Cron sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
