import { query } from '@/lib/db';

export interface ScanResult {
  timestamp: string;
  totalNewNotifications: number;
  negativeProfitAlerts: number;
  desiOverchargeAlerts: number;
  stockAlerts: number;
  lowMarginAlerts: number;
  crashAlerts: number;
  details: string[];
}

export async function runNotificationScanner(): Promise<ScanResult> {
  const result: ScanResult = {
    timestamp: new Date().toISOString(),
    totalNewNotifications: 0,
    negativeProfitAlerts: 0,
    desiOverchargeAlerts: 0,
    stockAlerts: 0,
    lowMarginAlerts: 0,
    crashAlerts: 0,
    details: [],
  };

  try {
    // 1. RULE 1: Negative Profit Orders Scan
    const negativeOrders = await query(`
      SELECT 
        o.id,
        o.marketplace_order_number,
        o.customer_name,
        o.net_profit,
        o.order_date
      FROM orders o
      WHERE o.net_profit < 0
      ORDER BY o.order_date DESC
      LIMIT 10
    `);

    for (const ord of negativeOrders) {
      const title = `🚨 Zararına Sipariş: #${ord.marketplace_order_number}`;
      const existing = await query(
        `SELECT id FROM system_notifications WHERE title = $1 LIMIT 1`,
        [title]
      );
      if (existing.length === 0) {
        await query(
          `INSERT INTO system_notifications (title, message, type, category, action_url)
           VALUES ($1, $2, 'danger', 'order', '/live-analysis')`,
          [
            title,
            `Müşteri: ${ord.customer_name || 'Bilinmiyor'} - Kargo ve komisyon sonrası ₺${Math.abs(parseFloat(ord.net_profit)).toFixed(2)} net zarar tespit edildi.`
          ]
        );
        result.negativeProfitAlerts++;
        result.totalNewNotifications++;
        result.details.push(`Zararlı Sipariş Bildirimi: #${ord.marketplace_order_number}`);
      }
    }

    // 2. RULE 2: Desi Overcharge Scan
    const desiOvercharges = await query(`
      SELECT 
        o.id,
        o.package_number,
        o.billed_desi,
        o.calculated_desi,
        o.carrier_name,
        o.order_date
      FROM orders o
      WHERE o.billed_desi > o.calculated_desi
      ORDER BY o.order_date DESC
      LIMIT 10
    `);

    for (const d of desiOvercharges) {
      const title = `⚠️ Desi Aşımı: Paket #${d.package_number}`;
      const existing = await query(
        `SELECT id FROM system_notifications WHERE title = $1 LIMIT 1`,
        [title]
      );
      if (existing.length === 0) {
        await query(
          `INSERT INTO system_notifications (title, message, type, category, action_url)
           VALUES ($1, $2, 'warning', 'shipping', '/settlement-desi-audit')`,
          [
            title,
            `${d.carrier_name || 'Kargo'} şirketi ${d.billed_desi} desi faturalandırdı (Katalog: ${d.calculated_desi} desi). Hakediş kesintisi kontrol edilmeli.`
          ]
        );
        result.desiOverchargeAlerts++;
        result.totalNewNotifications++;
        result.details.push(`Desi Aşımı Bildirimi: Paket #${d.package_number}`);
      }
    }

    // 3. RULE 3: Critical / Out of Stock Inventory Scan
    const lowStock = await query(`
      SELECT id, title, barcode, stock_quantity
      FROM products
      WHERE stock_quantity <= 3
      ORDER BY stock_quantity ASC
      LIMIT 10
    `);

    for (const p of lowStock) {
      const isZero = parseInt(p.stock_quantity || 0) === 0;
      const title = isZero ? `📦 Stok Tükendi: ${p.barcode}` : `⚠️ Kritik Stok: ${p.barcode} (${p.stock_quantity} Adet)`;
      const existing = await query(
        `SELECT id FROM system_notifications WHERE title = $1 LIMIT 1`,
        [title]
      );
      if (existing.length === 0) {
        await query(
          `INSERT INTO system_notifications (title, message, type, category, action_url)
           VALUES ($1, $2, 'warning', 'inventory', '/products')`,
          [
            title,
            `${p.title.slice(0, 50)} stoğu ${p.stock_quantity} adede geriledi. Sipariş iptali riskine karşı stok güncelleyin.`
          ]
        );
        result.stockAlerts++;
        result.totalNewNotifications++;
        result.details.push(`Stok Uyarısı: ${p.barcode}`);
      }
    }

    // 4. RULE 4: Critical Unresolved Crash Scan
    const crashes = await query(`
      SELECT id, error_type, error_message, page_url, created_at
      FROM system_crash_logs
      WHERE status = 'unresolved'
      ORDER BY created_at DESC
      LIMIT 5
    `);

    for (const c of crashes) {
      const title = `🔥 Sistem Hatası: ${c.error_type} (${c.page_url})`;
      const existing = await query(
        `SELECT id FROM system_notifications WHERE title = $1 LIMIT 1`,
        [title]
      );
      if (existing.length === 0) {
        await query(
          `INSERT INTO system_notifications (title, message, type, category, action_url)
           VALUES ($1, $2, 'danger', 'crash', '/system/crashes')`,
          [
            title,
            `${c.page_url} sayfasında ${c.error_type} yakalandı: ${(c.error_message || '').slice(0, 70)}...`
          ]
        );
        result.crashAlerts++;
        result.totalNewNotifications++;
        result.details.push(`Sistem Çökme Bildirimi: ${c.error_type}`);
      }
    }

        // 5. RULE 5: High Value Returns and Cancellations Scan
    const returnsCancellations = await query(`
      SELECT 
        o.id,
        o.marketplace_order_number,
        o.customer_name,
        o.order_status,
        o.total_sale_price,
        o.return_reason,
        o.order_date
      FROM orders o
      WHERE o.order_status IN ('Cancelled', 'Returned') OR o.return_reason IS NOT NULL
      ORDER BY o.order_date DESC
      LIMIT 10
    `);

    for (const ret of returnsCancellations) {
      const isReturn = ret.order_status === 'Returned' || !!ret.return_reason;
      const title = isReturn 
        ? `🔄 Yeni İade Talebi: #${ret.marketplace_order_number}`
        : `❌ İptal Edilen Sipariş: #${ret.marketplace_order_number}`;
      
      const existing = await query(
        `SELECT id FROM system_notifications WHERE title = $1 LIMIT 1`,
        [title]
      );
      if (existing.length === 0) {
        await query(
          `INSERT INTO system_notifications (title, message, type, category, action_url)
           VALUES ($1, $2, 'warning', 'order', '/returns-cancellations')`,
          [
            title,
            `Müşteri: ${ret.customer_name || 'Bilinmiyor'} - Tutar: ₺${parseFloat(ret.total_sale_price || 0).toFixed(2)}. Neden: ${ret.return_reason || 'Kullanıcı talebi / İptal'}`
          ]
        );
        result.totalNewNotifications++;
        result.details.push(`${isReturn ? 'İade' : 'İptal'} Bildirimi: #${ret.marketplace_order_number}`);
      }
    }

    return result;
  } catch (error: any) {
    console.error('Notification scanner error:', error);
    result.details.push(`Tarama Hatası: ${error?.message || error}`);
    return result;
  }
}
