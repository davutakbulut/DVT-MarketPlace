import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');
    const lastKnownOrderId = searchParams.get('lastOrderId');

    let sinceDate: Date;
    if (since && !isNaN(Date.parse(since))) {
      sinceDate = new Date(since);
    } else {
      // Default to 15 seconds ago for initial baseline
      sinceDate = new Date(Date.now() - 15 * 1000);
    }

    // 1. Fetch newly inserted orders since `sinceDate`
    const newOrders = await query(`
      SELECT 
        o.id,
        o.marketplace_order_number as "orderNumber",
        o.customer_name as "customerName",
        o.paid_amount as "paidAmount",
        o.gross_amount as "grossAmount",
        o.status,
        o.marketplace,
        o.created_at as "createdAt",
        COUNT(oi.id) as "totalItems"
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.created_at > $1
      ${lastKnownOrderId ? `AND o.id != $2` : ''}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `, lastKnownOrderId ? [sinceDate.toISOString(), lastKnownOrderId] : [sinceDate.toISOString()]);

    // 2. Fetch latest order overall (to establish baseline watermark)
    const latestOrderRes = await query(`
      SELECT id, marketplace_order_number as "orderNumber", created_at as "createdAt"
      FROM orders
      ORDER BY created_at DESC
      LIMIT 1
    `);
    const latestOrder = latestOrderRes[0] || null;

    // 3. Fetch unread notifications count
    const notifCountRes = await query(`
      SELECT COUNT(*) as count 
      FROM system_notifications 
      WHERE is_read = false
    `);
    const unreadNotificationsCount = parseInt(notifCountRes[0]?.count || '0');

    // 4. Fetch store sync status summary
    const storesRes = await query(`
      SELECT id, store_name as "storeName", marketplace, is_active as "isActive"
      FROM stores
      WHERE is_active = true
    `);

    return NextResponse.json({
      success: true,
      serverTime: new Date().toISOString(),
      isSyncActive: true,
      newOrders,
      latestOrder,
      unreadNotificationsCount,
      activeStoresCount: storesRes.length,
    });
  } catch (error: any) {
    console.error('Live Sync Poll Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
