/**
 * Trendyol Products & Inventory Synchronization Service
 * Fetches catalog items, variants, prices, and stock levels from Trendyol API and UPSERTs into PostgreSQL
 */

import { query } from '@/lib/db';
import { TrendyolClient } from './client';
import { TrendyolProductItem } from './types';

export interface ProductsSyncResult {
  success: boolean;
  storeId: string;
  storeName: string;
  totalFetched: number;
  insertedCount: number;
  updatedCount: number;
  errors: string[];
  durationMs: number;
}

export async function syncTrendyolProducts(
  storeId: string,
  options: {
    fetchAll?: boolean;
    pageSize?: number;
    maxPages?: number;
  } = {}
): Promise<ProductsSyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  // 1. Fetch Store and Credentials from DB
  const storeRows = await query(
    `SELECT id, company_id, store_name, marketplace, seller_id, supplier_id, api_key, api_secret, extra_config
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
    throw new Error(`Mağaza için Trendyol API kimlik bilgileri eksik (Supplier ID, API Key veya Secret).`);
  }

  const client = new TrendyolClient({
    supplierId,
    apiKey,
    apiSecret,
  });

  const pageSize = Math.min(100, Math.max(10, options.pageSize || 50));
  const maxPages = options.fetchAll ? 50 : options.maxPages || 10;

  let page = 0;
  let hasMore = true;
  let totalFetched = 0;
  let insertedCount = 0;
  let updatedCount = 0;

  while (hasMore && page < maxPages) {
    try {
      const response = await client.getProducts({
        page,
        size: pageSize,
      });

      const items: TrendyolProductItem[] = response?.content || [];
      if (items.length === 0) {
        break;
      }

      totalFetched += items.length;

      // Process batch items
      for (const item of items) {
        try {
          const barcode = (item.barcode || '').trim();
          if (!barcode) continue;

          const title = item.title || 'İsimsiz Ürün';
          const brand = item.brand || null;
          const sku = item.stockCode || item.productMainId || null;
          const modelCode = item.productMainId || null;
          const imageUrl = item.images && item.images.length > 0 ? item.images[0].url : null;
          const salePrice = Number(item.salePrice) || 0;
          const vatRate = Number(item.vatRate) || 20;
          const shipmentDesi = Math.max(0.5, Number(item.dimensionalWeight) || 1.0);
          const stockQuantity = Math.max(0, Number(item.quantity) || 0);
          const isActive = item.onSale === true && item.approved === true;

          // Check if product already exists in DB to determine insert vs update
          const existing = await query(
            `SELECT id, current_cost FROM products WHERE store_id = $1 AND barcode = $2`,
            [store.id, barcode]
          );

          if (existing.length > 0) {
            // Update existing product without overwriting user-entered current_cost
            await query(
              `UPDATE products
               SET title = $1,
                   brand = COALESCE($2, brand),
                   sku = COALESCE($3, sku),
                   model_code = COALESCE($4, model_code),
                   image_url = COALESCE($5, image_url),
                   current_sale_price = $6,
                   vat_rate = $7,
                   shipment_desi = $8,
                   stock_quantity = $9,
                   is_active = $10,
                   marketplace = 'trendyol',
                   updated_at = NOW()
               WHERE store_id = $11 AND barcode = $12`,
              [
                title,
                brand,
                sku,
                modelCode,
                imageUrl,
                salePrice,
                vatRate,
                shipmentDesi,
                stockQuantity,
                isActive,
                store.id,
                barcode,
              ]
            );
            updatedCount++;
          } else {
            // Insert new product
            await query(
              `INSERT INTO products (
                 store_id, company_id, barcode, sku, model_code, title, brand,
                 image_url, current_sale_price, current_cost, vat_rate, shipment_desi,
                 measured_desi, commission_rate, stock_quantity, delivery_type,
                 is_active, marketplace, created_at, updated_at
               ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'trendyol', NOW(), NOW())
               ON CONFLICT (store_id, barcode) DO UPDATE SET
                 title = EXCLUDED.title,
                 current_sale_price = EXCLUDED.current_sale_price,
                 stock_quantity = EXCLUDED.stock_quantity,
                 shipment_desi = EXCLUDED.shipment_desi,
                 updated_at = NOW()`,
              [
                store.id,
                store.company_id,
                barcode,
                sku,
                modelCode,
                title,
                brand,
                imageUrl,
                salePrice,
                0.0, // Default cost 0.0 until user inputs or excel matched
                vatRate,
                shipmentDesi,
                shipmentDesi, // measured_desi initial match
                15.0, // standard default commission
                stockQuantity,
                'standard',
                isActive,
              ]
            );
            insertedCount++;
          }
        } catch (itemErr: any) {
          errors.push(`Barkod ${item.barcode} işlenirken hata: ${itemErr.message}`);
        }
      }

      if (page >= (response.totalPages || 1) - 1) {
        hasMore = false;
      } else {
        page++;
      }
    } catch (pageErr: any) {
      errors.push(`Sayfa ${page} çekilirken API hatası: ${pageErr.message}`);
      break;
    }
  }

  // Update store last synced timestamp
  await query(
    `UPDATE stores
     SET last_synced_at = NOW(), sync_status = 'synced', sync_error_message = $1
     WHERE id = $2`,
    [errors.length > 0 ? errors.slice(0, 3).join('; ') : null, store.id]
  );

  const durationMs = Date.now() - startTime;

  return {
    success: errors.length === 0 || insertedCount + updatedCount > 0,
    storeId: store.id,
    storeName: store.store_name,
    totalFetched,
    insertedCount,
    updatedCount,
    errors,
    durationMs,
  };
}
