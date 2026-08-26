/**
 * Trendyol Settlements & Financial Reconciliation Service
 * Pulls settlement statements, commission deductions, cargo invoices,
 * and matches them against orders for audit verification.
 */

import { query } from '@/lib/db';
import { TrendyolClient } from './client';
import { TrendyolSettlementTransaction } from './types';

export interface SettlementSyncResult {
  success: boolean;
  storeId: string;
  storeName: string;
  totalFetched: number;
  matchedOrdersCount: number;
  totalSettlementAmount: number;
  errors: string[];
  durationMs: number;
}

export async function syncTrendyolSettlements(
  storeId: string,
  options: {
    startDate?: number;
    endDate?: number;
    maxPages?: number;
  } = {}
): Promise<SettlementSyncResult> {
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

  const nowMs = Date.now();
  const sixtyDaysAgo = nowMs - 60 * 24 * 60 * 60 * 1000;
  const startDate = options.startDate || sixtyDaysAgo;
  const endDate = options.endDate || nowMs;

  let page = 0;
  const maxPages = options.maxPages || 5;
  let totalFetched = 0;
  let matchedOrdersCount = 0;
  let totalSettlementAmount = 0;

  // Ensure default settlement record exists
  const currentMonthPeriod = new Date().toISOString().slice(0, 7); // e.g. "2026-08"
  let settlementId: string;

  const settRows = await query(
    `SELECT id FROM settlements WHERE store_id = $1 AND settlement_period = $2`,
    [store.id, currentMonthPeriod]
  );

  if (settRows.length > 0) {
    settlementId = settRows[0].id;
  } else {
    const newSett = await query(
      `INSERT INTO settlements (
         store_id, settlement_period, start_date, end_date,
         gross_sales, commission_deduction, shipping_deduction, net_payout, status, created_at
       ) VALUES ($1, $2, $3, $4, 0, 0, 0, 0, 'completed', NOW())
       RETURNING id`,
      [
        store.id,
        currentMonthPeriod,
        new Date(startDate).toISOString().slice(0, 10),
        new Date(endDate).toISOString().slice(0, 10),
      ]
    );
    settlementId = newSett[0].id;
  }

  while (page < maxPages) {
    try {
      const response = await client.getSettlements({
        startDate,
        endDate,
        page,
        size: 100,
      });

      const transactions: TrendyolSettlementTransaction[] = response?.content || [];
      if (transactions.length === 0) {
        break;
      }

      totalFetched += transactions.length;

      for (const tx of transactions) {
        try {
          const orderNumber = tx.orderNumber ? String(tx.orderNumber) : null;
          const amount = Number(tx.settlementAmount || tx.credit - tx.debt) || 0;
          totalSettlementAmount += amount;
          const desc = tx.description || `${tx.transactionType} Hakediş İşlemi`;

          let orderId: string | null = null;
          let discrepancyAmount = 0;
          let discrepancyType = 'none';

          if (orderNumber) {
            const ordRows = await query(
              `SELECT id, total_commission, total_shipping_cost, paid_amount
               FROM orders
               WHERE store_id = $1 AND marketplace_order_number = $2`,
              [store.id, orderNumber]
            );

            if (ordRows.length > 0) {
              orderId = ordRows[0].id;
              matchedOrdersCount++;

              // Audit comparison if transaction is cargo or commission
              if (tx.transactionType === 'Cargo' && tx.debt > 0) {
                const billedCargo = tx.debt;
                const expectedCargo = Number(ordRows[0].total_shipping_cost) || 0;
                if (Math.abs(billedCargo - expectedCargo) > 5) {
                  discrepancyAmount = Math.round((billedCargo - expectedCargo) * 100) / 100;
                  discrepancyType = discrepancyAmount > 0 ? 'high_cargo_billed' : 'cargo_discount_applied';
                }
              }
            }
          }

          // Insert into settlement_transactions
          await query(
            `INSERT INTO settlement_transactions (
               settlement_id, order_id, order_number, transaction_type,
               amount, description, discrepancy_amount, discrepancy_type, is_audited, created_at
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
            [
              settlementId,
              orderId,
              orderNumber,
              tx.transactionType,
              amount,
              desc,
              discrepancyAmount,
              discrepancyType,
              discrepancyType === 'none',
            ]
          );
        } catch (txErr: any) {
          errors.push(`Mutabakat satırı kaydedilirken hata: ${txErr.message}`);
        }
      }

      if (page >= (response.totalPages || 1) - 1) {
        break;
      }
      page++;
    } catch (pageErr: any) {
      errors.push(`Mutabakat sayfa ${page} API hatası: ${pageErr.message}`);
      break;
    }
  }

  const durationMs = Date.now() - startTime;

  return {
    success: errors.length === 0 || matchedOrdersCount > 0,
    storeId: store.id,
    storeName: store.store_name,
    totalFetched,
    matchedOrdersCount,
    totalSettlementAmount: Math.round(totalSettlementAmount * 100) / 100,
    errors,
    durationMs,
  };
}
