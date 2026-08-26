import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await query(`
      SELECT 
        first_name as "firstName",
        last_name as "lastName",
        phone,
        email,
        country,
        city,
        district,
        postal_code as "postalCode",
        address,

        net_vat_mode as "netVatMode",
        default_currency as "defaultCurrency",
        include_stopaj_in_calc as "includeStopajInCalc",
        include_return_rate as "includeReturnRate",
        default_return_rate as "defaultReturnRate",

        default_vat_rate as "defaultVatRate",
        default_withholding_rate as "defaultWithholdingRate",
        default_service_fee as "defaultServiceFee",
        min_profit_margin_warning as "minProfitMarginWarning",
        default_shipping_carrier as "defaultShippingCarrier",

        disable_barem_0_199 as "disableBarem0199",
        disable_barem_200_349 as "disableBarem200349",

        min_order_qty_0_25 as "minOrderQty025",
        min_order_qty_25_35 as "minOrderQty2535",
        min_order_qty_35_50 as "minOrderQty3550",
        min_order_qty_50_75 as "minOrderQty5075",

        disable_all_margin_alerts as "disableAllMarginAlerts",
        margin_calc_type as "marginCalcType",

        default_packaging_cost as "defaultPackagingCost",
        invoice_fixed_cost as "invoiceFixedCost",
        extra_operation_cost as "extraOperationCost",

        email_daily_summary_enabled as "emailDailySummaryEnabled",
        email_negative_profit_alert as "emailNegativeProfitAlert",
        email_notification_preferences as "emailNotificationPreferences",

        xml_feed_settings as "xmlFeedSettings",
        custom_category_commissions as "customCategoryCommissions"
      FROM company_settings
      LIMIT 1
    `);

    return NextResponse.json({ success: true, settings: res[0] || {} });
  } catch (error: any) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      firstName, lastName, phone, email, country, city, district, postalCode, address,
      netVatMode, defaultCurrency, includeStopajInCalc, includeReturnRate, defaultReturnRate,
      defaultVatRate, defaultWithholdingRate, defaultServiceFee, minProfitMarginWarning, defaultShippingCarrier,
      disableBarem0199, disableBarem200349,
      minOrderQty025, minOrderQty2535, minOrderQty3550, minOrderQty5075,
      disableAllMarginAlerts, marginCalcType,
      defaultPackagingCost, invoiceFixedCost, extraOperationCost,
      emailDailySummaryEnabled, emailNegativeProfitAlert, emailNotificationPreferences,
      xmlFeedSettings, customCategoryCommissions
    } = body;

    await query(`
      UPDATE company_settings
      SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        phone = COALESCE($3, phone),
        email = COALESCE($4, email),
        country = COALESCE($5, country),
        city = COALESCE($6, city),
        district = COALESCE($7, district),
        postal_code = COALESCE($8, postal_code),
        address = COALESCE($9, address),

        net_vat_mode = COALESCE($10, net_vat_mode),
        default_currency = COALESCE($11, default_currency),
        include_stopaj_in_calc = COALESCE($12, include_stopaj_in_calc),
        include_return_rate = COALESCE($13, include_return_rate),
        default_return_rate = COALESCE($14, default_return_rate),

        default_vat_rate = COALESCE($15, default_vat_rate),
        default_withholding_rate = COALESCE($16, default_withholding_rate),
        default_service_fee = COALESCE($17, default_service_fee),
        min_profit_margin_warning = COALESCE($18, min_profit_margin_warning),
        default_shipping_carrier = COALESCE($19, default_shipping_carrier),

        disable_barem_0_199 = COALESCE($20, disable_barem_0_199),
        disable_barem_200_349 = COALESCE($21, disable_barem_200_349),

        min_order_qty_0_25 = COALESCE($22, min_order_qty_0_25),
        min_order_qty_25_35 = COALESCE($23, min_order_qty_25_35),
        min_order_qty_35_50 = COALESCE($24, min_order_qty_35_50),
        min_order_qty_50_75 = COALESCE($25, min_order_qty_50_75),

        disable_all_margin_alerts = COALESCE($26, disable_all_margin_alerts),
        margin_calc_type = COALESCE($27, margin_calc_type),

        default_packaging_cost = COALESCE($28, default_packaging_cost),
        invoice_fixed_cost = COALESCE($29, invoice_fixed_cost),
        extra_operation_cost = COALESCE($30, extra_operation_cost),

        email_daily_summary_enabled = COALESCE($31, email_daily_summary_enabled),
        email_negative_profit_alert = COALESCE($32, email_negative_profit_alert),
        email_notification_preferences = COALESCE($33, email_notification_preferences),

        xml_feed_settings = COALESCE($34, xml_feed_settings),
        custom_category_commissions = COALESCE($35, custom_category_commissions),
        updated_at = now()
      WHERE TRUE
    `, [
      firstName, lastName, phone, email, country, city, district, postalCode, address,
      netVatMode, defaultCurrency, includeStopajInCalc, includeReturnRate, defaultReturnRate,
      defaultVatRate, defaultWithholdingRate, defaultServiceFee, minProfitMarginWarning, defaultShippingCarrier,
      disableBarem0199, disableBarem200349,
      minOrderQty025, minOrderQty2535, minOrderQty3550, minOrderQty5075,
      disableAllMarginAlerts, marginCalcType,
      defaultPackagingCost, invoiceFixedCost, extraOperationCost,
      emailDailySummaryEnabled, emailNegativeProfitAlert, 
      emailNotificationPreferences ? JSON.stringify(emailNotificationPreferences) : null,
      xmlFeedSettings ? JSON.stringify(xmlFeedSettings) : null,
      customCategoryCommissions ? JSON.stringify(customCategoryCommissions) : null
    ]);

    // Update platform service fee if supplied
    if (defaultServiceFee !== undefined) {
      await query(`
        INSERT INTO platform_service_fees (marketplace, fee_amount_inc_vat, vat_rate, updated_at)
        VALUES ('trendyol', $1, 20.00, now())
        ON CONFLICT (marketplace)
        DO UPDATE SET fee_amount_inc_vat = $1, updated_at = now()
      `, [defaultServiceFee]);
    }

    return NextResponse.json({ success: true, message: 'Tüm ayarlar veritabanına başarıyla kaydedildi!' });
  } catch (error: any) {
    console.error('General settings update error:', error);
    return NextResponse.json({ error: 'Ayarlar kaydedilemedi: ' + error.message }, { status: 500 });
  }
}
