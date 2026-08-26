import { NextResponse } from 'next/server';
import { syncTrendyolClaims } from '@/lib/integrations/trendyol';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeId, startDate, endDate, maxPages } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'storeId zorunludur.' }, { status: 400 });
    }

    const result = await syncTrendyolClaims(storeId, {
      startDate: startDate ? new Date(startDate).getTime() : undefined,
      endDate: endDate ? new Date(endDate).getTime() : undefined,
      maxPages: maxPages ? Number(maxPages) : undefined,
    });

    return NextResponse.json({
      success: true,
      result,
      message: `${result.storeName} için ${result.totalClaimsFetched} adet iade/iptal talebi senkronize edildi (${result.processedCount} işlendi).`,
    });
  } catch (error: any) {
    console.error('Trendyol claims sync API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'İade talepleri senkronize edilemedi.' },
      { status: 500 }
    );
  }
}
