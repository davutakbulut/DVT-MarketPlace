import { NextResponse } from 'next/server';
import { syncTrendyolSettlements } from '@/lib/integrations/trendyol';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeId, startDate, endDate, maxPages } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'storeId zorunludur.' }, { status: 400 });
    }

    const result = await syncTrendyolSettlements(storeId, {
      startDate: startDate ? new Date(startDate).getTime() : undefined,
      endDate: endDate ? new Date(endDate).getTime() : undefined,
      maxPages: maxPages ? Number(maxPages) : undefined,
    });

    return NextResponse.json({
      success: true,
      result,
      message: `${result.storeName} için ${result.totalFetched} adet finansal hakediş ve mutabakat işlemi senkronize edildi (${result.matchedOrdersCount} sipariş ile eşleştirildi). Toplam: ₺${result.totalSettlementAmount}`,
    });
  } catch (error: any) {
    console.error('Trendyol settlements sync API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Hakediş mutabakatı senkronize edilemedi.' },
      { status: 500 }
    );
  }
}
