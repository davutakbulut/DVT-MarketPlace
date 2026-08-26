import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 1. Check if we need to auto-generate alerts from recent live events
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
      LIMIT 5
    `);

    for (const ord of negativeOrders) {
      // Check if notification already exists for this order
      const existing = await query(
        `SELECT id FROM system_notifications WHERE title LIKE $1 LIMIT 1`,
        [`%#${ord.marketplace_order_number}%`]
      );
      if (existing.length === 0) {
        await query(
          `INSERT INTO system_notifications (title, message, type, category, action_url)
           VALUES ($1, $2, 'danger', 'order', '/live-analysis')`,
          [
            `🚨 Zararına Sipariş: #${ord.marketplace_order_number}`,
            `Müşteri: ${ord.customer_name || 'Bilinmiyor'} - Kargo & komisyon sonrası ₺${Math.abs(ord.net_profit).toFixed(2)} net zarar tespit edildi.`
          ]
        );
      }
    }

    // 2. Check for desi overcharges
    const desiOvercharges = await query(`
      SELECT 
        o.id,
        o.package_number,
        o.billed_desi,
        o.calculated_desi,
        o.order_date
      FROM orders o
      WHERE o.billed_desi > o.calculated_desi
      ORDER BY o.order_date DESC
      LIMIT 3
    `);

    for (const d of desiOvercharges) {
      const existing = await query(
        `SELECT id FROM system_notifications WHERE title LIKE $1 LIMIT 1`,
        [`%Paket #${d.package_number}%`]
      );
      if (existing.length === 0) {
        await query(
          `INSERT INTO system_notifications (title, message, type, category, action_url)
           VALUES ($1, $2, 'warning', 'shipping', '/settlement-desi-audit')`,
          [
            `⚠️ Desi Aşımı: Paket #${d.package_number}`,
            `Kargo ${d.billed_desi} desi faturalandırdı (Katalog: ${d.calculated_desi} desi). Hakediş kesintisi incelenmeli.`
          ]
        );
      }
    }

    // 3. Check for out of stock products
    const outOfStock = await query(`
      SELECT id, title, barcode, stock_quantity
      FROM products
      WHERE stock_quantity = 0
      LIMIT 3
    `);

    for (const p of outOfStock) {
      const existing = await query(
        `SELECT id FROM system_notifications WHERE title LIKE $1 LIMIT 1`,
        [`%${p.barcode}%`]
      );
      if (existing.length === 0) {
        await query(
          `INSERT INTO system_notifications (title, message, type, category, action_url)
           VALUES ($1, $2, 'warning', 'inventory', '/products')`,
          [
            `📦 Stok Tükendi: ${p.barcode}`,
            `${p.title.slice(0, 50)} stoğu 0 adede düştü. Sipariş iptali riskine karşı stok güncelleyin.`
          ]
        );
      }
    }

    // 4. Fetch all notifications from DB
    const notifications = await query(`
      SELECT 
        id,
        title,
        message as desc,
        type,
        category,
        action_url as "actionUrl",
        is_read as "isRead",
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as "createdAt",
        CASE 
          WHEN NOW() - created_at < INTERVAL '1 hour' THEN CONCAT(ROUND(EXTRACT(EPOCH FROM (NOW() - created_at)) / 60), ' dk önce')
          WHEN NOW() - created_at < INTERVAL '24 hours' THEN CONCAT(ROUND(EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600), ' saat önce')
          ELSE TO_CHAR(created_at, 'DD.MM.YYYY')
        END as "timeAgo"
      FROM system_notifications
      ORDER BY created_at DESC
      LIMIT 50
    `);

    const unreadCount = notifications.filter((n: any) => !n.isRead).length;

    return NextResponse.json({
      notifications,
      unreadCount,
      totalCount: notifications.length,
    });
  } catch (error: any) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json({ error: 'Bildirimler alınamadı' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, message, type = 'info', category = 'system', actionUrl = '/dashboard' } = body;

    const result = await query(
      `INSERT INTO system_notifications (title, message, type, category, action_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, message, type, category, action_url, created_at`,
      [title, message, type, category, actionUrl]
    );

    return NextResponse.json({
      success: true,
      notification: result[0],
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Bildirim oluşturulamadı' }, { status: 500 });
  }
}
