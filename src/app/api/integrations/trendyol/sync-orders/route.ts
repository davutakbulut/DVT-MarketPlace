import { NextResponse } from 'next/server';
import { syncTrendyolOrders } from '@/lib/integrations/trendyol';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeId, startDate, endDate, status, maxPages, pageSize } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'storeId zorunludur.' }, { status: 400 });
    }

    const result = await syncTrendyolOrders(storeId, {
      startDate: startDate ? new Date(startDate).getTime() : undefined,
      endDate: endDate ? new Date(endDate).getTime() : undefined,
      status,
      maxPages: maxPages ? Number(maxPages) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });

    return NextResponse.json({
      success: true,
      result,
      message: `${result.storeName} için ${result.totalOrdersFetched} adet sipariş Trendyol API üzerinden senkronize edildi (${result.newOrdersCount} yeni sipariş, ${result.updatedOrdersCount} güncellenen sipariş).`,
    });
  } catch (error: any) {
    console.error('Trendyol order sync API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Siparişler senkronize edilemedi.' },
      { status: 500 }
    );
  }
}
