import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, markAll = false } = body;

    if (markAll) {
      await query(`UPDATE system_notifications SET is_read = true, read_at = NOW() WHERE is_read = false`);
      return NextResponse.json({ success: true, message: 'Tüm bildirimler okundu sayıldı.' });
    }

    if (id) {
      await query(`UPDATE system_notifications SET is_read = true, read_at = NOW() WHERE id = $1`, [id]);
      return NextResponse.json({ success: true, message: 'Bildirim okundu.' });
    }

    return NextResponse.json({ error: 'Geçersiz parametre' }, { status: 400 });
  } catch (error: any) {
    console.error('Mark read error:', error);
    return NextResponse.json({ error: 'İşlem başarısız' }, { status: 500 });
  }
}
