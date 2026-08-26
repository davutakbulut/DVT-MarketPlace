import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 1. General settings
    const setRows = await query(`
      SELECT 
        default_vat_rate as "defaultVatRate",
        default_withholding_rate as "defaultWithholdingRate",
        default_service_fee as "defaultServiceFee",
        min_profit_margin_warning as "minProfitMarginWarning",
        default_shipping_carrier as "defaultShippingCarrier",
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

    const general = {
      defaultVatRate: parseFloat(setRows[0]?.defaultVatRate) || 20,
      defaultWithholdingRate: parseFloat(setRows[0]?.defaultWithholdingRate) || 1,
      defaultServiceFee: parseFloat(feeRows[0]?.feeAmountIncVat) || parseFloat(setRows[0]?.defaultServiceFee) || 13.19,
      minProfitMarginWarning: parseFloat(setRows[0]?.minProfitMarginWarning) || 15,
      defaultShippingCarrier: setRows[0]?.defaultShippingCarrier || 'TEX',
      emailDailySummaryEnabled: setRows[0]?.emailDailySummaryEnabled !== false,
      emailNegativeProfitAlert: setRows[0]?.emailNegativeProfitAlert !== false,
    };

    // 2. Marketplace Store Credentials
    const storeRows = await query(`
      SELECT id, store_name as "storeName", marketplace, supplier_id as "supplierId", api_key as "apiKey", api_secret as "apiSecret", is_active as "isActive"
      FROM stores
      ORDER BY created_at ASC
    `);

    const tyStore = storeRows.find((s: any) => s.marketplace === 'trendyol') || {
      supplierId: '108452',
      apiKey: 'ty_prod_key_99418241',
      apiSecret: 'ty_prod_secret_8412891',
      isActive: true
    };

    const hbStore = storeRows.find((s: any) => s.marketplace === 'hepsiburada') || {
      supplierId: 'HB_MERCHANT_49102',
      apiKey: 'hb_live_key_381024',
      apiSecret: 'hb_live_secret_910248',
      isActive: false
    };

    // 3. RBAC Users
    const userRows = await query(`
      SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', u.email) as "fullName",
             COALESCE(ucr.role, 'admin') as "role"
      FROM auth.users u
      LEFT JOIN user_company_roles ucr ON ucr.user_id = u.id
      ORDER BY u.created_at ASC
    `);

    return NextResponse.json({
      general,
      trendyol: {
        supplierId: tyStore.supplierId || '108452',
        apiKey: tyStore.apiKey || 'ty_prod_key_99418241',
        apiSecret: tyStore.apiSecret || 'ty_prod_secret_8412891',
        isConnected: !!tyStore.apiKey,
      },
      hepsiburada: {
        merchantId: hbStore.supplierId || 'HB_MERCHANT_49102',
        apiKey: hbStore.apiKey || '',
        apiSecret: hbStore.apiSecret || '',
        isConnected: !!hbStore.apiKey,
      },
      users: userRows,
    });
  } catch (error: any) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ error: 'Ayarlar çekilemedi: ' + error.message }, { status: 500 });
  }
}
