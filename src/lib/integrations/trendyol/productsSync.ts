/**
 * Trendyol Products & Inventory Synchronization Service
 * Dual-Source Engine:
 * 1. Fetches catalog items from Trendyol Product API (if authorized).
 * 2. Consolidates all distinct products & variants from historical order packages.
 * 3. UPSERTs into PostgreSQL preserving existing user cost prices while updating
 *    latest sale prices, stock levels, commission rates, and shipment desis.
 * 4. Links all order items to product records.
 */

import { query } from '@/lib/db';
import { TrendyolClient } from './client';
import { TrendyolProductItem } from './types';

export interface ProductsSyncResult {
  success: boolean;
  storeId: string;
  storeName: string;
  totalCatalogFetched: number;
  totalOrderProductsExtracted: number;
  totalConsolidated: number;
  insertedCount: number;
  updatedCount: number;
  errors: string[];
  durationMs: number;
  message: string;
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
  const companyId = store.company_id;
  const supplierId = store.supplier_id || store.seller_id;
  const apiKey = store.api_key;
  const apiSecret = store.api_secret;

  if (!supplierId || !apiKey || !apiSecret) {
    throw new Error(`Mağaza için Trendyol API kimlik bilgileri eksik.`);
  }

  const client = new TrendyolClient({
    supplierId,
    apiKey,
    apiSecret,
  });

  let totalCatalogFetched = 0;
  let insertedCount = 0;
  let updatedCount = 0;

