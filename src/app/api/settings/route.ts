import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 1. General settings from DB
    const setRows = await query(`
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

    const feeRows = await query(`
      SELECT fee_amount_inc_vat as "feeAmountIncVat"
      FROM platform_service_fees
      WHERE marketplace = 'trendyol'
      LIMIT 1
    `);

    const cs = setRows[0] || {};
    const general = {
      defaultVatRate: cs.defaultVatRate !== null ? parseFloat(cs.defaultVatRate) : 10,
      defaultWithholdingRate: cs.defaultWithholdingRate !== null ? parseFloat(cs.defaultWithholdingRate) : 1.0,
      defaultServiceFee: feeRows[0]?.feeAmountIncVat ? parseFloat(feeRows[0].feeAmountIncVat) : (cs.defaultServiceFee ? parseFloat(cs.defaultServiceFee) : 13.19),
      minProfitMarginWarning: cs.minProfitMarginWarning !== null ? parseFloat(cs.minProfitMarginWarning) : 15,
      defaultShippingCarrier: cs.defaultShippingCarrier || 'TEX',
      defaultPackagingCost: cs.defaultPackagingCost !== null ? parseFloat(cs.defaultPackagingCost) : 0.0,
      invoiceFixedCost: cs.invoiceFixedCost !== null ? parseFloat(cs.invoiceFixedCost) : 0.0,
      extraOperationCost: cs.extraOperationCost !== null ? parseFloat(cs.extraOperationCost) : 0.0,
      emailDailySummaryEnabled: cs.emailDailySummaryEnabled !== false,
      emailNegativeProfitAlert: cs.emailNegativeProfitAlert !== false,
    };

    // 2. Stores list
    const stores = await query(`
      SELECT id, store_name as "storeName", marketplace, supplier_id as "supplierId", api_key as "apiKey", api_secret as "apiSecret", is_active as "isActive"
      FROM stores
      ORDER BY created_at ASC
    `);

    // 3. RBAC Users
    const userRows = await query(`
      SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', u.email) as "fullName",
             COALESCE(ucr.role, 'admin') as "role",
             COALESCE(ucr.can_view_margins, true) as "canViewMargins",
             COALESCE(ucr.can_view_cogs, true) as "canViewCogs",
             COALESCE(ucr.can_export_reports, true) as "canExportReports",
             COALESCE(ucr.can_edit_prices, true) as "canEditPrices"
      FROM auth.users u
      LEFT JOIN user_company_roles ucr ON ucr.user_id = u.id
      ORDER BY u.created_at ASC
    `);

    return NextResponse.json({
      general,
      stores,
      users: userRows,
    });
  } catch (error: any) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ error: 'Ayarlar çekilemedi: ' + error.message }, { status: 500 });
  }
}
