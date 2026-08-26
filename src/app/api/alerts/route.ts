import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const alerts = await query(`
      SELECT 
        id, alert_type as "alertType", severity, title, description,
        related_entity_type as "relatedEntityType", related_entity_id as "relatedEntityId",
        loss_amount as "lossAmount", is_resolved as "isResolved",
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as "createdAt"
      FROM anomaly_alerts
      ORDER BY 
        CASE WHEN severity = 'critical' THEN 1 WHEN severity = 'warning' THEN 2 ELSE 3 END,
        created_at DESC
    `);

    let criticalCount = 0;
    let warningCount = 0;
    let totalRiskAmount = 0;

    for (const a of alerts) {
      if (!a.isResolved) {
        if (a.severity === 'critical') criticalCount++;
        if (a.severity === 'warning') warningCount++;
        totalRiskAmount += parseFloat(a.lossAmount) || 0;
      }
    }

    return NextResponse.json({
      alerts,
      summary: {
        totalAlerts: alerts.filter((a: any) => !a.isResolved).length,
        criticalCount,
        warningCount,
        totalRiskAmount: Math.round(totalRiskAmount * 100) / 100,
      }
    });
  } catch (error: any) {
    console.error('Alerts fetch error:', error);
    return NextResponse.json({ error: 'Uyarılar alınamadı.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { id, isResolved } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Eksik parametre.' }, { status: 400 });
    }

    await query(`
      UPDATE anomaly_alerts
      SET is_resolved = $1, updated_at = now()
      WHERE id = $2
    `, [isResolved !== false, id]);

    return NextResponse.json({ success: true, message: 'Uyarı durumu güncellendi.' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Güncellenemedi.' }, { status: 500 });
  }
}
