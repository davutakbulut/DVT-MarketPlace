import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { defaultVatRate, defaultWithholdingRate, defaultServiceFee, minProfitMarginWarning, defaultShippingCarrier } = await request.json();

    // 1. Update company_settings
    await query(`
      UPDATE company_settings
      SET default_vat_rate = $1,
          default_withholding_rate = $2,
          default_service_fee = $3,
          min_profit_margin_warning = $4,
          default_shipping_carrier = $5,
          updated_at = now()
      WHERE TRUE
    `, [defaultVatRate, defaultWithholdingRate, defaultServiceFee, minProfitMarginWarning, defaultShippingCarrier || 'TEX']);

    // 2. Update platform_service_fees
    await query(`
      INSERT INTO platform_service_fees (marketplace, fee_amount_inc_vat, vat_rate, updated_at)
      VALUES ('trendyol', $1, 20.00, now())
      ON CONFLICT (marketplace)
      DO UPDATE SET fee_amount_inc_vat = $1, updated_at = now()
    `, [defaultServiceFee]);

    return NextResponse.json({ success: true, message: 'Genel ayarlar ve hizmet bedeli veritabanına başarıyla kaydedildi!' });
  } catch (error: any) {
    console.error('General settings update error:', error);
    return NextResponse.json({ error: 'Ayarlar kaydedilemedi: ' + error.message }, { status: 500 });
  }
}
