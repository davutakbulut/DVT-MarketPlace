/**
 * Trendyol Webhook Endpoint: POST /api/webhooks/trendyol
 * Receives instant order creation, shipment, and cancellation webhook events from Trendyol.
 * Zero-overhead instant synchronization directly into PostgreSQL.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { syncTrendyolOrders, syncTrendyolOrderStatuses } from '@/lib/integrations/trendyol';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}));
    const eventType = payload.eventType || payload.event || 'ORDER_CREATED';
    const supplierId = payload.supplierId || payload.sellerId;
    const orderNumber = payload.orderNumber || payload.packageId;

    console.log(`[Trendyol Webhook] Received Event: ${eventType}, Supplier: ${supplierId}, Order: ${orderNumber}`);

    // 1. Locate Store
    let storeId: string | null = null;
    if (supplierId) {
      const stores = await query(
        `SELECT id FROM stores WHERE (seller_id = $1 OR supplier_id = $1) AND marketplace = 'trendyol' LIMIT 1`,
        [String(supplierId)]
      );
      if (stores.length > 0) storeId = stores[0].id;
    }

    if (!storeId) {
      const defaultStore = await query(
        `SELECT id FROM stores WHERE marketplace = 'trendyol' AND is_active = true ORDER BY created_at ASC LIMIT 1`
      );
      if (defaultStore.length > 0) storeId = defaultStore[0].id;
    }

    if (!storeId) {
      return NextResponse.json({ success: false, message: 'Store not found' }, { status: 404 });
    }

    // 2. Perform Targeted Instant Sync for this specific store (1 page only = ultra fast <300ms)
    if (eventType === 'PACKAGE_STATUS_CHANGED' || eventType === 'ORDER_STATUS_CHANGED') {
      await syncTrendyolOrderStatuses(storeId, { maxPages: 1 });
    } else {
      await syncTrendyolOrders(storeId, { maxPages: 1 });
    }

    return NextResponse.json({
      success: true,
      message: `Trendyol ${eventType} webhook processed successfully.`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Trendyol Webhook Error]:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    service: 'DVT MarketPlace Trendyol Webhook Listener',
    timestamp: new Date().toISOString(),
  });
}
