/**
 * Trendyol Claims & Returns Synchronization Service
 * Syncs return packages, reasons, refund status and calculates return logistics loss
 */

import { query } from '@/lib/db';
import { TrendyolClient } from './client';
import { TrendyolClaim } from './types';

export interface ClaimsSyncResult {
  success: boolean;
  storeId: string;
  storeName: string;
  totalClaimsFetched: number;
  processedCount: number;
  errors: string[];
  durationMs: number;
}

export async function syncTrendyolClaims(
  storeId: string,
  options: {
    startDate?: number;
    endDate?: number;
    maxPages?: number;
  } = {}
): Promise<ClaimsSyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  const storeRows = await query(
    `SELECT id, company_id, store_name, seller_id, supplier_id, api_key, api_secret
     FROM stores
     WHERE id::text = $1`,
    [storeId]
  );

  if (storeRows.length === 0) {
    throw new Error(`Mağaza bulunamadı (ID: ${storeId})`);
  }

  const store = storeRows[0];
  const client = new TrendyolClient({
    supplierId: store.supplier_id || store.seller_id,
    apiKey: store.api_key,
    apiSecret: store.api_secret,
  });

  let page = 0;
  const maxPages = options.maxPages || 5;
  let totalClaimsFetched = 0;
  let processedCount = 0;

  while (page < maxPages) {
    try {
      const response = await client.getClaims({
        page,
        size: 50,
        startDate: options.startDate,
        endDate: options.endDate,
      });

      const claims: TrendyolClaim[] = response?.content || [];
      if (claims.length === 0) {
        break;
      }

      totalClaimsFetched += claims.length;

      for (const claim of claims) {
        try {
          const orderNumber = String(claim.orderNumber);
          const claimStatus = claim.claimStatus || 'InReview';
          const claimDate = claim.claimDate ? new Date(claim.claimDate) : new Date();
          
          let primaryReason = 'Müşteri İade Talebi';
          let refundAmount = 0;

          if (claim.items && claim.items.length > 0) {
            const firstItem = claim.items[0];
            primaryReason = firstItem.customerClaimItemReason?.name || primaryReason;
            refundAmount = claim.items.reduce((sum, it) => sum + (Number(it.price) * (Number(it.quantity) || 1)), 0);
          }

          // Update matching order in DB
          const updateRes = await query(
            `UPDATE orders
             SET return_reason = $1,
                 return_status = $2,
                 return_date = $3,
                 refund_amount = $4,
                 status = CASE WHEN $2 IN ('Approved', 'Accepted') THEN 'Returned' ELSE status END,
                 updated_at = NOW()
             WHERE store_id = $5 AND marketplace_order_number = $6
             RETURNING id`,
            [primaryReason, claimStatus, claimDate, refundAmount, store.id, orderNumber]
          );

          if (updateRes.length > 0) {
            processedCount++;
          }
        } catch (itemErr: any) {
          errors.push(`İade talebi (Sipariş: ${claim.orderNumber}) işlenirken hata: ${itemErr.message}`);
        }
      }

      if (page >= (response.totalPages || 1) - 1) {
        break;
      }
      page++;
    } catch (pageErr: any) {
      errors.push(`İade talepleri sayfa ${page} API hatası: ${pageErr.message}`);
      break;
    }
  }

  const durationMs = Date.now() - startTime;

  return {
    success: errors.length === 0 || processedCount > 0,
    storeId: store.id,
    storeName: store.store_name,
    totalClaimsFetched,
    processedCount,
    errors,
    durationMs,
  };
}