  // 2. ATTEMPT SOURCE 1: Trendyol Product Catalog API
  try {
    const pageSize = Math.min(50, Math.max(10, options.pageSize || 50));
    const maxPages = options.fetchAll ? 50 : options.maxPages || 10;
    let page = 0;
    let hasMore = true;

    while (hasMore && page < maxPages) {
      try {
        const response = await client.getProducts({ page, size: pageSize });
        const items: TrendyolProductItem[] = response?.content || [];
        if (items.length === 0) break;

        totalCatalogFetched += items.length;

        for (const item of items) {
          const barcode = (item.barcode || '').trim();
          if (!barcode) continue;

          const title = item.title || 'İsimsiz Ürün';
          const brand = item.brand || null;
          const sku = item.stockCode || item.productMainId || barcode;
          const modelCode = item.productMainId || null;
          const imageUrl = item.images && item.images.length > 0 ? item.images[0].url : null;
          const salePrice = Number(item.salePrice) || 0;
          const vatRate = Number(item.vatRate) || 20;
          const shipmentDesi = Math.max(0.5, Number(item.dimensionalWeight) || 1.0);
          const stockQuantity = Math.max(0, Number(item.quantity) || 10);
          const isActive = item.onSale === true && item.approved === true;

          const existing = await query(
            `SELECT id, current_cost FROM products WHERE store_id = $1 AND barcode = $2`,
            [store.id, barcode]
          );

          if (existing.length > 0) {
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
                title, brand, sku, modelCode, imageUrl,
                salePrice, vatRate, shipmentDesi, stockQuantity,
                isActive, store.id, barcode
              ]
            );
            updatedCount++;
          } else {
            await query(
              `INSERT INTO products (
                 store_id, company_id, barcode, sku, model_code, title, brand,
                 image_url, current_sale_price, current_cost, vat_rate, shipment_desi,
                 measured_desi, commission_rate, stock_quantity, delivery_type,
                 is_active, marketplace, created_at, updated_at
               ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0.0, $10, $11, $11, 15.0, $12, 'standard', $13, 'trendyol', NOW(), NOW())
               ON CONFLICT (store_id, barcode) DO UPDATE SET
                 title = EXCLUDED.title,
                 current_sale_price = EXCLUDED.current_sale_price,
                 stock_quantity = EXCLUDED.stock_quantity,
                 shipment_desi = EXCLUDED.shipment_desi,
                 updated_at = NOW()`,
              [
                store.id, companyId, barcode, sku, modelCode, title, brand,
                imageUrl, salePrice, vatRate, shipmentDesi, stockQuantity,
                isActive
              ]
            );
            insertedCount++;
          }
        }

        if (page >= (response.totalPages || 1) - 1) break;
        page++;
      } catch (pageErr: any) {
        errors.push(`Katalog API Sayfa ${page} çekilemedi: ${pageErr.message}`);
        break;
      }
    }
  } catch (catErr: any) {
    errors.push(`Katalog API erişim uyarısı: ${catErr.message}`);
  }

  // 3. SOURCE 2: Consolidate & Merge All Products Extracted from Orders
  const orderProds = await query(
    `SELECT 
       oi.barcode,
       oi.sku,
       oi.title,
       MAX(oi.unit_sale_price) as last_sale_price,
       AVG(oi.commission_rate) as avg_commission_rate,
       MAX(oi.shipping_desi) as desi,
       COUNT(oi.id) as total_orders_count,
       SUM(oi.quantity) as total_units_sold
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.store_id = $1 AND oi.barcode IS NOT NULL AND oi.barcode != 'NO_BARCODE'
     GROUP BY oi.barcode, oi.sku, oi.title`,
    [store.id]
  );

  const totalOrderProductsExtracted = orderProds.length;

  for (const op of orderProds) {
    try {
      const barcode = String(op.barcode).trim();
      const sku = op.sku ? String(op.sku).trim() : barcode;
      const title = String(op.title || 'Trendyol Ürünü').trim();
      const salePrice = Number(op.last_sale_price) || 0;
      const commRate = Math.round(Number(op.avg_commission_rate || 15) * 100) / 100;
      const desi = Math.max(0.5, Number(op.desi) || 1.0);

      const existing = await query(
        `SELECT id, current_cost, stock_quantity FROM products WHERE store_id = $1 AND barcode = $2`,
        [store.id, barcode]
      );

      if (existing.length > 0) {
        // Update product details while keeping existing cost price
        await query(
          `UPDATE products
           SET title = COALESCE($1, title),
               sku = COALESCE($2, sku),
               current_sale_price = CASE WHEN current_sale_price <= 0 THEN $3 ELSE current_sale_price END,
               commission_rate = COALESCE(commission_rate, $4),
               shipment_desi = CASE WHEN shipment_desi <= 0 THEN $5 ELSE shipment_desi END,
               is_active = true,
               marketplace = 'trendyol',
               updated_at = NOW()
           WHERE store_id = $6 AND barcode = $7`,
          [title, sku, salePrice, commRate, desi, store.id, barcode]
        );
        updatedCount++;
      } else {
        // Insert new product
        await query(
          `INSERT INTO products (
             store_id, company_id, barcode, sku, model_code, title,
             current_sale_price, current_cost, vat_rate, shipment_desi,
             measured_desi, commission_rate, stock_quantity, delivery_type,
             is_active, marketplace, created_at, updated_at
           ) VALUES (
             $1, $2, $3, $4, $4, $5,
             $6, 0.0, 20, $7,
             $7, $8, 20, 'standard',
             true, 'trendyol', NOW(), NOW()
           )
           ON CONFLICT (store_id, barcode) DO UPDATE SET
             title = EXCLUDED.title,
             current_sale_price = EXCLUDED.current_sale_price,
             commission_rate = EXCLUDED.commission_rate,
             updated_at = NOW()`,
          [
            store.id, companyId, barcode, sku, title,
            salePrice, desi, commRate
          ]
        );
        insertedCount++;
      }
    } catch (opErr: any) {
      errors.push(`Sipariş ürün birleştirme hatası (${op.barcode}): ${opErr.message}`);
    }
  }

  // 4. LINK ALL ORDER ITEMS TO PRODUCTS
  await query(
    `UPDATE order_items
     SET product_id = p.id
     FROM products p, orders o
     WHERE order_items.order_id = o.id
       AND o.store_id = p.store_id
       AND order_items.barcode = p.barcode
       AND order_items.product_id IS NULL`,
    []
  );

  // 5. Update Store Product Count in DB
  const totalInDbRes = await query(
    `SELECT COUNT(*) as total FROM products WHERE store_id = $1`,
    [store.id]
  );
  const totalConsolidated = Number(totalInDbRes[0]?.total || 0);

  await query(
    `UPDATE stores
     SET last_synced_at = NOW(), sync_status = 'synced'
     WHERE id = $1`,
    [store.id]
  );

  const durationMs = Date.now() - startTime;

  return {
    success: true,
    storeId: store.id,
    storeName: store.store_name,
    totalCatalogFetched,
    totalOrderProductsExtracted,
    totalConsolidated,
    insertedCount,
    updatedCount,
    errors,
    durationMs,
    message: `${store.store_name} için ${totalConsolidated} adet ürün Trendyol ile başarıyla birleştirildi ve senkronize edildi.`,
  };
}
