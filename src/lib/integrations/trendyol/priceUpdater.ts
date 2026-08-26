/**
 * Trendyol Two-Way Price & Inventory Writeback Engine
 * Sends price/inventory updates directly to Trendyol API and updates the local PostgreSQL database
 */

import { query } from '@/lib/db';
import { TrendyolClient } from './client';
import { TrendyolPriceAndInventoryItem } from './types';

export interface PriceUpdateItem {
  barcode: string;
  salePrice?: number;
  listPrice?: number;
  quantity?: number;
}

export interface PriceUpdateResult {
  success: boolean;
  storeId: string;
  storeName: string;
  batchRequestId?: string;
  updatedCount: number;
  items: PriceUpdateItem[];
  message: string;
  error?: string;
}

export async function updateTrendyolPriceAndInventory(
  storeId: string,
  updates: PriceUpdateItem[]
): Promise<PriceUpdateResult> {
  if (!updates || updates.length === 0) {
    throw new Error('Güncellenecek ürün listesi boş olamaz.');
  }

  // 1. Fetch Store Credentials from DB
  const storeRows = await query(
    `SELECT id, company_id, store_name, marketplace, seller_id, supplier_id, api_key, api_secret
     FROM stores
     WHERE id::text = $1`,
    [storeId]
  );

  if (storeRows.length === 0) {
    throw new Error(`Mağaza bulunamadı (ID: ${storeId})`);
  }

  const store = storeRows[0];
  const supplierId = store.supplier_id || store.seller_id;
  const apiKey = store.api_key;
  const apiSecret = store.api_secret;

  if (!supplierId || !apiKey || !apiSecret) {
    throw new Error(`Trendyol API kimlik bilgileri eksik.`);
  }

  const client = new TrendyolClient({
    supplierId,
    apiKey,
    apiSecret,
  });

  // Prepare payload for Trendyol API
  const itemsPayload: TrendyolPriceAndInventoryItem[] = updates.map((u) => {
    const item: TrendyolPriceAndInventoryItem = {
      barcode: u.barcode.trim(),
    };
    if (u.salePrice !== undefined && u.salePrice > 0) {
      item.salePrice = Number(u.salePrice);
      item.listPrice = u.listPrice && u.listPrice >= u.salePrice ? Number(u.listPrice) : Number(u.salePrice);
    }
    if (u.quantity !== undefined && u.quantity >= 0) {
      item.quantity = Number(u.quantity);
    }
    return item;
  });

  try {
    // 2. Call Trendyol API Writeback Endpoint
    const batchResponse = await client.updatePriceAndInventory({
      items: itemsPayload,
    });

    const batchRequestId = batchResponse?.batchRequestId || `batch_${Date.now()}`;

    // 3. Update Local DB (products table)
    for (const u of updates) {
      const barcode = u.barcode.trim();
      let updateSql = 'UPDATE products SET updated_at = NOW()';
      const params: any[] = [];
      let pIdx = 1;

      if (u.salePrice !== undefined && u.salePrice > 0) {
        updateSql += `, current_sale_price = $${pIdx}`;
        params.push(u.salePrice);
        pIdx++;
      }

      if (u.quantity !== undefined && u.quantity >= 0) {
        updateSql += `, stock_quantity = $${pIdx}`;
        params.push(u.quantity);
        pIdx++;
      }

      updateSql += ` WHERE store_id = $${pIdx} AND barcode = $${pIdx + 1}`;
      params.push(store.id, barcode);

      await query(updateSql, params);
    }

    return {
      success: true,
      storeId: store.id,
      storeName: store.store_name,
      batchRequestId,
      updatedCount: updates.length,
      items: updates,
      message: `${updates.length} adet ürün fiyatı/stoku Trendyol'a başarıyla iletildi (Batch ID: ${batchRequestId})!`,
    };
  } catch (err: any) {
    console.error('[Trendyol PriceUpdater] Error pushing to API:', err);
    throw new Error(`Trendyol API Fiyat Güncelleme Hatası: ${err.message}`);
  }
}

/**
 * Check the status of an asynchronous batch update on Trendyol
 */
export async function checkTrendyolBatchStatus(
  storeId: string,
  batchRequestId: string
) {
  const storeRows = await query(
    `SELECT id, seller_id, supplier_id, api_key, api_secret
     FROM stores
     WHERE id::text = $1`,
    [storeId]
  );

  if (storeRows.length === 0) {
    throw new Error(`Mağaza bulunamadı.`);
  }

  const store = storeRows[0];
  const client = new TrendyolClient({
    supplierId: store.supplier_id || store.seller_id,
    apiKey: store.api_key,
    apiSecret: store.api_secret,
  });

  return client.getBatchRequestResult(batchRequestId);
}
