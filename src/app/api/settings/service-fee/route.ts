import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const rows = await query(`
      SELECT fee_amount_inc_vat as "feeAmountIncVat", vat_rate as "vatRate"
      FROM platform_service_fees
      WHERE marketplace = 'trendyol'
      LIMIT 1
    `);

    const fee = rows[0] ? parseFloat(rows[0].feeAmountIncVat) : 13.19;
    return NextResponse.json({ feeAmountIncVat: fee, vatRate: 20 });
  } catch (e: any) {
    return NextResponse.json({ feeAmountIncVat: 13.19, error: e.message });
  }
}

export async function POST(request: Request) {
  try {
    const { feeAmountIncVat } = await request.json();
    if (feeAmountIncVat === undefined || isNaN(feeAmountIncVat)) {
      return NextResponse.json({ error: 'Geçersiz tutar.' }, { status: 400 });
    }

    await query(`
      INSERT INTO platform_service_fees (marketplace, fee_amount_inc_vat, vat_rate, updated_at)
      VALUES ('trendyol', $1, 20.00, now())
      ON CONFLICT (marketplace)
      DO UPDATE SET fee_amount_inc_vat = $1, updated_at = now()
    `, [feeAmountIncVat]);

    return NextResponse.json({ success: true, message: 'Platform hizmet bedeli veritabanında güncellendi.', feeAmountIncVat });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
