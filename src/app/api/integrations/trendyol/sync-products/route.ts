import { NextResponse } from 'next/server';
import { syncTrendyolProducts } from '@/lib/integrations/trendyol';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeId, fetchAll, pageSize, maxPages } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'storeId zorunludur.' }, { status: 400 });
    }

    const result = await syncTrendyolProducts(storeId, {
      fetchAll: fetchAll === true,
      pageSize: pageSize ? Number(pageSize) : undefined,
      maxPages: maxPages ? Number(maxPages) : undefined,
    });

    return NextResponse.json({
      success: true,
      result,
      message: result.message || `${result.storeName} için ${result.totalConsolidated || 0} adet ürün Trendyol ile birleştirildi ve senkronize edildi.`,
    });
  } catch (error: any) {
    console.error('Trendyol product sync API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Ürünler senkronize edilemedi.' },
      { status: 500 }
    );
  }
}
