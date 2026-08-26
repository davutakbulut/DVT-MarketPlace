import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Case A: Click Event
    if (body.clickEvent) {
      const c = body.clickEvent;
      await query(`
        INSERT INTO system_click_events 
        (page_url, element_tag, element_id, element_classes, element_text, click_x_percent, click_y_percent, viewport_width, viewport_height, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
      `, [
        c.pageUrl, c.elementTag, c.elementId || null, c.elementClasses || null,
        c.elementText || null, c.clickXPercent || 50, c.clickYPercent || 50,
        c.viewportWidth || 1440, c.viewportHeight || 900
      ]);
      return NextResponse.json({ success: true });
    }

    // Case B: Page Analytics
    const { pageUrl, pageTitle, dwellTimeSeconds, loadTimeMs, ttfbMs, fcpMs, dataTransferBytes, apiCallsCount, errorsCount } = body;
    if (pageUrl) {
      await query(`
        INSERT INTO system_page_analytics
        (page_url, page_title, dwell_time_seconds, load_time_ms, ttfb_ms, fcp_ms, data_transfer_bytes, api_calls_count, errors_count, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
      `, [
        pageUrl, pageTitle || pageUrl, dwellTimeSeconds || 0, loadTimeMs || 0,
        ttfbMs || 0, fcpMs || 0, dataTransferBytes || 0, apiCallsCount || 0, errorsCount || 0
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Kayıt başarısız.' }, { status: 500 });
  }
}
