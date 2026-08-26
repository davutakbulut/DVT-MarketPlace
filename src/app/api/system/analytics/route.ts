import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const selectedPage = searchParams.get('page') || '/product-pricing';

    // 1. Page Performance & Dwell Time Aggregation
    const pageMetrics = await query(`
      SELECT 
        page_url as "pageUrl",
        COALESCE(MAX(page_title), page_url) as "pageTitle",
        ROUND(AVG(CASE WHEN dwell_time_seconds > 0 THEN dwell_time_seconds END), 1) as "avgDwellSeconds",
        ROUND(AVG(CASE WHEN load_time_ms > 0 THEN load_time_ms END), 0) as "avgLoadTimeMs",
        ROUND(AVG(CASE WHEN ttfb_ms > 0 THEN ttfb_ms END), 0) as "avgTtfbMs",
        ROUND(AVG(CASE WHEN fcp_ms > 0 THEN fcp_ms END), 0) as "avgFcpMs",
        ROUND(AVG(data_transfer_bytes) / 1024.0, 1) as "avgDataKb",
        COUNT(*) as "visitCount"
      FROM system_page_analytics
      GROUP BY page_url
      ORDER BY "avgDwellSeconds" DESC NULLS LAST
    `);

    // 2. Click Heatmap Data for Selected Page
    const heatmapPoints = await query(`
      SELECT 
        click_x_percent as "x",
        click_y_percent as "y",
        element_tag as "tag",
        element_text as "text",
        COUNT(*) as "weight"
      FROM system_click_events
      WHERE page_url = $1
      GROUP BY click_x_percent, click_y_percent, element_tag, element_text
      ORDER BY "weight" DESC
      LIMIT 150
    `, [selectedPage]);

    // 3. Top Clicked Elements Across Platform
    const topElements = await query(`
      SELECT 
        page_url as "pageUrl",
        element_text as "elementText",
        element_tag as "elementTag",
        COUNT(*) as "clickCount"
      FROM system_click_events
      WHERE element_text IS NOT NULL AND element_text != ''
      GROUP BY page_url, element_text, element_tag
      ORDER BY "clickCount" DESC
      LIMIT 10
    `);

    // 4. Overall Overview KPIs
    const overview = await query(`
      SELECT 
        COUNT(DISTINCT page_url) as "trackedPages",
        ROUND(AVG(CASE WHEN dwell_time_seconds > 0 THEN dwell_time_seconds END), 1) as "overallAvgDwell",
        ROUND(AVG(CASE WHEN load_time_ms > 0 THEN load_time_ms END), 0) as "overallAvgLoadMs",
        ROUND(SUM(data_transfer_bytes) / (1024.0 * 1024.0), 2) as "totalDataMb",
        (SELECT COUNT(*) FROM system_click_events) as "totalClicks"
      FROM system_page_analytics
    `);

    return NextResponse.json({
      pageMetrics,
      heatmapPoints,
      topElements,
      overview: overview[0] || { trackedPages: 0, overallAvgDwell: 0, overallAvgLoadMs: 0, totalDataMb: 0, totalClicks: 0 },
      selectedPage
    });
  } catch (err: any) {
    console.error('Analytics fetch error:', err);
    return NextResponse.json({ error: 'Analitik verileri alınamadı.' }, { status: 500 });
  }
}
