/**
 * API Route: POST /api/integrations/trendyol/sync-status
 * Performs smart delta order status synchronization for a Trendyol store.
 * Only updates database records when a real status/tracking change is detected.
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncTrendyolOrderStatuses } from '@/lib/integrations/trendyol/orderStatusSync';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { storeId, maxPages = 10, onlyActiveStatuses = false } = body;

    let targetStoreId = storeId;

    if (!targetStoreId) {
      // Find the first active Trendyol store
      const stores = await query(
        `SELECT id FROM stores WHERE marketplace = 'trendyol' AND is_active = true ORDER BY created_at ASC LIMIT 1`
      );
      if (stores.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Aktif bir Trendyol mağazası bulunamadı.' },
          { status: 404 }
        );
      }
      targetStoreId = stores[0].id;
    }

    const result = await syncTrendyolOrderStatuses(targetStoreId, {
      maxPages: Number(maxPages) || 10,
      onlyActiveStatuses: Boolean(onlyActiveStatuses),
    });

    return NextResponse.json({
      success: result.success,
      result,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Trendyol Delta Status Sync API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Durum senkronizasyonu sırasında bir hata oluştu.',
      },
      { status: 500 }
    );
  }
}
