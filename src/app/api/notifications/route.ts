import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { runNotificationScanner } from '@/lib/notificationScanner';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Run automatic scanner across all 5 financial & operation rules
    await runNotificationScanner();

    // 2. Fetch latest notifications from DB
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
