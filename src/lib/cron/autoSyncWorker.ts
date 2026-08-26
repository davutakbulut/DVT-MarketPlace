/**
 * Automatic Background Synchronization Worker
 * Continuously runs in the background of the Next.js server every 60 seconds.
 * Performs lightweight delta sync for new orders and status transitions.
 */

import { query } from '@/lib/db';
import { syncTrendyolOrders, syncTrendyolOrderStatuses } from '@/lib/integrations/trendyol';

const SYNC_INTERVAL_MS = 60 * 1000; // 60 seconds (1 minute)

declare global {
  var __autoSyncWorkerActive: boolean | undefined;
  var __autoSyncInterval: NodeJS.Timeout | undefined;
}

export function startAutoSyncWorker() {
  if (globalThis.__autoSyncWorkerActive) {
    return;
  }

  globalThis.__autoSyncWorkerActive = true;
  console.log('⚡ [AutoSyncWorker] Starting continuous 60s background sync worker...');

  const runSync = async () => {
    try {
      const activeStores = await query(
        `SELECT id, store_name, marketplace FROM stores WHERE is_active = true AND marketplace = 'trendyol'`
      );

      for (const store of activeStores) {
        try {
          // 1. Check recent new orders (Page 0 only = lightweight ~200ms)
          await syncTrendyolOrders(store.id, { maxPages: 1 });

          // 2. Check recent status updates (Picking -> Shipped -> Delivered)
          await syncTrendyolOrderStatuses(store.id, { maxPages: 1 });
        } catch (storeErr: any) {
          console.warn(`[AutoSyncWorker] Store ${store.store_name} sync notice:`, storeErr.message);
        }
      }
    } catch (err: any) {
      console.warn('[AutoSyncWorker] Background tick notice:', err.message);
    }
  };

  // Run initial sync after 5 seconds
  setTimeout(runSync, 5000);

  // Repeat every 60 seconds
  globalThis.__autoSyncInterval = setInterval(runSync, SYNC_INTERVAL_MS);
}
