export async function GET() {
  try {
    const res = await query(`
      SELECT 
        email_daily_summary_enabled as "emailDailySummaryEnabled",
        email_negative_profit_alert as "emailNegativeProfitAlert",
        min_profit_margin_warning as "minProfitMarginWarning"
      FROM company_settings
      LIMIT 1
    `);
    return NextResponse.json({ success: true, preferences: res[0] || {} });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { emailDailySummaryEnabled, emailNegativeProfitAlert } = await request.json();

    await query(`
      UPDATE company_settings
      SET email_daily_summary_enabled = $1,
          email_negative_profit_alert = $2,
          updated_at = now()
      WHERE TRUE
    `, [emailDailySummaryEnabled, emailNegativeProfitAlert]);

    return NextResponse.json({ success: true, message: 'Bildirim tercihleri veritabanına kaydedildi!' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Kaydedilemedi.' }, { status: 500 });
  }
}
