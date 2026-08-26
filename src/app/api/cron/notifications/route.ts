import { NextResponse } from 'next/server';
import { runNotificationScanner } from '@/lib/notificationScanner';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const result = await runNotificationScanner();
    return NextResponse.json({
      success: true,
      message: 'Otomatik bildirim taraması başarıyla tamamlandı.',
      ...result,
    });
  } catch (error: any) {
    console.error('Cron notification scan error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Tarama hatası' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
