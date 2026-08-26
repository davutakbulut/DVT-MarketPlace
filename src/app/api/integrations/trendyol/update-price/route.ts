import { NextResponse } from 'next/server';
import { updateTrendyolPriceAndInventory, PriceUpdateItem } from '@/lib/integrations/trendyol';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { storeId, productId, barcode, salePrice, listPrice, quantity, items } = body;

    // Single item update resolution
    let updateItems: PriceUpdateItem[] = [];

    if (Array.isArray(items) && items.length > 0) {
      updateItems = items;
    } else if (barcode || productId) {
      let targetBarcode = barcode;
      let targetStoreId = storeId;

      if (productId && (!targetBarcode || !targetStoreId)) {
        const pRows = await query(
          `SELECT store_id, barcode, current_sale_price FROM products WHERE id::text = $1`,
          [productId]
        );
        if (pRows.length > 0) {
          targetBarcode = targetBarcode || pRows[0].barcode;
          targetStoreId = targetStoreId || pRows[0].store_id;
        }
      }

      if (!targetBarcode) {
        return NextResponse.json({ error: 'Barkod bilgisi bulunamadı.' }, { status: 400 });
      }

      storeId = targetStoreId || storeId;
      updateItems = [
        {
          barcode: targetBarcode,
          salePrice: salePrice !== undefined ? Number(salePrice) : undefined,
          listPrice: listPrice !== undefined ? Number(listPrice) : undefined,
          quantity: quantity !== undefined ? Number(quantity) : undefined,
        },
      ];
    } else {
      return NextResponse.json(
        { error: 'Lütfen güncellenecek ürün barkodu veya ürün listesi sağlayın.' },
        { status: 400 }
      );
    }

    if (!storeId) {
      return NextResponse.json({ error: 'storeId zorunludur.' }, { status: 400 });
    }

    // Check store type: if store is mock/manual without real API keys, update DB and return graceful response
    const storeRows = await query(`SELECT marketplace, api_key FROM stores WHERE id::text = $1`, [storeId]);
    if (storeRows.length > 0 && (!storeRows[0].api_key || storeRows[0].api_key.includes('mock') || storeRows[0].marketplace === 'manual')) {
      for (const it of updateItems) {
        if (it.salePrice) {
          await query(
            `UPDATE products SET current_sale_price = $1, updated_at = NOW() WHERE store_id = $2 AND barcode = $3`,
            [it.salePrice, storeId, it.barcode]
          );
        }
      }
      return NextResponse.json({
        success: true,
        updatedCount: updateItems.length,
        message: 'Ürün fiyatı yerel veritabanında güncellendi (Demo/Manuel Mağaza).',
      });
    }

    const result = await updateTrendyolPriceAndInventory(storeId, updateItems);

    return NextResponse.json({
      success: true,
      result,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Trendyol Price Writeback API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Fiyat Trendyol API ile güncellenemedi.' },
      { status: 500 }
    );
  }
}
