import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { marketplace } = await request.json();
    const validMarketplaces = ['trendyol', 'hepsiburada', 'amazon'];
    const targetMp = marketplace && validMarketplaces.includes(marketplace.toLowerCase()) ? marketplace.toLowerCase() : 'all';

    // Simulate pulling live orders from Trendyol / HB / Amazon APIs
    const syncTime = new Date().toISOString();
    const syncedOrdersCount = targetMp === 'trendyol' ? 14 : targetMp === 'hepsiburada' ? 6 : 24;

    return NextResponse.json({
      success: true,
      marketplace: targetMp,
      syncedOrdersCount,
      lastSyncTime: syncTime,
      status: 'healthy',
      message: `${targetMp.toUpperCase()} API üzerinden ${syncedOrdersCount} adet yeni sipariş ve mutabakat verisi senkronize edildi.`
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
