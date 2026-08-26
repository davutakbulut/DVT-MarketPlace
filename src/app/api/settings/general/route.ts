export async function GET() {
  try {
    const res = await query(`
      SELECT 
        default_vat_rate as "defaultVatRate",
        default_withholding_rate as "defaultWithholdingRate",
        default_service_fee as "defaultServiceFee",
        min_profit_margin_warning as "minProfitMarginWarning",
        default_shipping_carrier as "defaultShippingCarrier",
        default_packaging_cost as "defaultPackagingCost",
        invoice_fixed_cost as "invoiceFixedCost",
        extra_operation_cost as "extraOperationCost",
        email_daily_summary_enabled as "emailDailySummaryEnabled",
        email_negative_profit_alert as "emailNegativeProfitAlert"
      FROM company_settings
      LIMIT 1
    `);
    return NextResponse.json({ success: true, settings: res[0] || {} });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      defaultVatRate, 
      defaultWithholdingRate, 
      defaultServiceFee, 
      minProfitMarginWarning, 
      defaultShippingCarrier,
      defaultPackagingCost,
      invoiceFixedCost,
      extraOperationCost,
      emailDailySummaryEnabled,
      emailNegativeProfitAlert
    } = body;

    // 1. Update company_settings
    await query(`
      UPDATE company_settings
      SET default_vat_rate = COALESCE($1, default_vat_rate),
          default_withholding_rate = COALESCE($2, default_withholding_rate),
          default_service_fee = COALESCE($3, default_service_fee),
          min_profit_margin_warning = COALESCE($4, min_profit_margin_warning),
          default_shipping_carrier = COALESCE($5, default_shipping_carrier),
          default_packaging_cost = COALESCE($6, default_packaging_cost),
          invoice_fixed_cost = COALESCE($7, invoice_fixed_cost),
          extra_operation_cost = COALESCE($8, extra_operation_cost),
          email_daily_summary_enabled = COALESCE($9, email_daily_summary_enabled),
          email_negative_profit_alert = COALESCE($10, email_negative_profit_alert),
          updated_at = now()
      WHERE TRUE
    `, [
      defaultVatRate, 
      defaultWithholdingRate, 
      defaultServiceFee, 
      minProfitMarginWarning, 
      defaultShippingCarrier,
      defaultPackagingCost,
      invoiceFixedCost,
      extraOperationCost,
      emailDailySummaryEnabled,
      emailNegativeProfitAlert
    ]);

    // 2. Update platform_service_fees if fee is supplied
    if (defaultServiceFee !== undefined) {
      await query(`
        INSERT INTO platform_service_fees (marketplace, fee_amount_inc_vat, vat_rate, updated_at)
        VALUES ('trendyol', $1, 20.00, now())
        ON CONFLICT (marketplace)
        DO UPDATE SET fee_amount_inc_vat = $1, updated_at = now()
      `, [defaultServiceFee]);
    }

    return NextResponse.json({ success: true, message: 'Ayarlar veritabanına kalıcı olarak başarıyla kaydedildi!' });
  } catch (error: any) {
    console.error('General settings update error:', error);
    return NextResponse.json({ error: 'Ayarlar kaydedilemedi: ' + error.message }, { status: 500 });
  }
}
