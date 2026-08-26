import { NextResponse } from 'next/server';
import { TrendyolClient } from '@/lib/integrations/trendyol';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { supplierId, sellerId, apiKey, apiSecret, storeId } = body;

    // If storeId is provided, lookup from DB
    if (storeId && (!supplierId || !apiKey || !apiSecret)) {
      const storeRows = await query(
        `SELECT seller_id, supplier_id, api_key, api_secret FROM stores WHERE id::text = $1`,
        [storeId]
      );
      if (storeRows.length > 0) {
        supplierId = storeRows[0].supplier_id || storeRows[0].seller_id;
        apiKey = storeRows[0].api_key;
        apiSecret = storeRows[0].api_secret;
      }
    }

    const effectiveSupplierId = supplierId || sellerId;

    if (!effectiveSupplierId || !apiKey || !apiSecret) {
      return NextResponse.json(
        {
          success: false,
          error: 'Test için Satıcı ID (Supplier ID), API Key ve API Secret zorunludur.',
        },
        { status: 400 }
      );
    }

    // Initialize Trendyol Client & run test
    const client = new TrendyolClient({
      supplierId: effectiveSupplierId,
      apiKey,
      apiSecret,
    });

    const testResult = await client.testConnection();

    if (testResult.success) {
      return NextResponse.json({
        success: true,
        message: testResult.message,
        supplierId: testResult.supplierId,
        productCount: testResult.productCount,
        latencyMs: testResult.latencyMs,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: testResult.message || 'Trendyol API bağlantısı doğrulanamadı.',
          statusCode: testResult.statusCode,
          latencyMs: testResult.latencyMs,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Trendyol test connection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Bağlantı testi sırasında beklenmeyen bir hata oluştu.',
      },
      { status: 500 }
    );
  }
}
