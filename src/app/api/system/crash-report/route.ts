import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');

    let sql = `
      SELECT 
        id, error_type as "errorType", error_message as "errorMessage",
        stack_trace as "stackTrace", page_url as "pageUrl",
        component_name as "componentName", user_agent as "userAgent",
        severity, status, metadata,
        created_at as "createdAt", resolved_at as "resolvedAt"
      FROM system_crash_logs
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    if (severity && severity !== 'all') {
      params.push(severity);
      sql += ` AND severity = $${params.length}`;
    }

    sql += ` ORDER BY created_at DESC LIMIT 100`;

    const logs = await query(sql, params);

    // Summary stats
    const stats = await query(`
      SELECT 
        COUNT(*) as "totalCrashes",
        COUNT(CASE WHEN status = 'unresolved' THEN 1 END) as "unresolvedCrashes",
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as "resolvedCrashes",
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as "criticalCrashes"
      FROM system_crash_logs
    `);

    return NextResponse.json({
      logs,
      stats: stats[0] || { totalCrashes: 0, unresolvedCrashes: 0, resolvedCrashes: 0, criticalCrashes: 0 }
    });
  } catch (err: any) {
    console.error('Crash report fetch error:', err);
    return NextResponse.json({ error: 'Çökme kayıtları alınamadı.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { error_type, error_message, stack_trace, page_url, component_name, severity, user_agent, metadata } = body;

    if (!error_message || !page_url) {
      return NextResponse.json({ error: 'Eksik parametre.' }, { status: 400 });
    }

    await query(`
      INSERT INTO system_crash_logs 
      (error_type, error_message, stack_trace, page_url, component_name, severity, user_agent, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
    `, [
      error_type || 'ClientError',
      error_message,
      stack_trace || null,
      page_url,
      component_name || 'General',
      severity || 'error',
      user_agent || null,
      metadata ? JSON.stringify(metadata) : '{}'
    ]);

    return NextResponse.json({ success: true, message: 'Çökme logu başarıyla kaydedildi.' });
  } catch (err: any) {
    console.error('Crash log save error:', err);
    return NextResponse.json({ error: 'Log kaydedilemedi.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'Eksik parametre.' }, { status: 400 });
    }

    await query(`
      UPDATE system_crash_logs
      SET status = $1,
          resolved_at = CASE WHEN $1 = 'resolved' THEN now() ELSE null END
      WHERE id = $2
    `, [status, id]);

    return NextResponse.json({ success: true, message: 'Çökme durumu güncellendi.' });
  } catch (err: any) {
    console.error('Crash update error:', err);
    return NextResponse.json({ error: 'Durum güncellenemedi.' }, { status: 500 });
  }
}
