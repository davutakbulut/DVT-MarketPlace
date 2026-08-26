import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { buildDateConditions } from '@/lib/dateFilterHelper';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const carrier = searchParams.get('carrier') || '';
    const marketplace = searchParams.get('marketplace') || 'all';
    const storeId = searchParams.get('storeId') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeAds = searchParams.get('includeAds') !== 'false'; // default true

    // Dynamic extra operation rate from company_settings (default 6.00%)
    const settingsRes = await query(`SELECT extra_operation_rate as "extraOperationRate" FROM company_settings LIMIT 1`);
    const extraOpRate = parseFloat(settingsRes[0]?.extraOperationRate ?? 6.00);
    const extraOpFraction = extraOpRate / 100.0;

    // 1. Period Conditions (for calculating overall period ad spend and order count)
    let periodConditions: string[] = ['1=1'];
    let periodParams: any[] = [];
    let periodIdx = 1;

    if (storeId && storeId !== 'all') {
      periodConditions.push(`o.store_id::text = $${periodIdx}`);
      periodParams.push(storeId);
      periodIdx++;
    }

    if (marketplace && marketplace !== 'all') {
      periodConditions.push(`o.marketplace = $${periodIdx}`);
      periodParams.push(marketplace);
      periodIdx++;
    }

    const periodDateHelper = buildDateConditions(searchParams, 'o.order_date', periodIdx);
    if (periodDateHelper.whereClause && periodDateHelper.whereClause !== '1=1') {
      periodConditions.push(periodDateHelper.whereClause);
      periodParams.push(...periodDateHelper.params);
    }
    const periodWhereClause = periodConditions.join(' AND ');

    // 2. Fetch total ad spend for period
    let adConditions: string[] = ['1=1'];
    let adParams: any[] = [];
    let adIdx = 1;

    if (storeId && storeId !== 'all') {
      adConditions.push(`store_id::text = $${adIdx}`);
      adParams.push(storeId);
      adIdx++;
    }

    const adDateHelper = buildDateConditions(searchParams, 'invoice_date', adIdx);
    if (adDateHelper.whereClause && adDateHelper.whereClause !== '1=1') {
      adConditions.push(adDateHelper.whereClause);
      adParams.push(...adDateHelper.params);
    }
    const adWhereClause = adConditions.join(' AND ');

    const [adRes, periodOrdersRes] = await Promise.all([
      query(`SELECT COALESCE(SUM(amount_inc_vat), 0) as "totalAdSpend" FROM ad_invoices WHERE ${adWhereClause}`, adParams),
      query(`SELECT COUNT(*) as "totalPeriodOrders" FROM orders o WHERE ${periodWhereClause}`, periodParams),
    ]);

    const totalAdSpend = parseFloat(adRes[0]?.totalAdSpend || 0);
    const totalPeriodOrders = parseInt(periodOrdersRes[0]?.totalPeriodOrders || 0);
    const adSpendPerOrder = totalPeriodOrders > 0 ? (totalAdSpend / totalPeriodOrders) : 0;

    // 3. Filtered Conditions (for search, status, carrier, marketplace filters)
    let conditions: string[] = ['1=1'];
    let params: any[] = [];
    let pIdx = 1;

    if (search) {
      conditions.push(`(
        o.marketplace_order_number ILIKE $${pIdx} OR 
        o.package_number ILIKE $${pIdx} OR 
        o.customer_name ILIKE $${pIdx} OR 
        o.customer_city ILIKE $${pIdx} OR
        o.carrier_name ILIKE $${pIdx}
      )`);
      params.push(`%${search}%`);
      pIdx++;
    }

    if (status && status !== 'all') {
      conditions.push(`o.status ILIKE $${pIdx}`);
      params.push(`%${status}%`);
      pIdx++;
    }

    if (carrier && carrier !== 'all') {
      conditions.push(`o.carrier_name ILIKE $${pIdx}`);
      params.push(`%${carrier}%`);
      pIdx++;
    }

    if (marketplace && marketplace !== 'all') {
      conditions.push(`o.marketplace = $${pIdx}`);
      params.push(marketplace);
      pIdx++;
    }

    if (storeId && storeId !== 'all') {
      conditions.push(`o.store_id::text = $${pIdx}`);
      params.push(storeId);
      pIdx++;
    }

    const dateHelper = buildDateConditions(searchParams, 'o.order_date', pIdx);
    if (dateHelper.whereClause && dateHelper.whereClause !== '1=1') {
      conditions.push(dateHelper.whereClause);
      params.push(...dateHelper.params);
      pIdx = dateHelper.nextIndex;
    }

    const whereClause = conditions.join(' AND ');

    // Extra operation fraction param
    const extraParamIdx = pIdx;
    const statsParams = [...params, extraOpFraction];

    // Aggregate summary stats for the active view
    const statsQuery = `
      SELECT 
        COUNT(*) as "totalOrders",
        COALESCE(SUM(o.gross_amount), 0) as "totalGrossRevenue",
        COALESCE(SUM(o.paid_amount), 0) as "totalInvoicedRevenue",
        COALESCE(SUM(o.total_cost), 0) as "totalCogs",
        COALESCE(SUM(o.total_commission), 0) as "totalCommission",
        COALESCE(SUM(o.total_shipping_cost), 0) as "totalShipping",
        COALESCE(SUM(o.service_fee), 0) as "totalServiceFee",
        COALESCE(SUM(o.withholding_tax), 0) as "totalStopaj",
        COALESCE(SUM(o.net_vat), 0) as "totalNetVat",
        COALESCE(SUM(o.gross_amount * $${extraParamIdx}), 0) as "totalExtraOperation",
        COALESCE(SUM(o.paid_amount - (o.total_cost + o.total_commission + o.total_shipping_cost + o.service_fee + o.withholding_tax + o.net_vat + (o.gross_amount * $${extraParamIdx}))), 0) as "totalNetProfitWithoutAds"
      FROM orders o
      WHERE ${whereClause}
    `;
    const statsRes = await query(statsQuery, statsParams);
    const summary = statsRes[0] || {};

    const filteredOrdersCount = parseInt(summary.totalOrders || 0);
    const allocatedAdSpend = filteredOrdersCount * adSpendPerOrder;
    const netProfitWithoutAds = parseFloat(summary.totalNetProfitWithoutAds || 0);
    const finalNetProfit = includeAds ? (netProfitWithoutAds - allocatedAdSpend) : netProfitWithoutAds;
    const totalInvoicedRev = parseFloat(summary.totalInvoicedRevenue || 1);
    const averageMarginPercent = totalInvoicedRev > 0 ? ((finalNetProfit / totalInvoicedRev) * 100) : 0;

    const avgOrderValue = filteredOrdersCount > 0 ? (parseFloat(summary.totalInvoicedRevenue || 0) / filteredOrdersCount) : 0;

    summary.totalAdSpend = Math.round(allocatedAdSpend * 100) / 100;
    summary.adSpendPerOrder = Math.round(adSpendPerOrder * 100) / 100;
    summary.totalNetProfit = finalNetProfit;
    summary.averageMarginPercent = Math.round(averageMarginPercent * 10) / 10;
    summary.avgOrderValue = Math.round(avgOrderValue * 100) / 100;

    // Orders List params: params + extraOpFraction + adSpendPerOrder + limit + offset
    const adSpendIdx = pIdx + 1;
    const limitIdx = pIdx + 2;
    const offsetIdx = pIdx + 3;
    const listParams = [...params, extraOpFraction, adSpendPerOrder, limit, offset];

    const listQuery = `
      SELECT 
        o.id,
        o.marketplace,
        o.marketplace_order_number as "orderNumber",
        o.package_number as "packageNumber",
        TO_CHAR(o.order_date, 'YYYY-MM-DD HH24:MI') as "orderDate",
        o.status,
        o.customer_name as "customerName",
        o.customer_city as "city",
        o.customer_district as "district",
        o.customer_email as "email",
        o.customer_phone as "phone",
        o.carrier_name as "carrierName",
        o.tracking_code as "trackingCode",
        o.gross_amount as "grossAmount",
        o.paid_amount as "paidAmount",
        o.total_cost as "cogs",
        o.total_commission as "commission",
        o.total_shipping_cost as "shippingCost",
        o.service_fee as "serviceFee",
        o.withholding_tax as "withholdingTax",
        o.net_vat as "netVat",
        ROUND((o.gross_amount * $${extraParamIdx})::numeric, 2) as "extraOperationCost",
        $${adSpendIdx}::numeric as "adSpendPerOrder",
        ROUND((o.paid_amount - (o.total_cost + o.total_commission + o.total_shipping_cost + o.service_fee + o.withholding_tax + o.net_vat + (o.gross_amount * $${extraParamIdx})))::numeric, 2) as "netProfitWithoutAds",
        ROUND((o.paid_amount - (o.total_cost + o.total_commission + o.total_shipping_cost + o.service_fee + o.withholding_tax + o.net_vat + (o.gross_amount * $${extraParamIdx}) + $${adSpendIdx}))::numeric, 2) as "netProfit",
        ROUND(((o.paid_amount - (o.total_cost + o.total_commission + o.total_shipping_cost + o.service_fee + o.withholding_tax + o.net_vat + (o.gross_amount * $${extraParamIdx}) + $${adSpendIdx})) / NULLIF(o.paid_amount, 0) * 100)::numeric, 1) as "marginPercent",
        ROUND(((o.paid_amount - (o.total_cost + o.total_commission + o.total_shipping_cost + o.service_fee + o.withholding_tax + o.net_vat + (o.gross_amount * $${extraParamIdx}) + $${adSpendIdx})) / NULLIF(o.paid_amount, 0) * 100)::numeric, 1) as "profitMargin"
      FROM orders o
      WHERE ${whereClause}
      ORDER BY o.order_date DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const orders = await query(listQuery, listParams);

    return NextResponse.json({
      orders,
      summary,
      pagination: {
        total: filteredOrdersCount,
        limit,
        offset,
        hasMore: offset + limit < filteredOrdersCount
      }
    });

  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
