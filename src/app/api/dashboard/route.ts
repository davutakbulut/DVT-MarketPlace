import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { buildDateConditions } from '@/lib/dateFilterHelper';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    // Fetch dynamic extra operation rate from company_settings (default 6.00%)
    const settingsRes = await query(`SELECT extra_operation_rate as "extraOperationRate" FROM company_settings LIMIT 1`);
    const extraOpRate = parseFloat(settingsRes[0]?.extraOperationRate ?? 6.00);
    const extraOpFraction = extraOpRate / 100.0;

    let conditions: string[] = [];
    let params: any[] = [];
    let pIdx = 1;

    if (storeId && storeId !== 'all') {
      conditions.push(`o.store_id::text = $${pIdx}`);
      params.push(storeId);
      pIdx++;
    }

    // Apply Date Conditions
    const dateHelper = buildDateConditions(searchParams, 'o.order_date', pIdx);
    if (dateHelper.whereClause && dateHelper.whereClause !== '1=1') {
      conditions.push(dateHelper.whereClause);
      params.push(...dateHelper.params);
      pIdx = dateHelper.nextIndex;
    }

    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';

    // Add extraOpFraction as parameter for dynamic calculation
    const extraParamIdx = pIdx;
    params.push(extraOpFraction);
    pIdx++;

    // Overall Totals for Selected Period with 14 Masraf Kalemleri
    const orderAgg = await query(`
      SELECT 
        COUNT(o.id) as total_orders,
        COUNT(CASE WHEN o.status NOT IN ('Cancelled', 'Returned', 'İptal Edildi', 'İade Edildi') THEN 1 END) as active_orders,
        COUNT(CASE WHEN o.status IN ('Cancelled', 'İptal Edildi') THEN 1 END) as cancelled_orders,
        COUNT(CASE WHEN o.status IN ('Returned', 'İade Edildi') THEN 1 END) as returned_orders,

        COALESCE(SUM(o.gross_amount), 0) as gross_revenue,
        COALESCE(SUM(o.paid_amount), 0) as invoiced_revenue,
        COALESCE(SUM(o.discount_amount + o.platform_discount_amount), 0) as total_discount,
        COALESCE(SUM(CASE WHEN o.status IN ('Cancelled', 'İptal Edildi') THEN o.gross_amount ELSE 0 END), 0) as cancelled_amount,
        COALESCE(SUM(CASE WHEN o.status IN ('Returned', 'İade Edildi') THEN o.gross_amount ELSE 0 END), 0) as returned_amount,

        COALESCE(SUM(o.total_cost), 0) as cogs,
        COALESCE(SUM(o.total_commission), 0) as commission,
        COALESCE(SUM(o.total_shipping_cost), 0) as shipping,
        COALESCE(SUM(CASE WHEN o.status IN ('Returned', 'İade Edildi') THEN o.total_shipping_cost ELSE 0 END), 0) as return_shipping_loss,
        COALESCE(SUM(o.service_fee), 0) as service_fee,
        COALESCE(SUM(o.intl_service_fee), 0) as intl_service_fee,
        COALESCE(SUM(o.intl_operation_fee), 0) as intl_operation_fee,
        COALESCE(SUM(o.withholding_tax), 0) as withholding_tax,
        COALESCE(SUM(o.net_vat), 0) as net_vat,
        COALESCE(SUM(o.ad_spend_cost), 0) as ad_spend_cost,
        COALESCE(SUM(o.penalty_cost), 0) as penalty_cost,
        COALESCE(SUM(o.early_payout_cost), 0) as early_payout_cost,
        COALESCE(SUM(o.gross_amount * $${extraParamIdx}), 0) as fixed_extra_operation_cost,
        
        COALESCE(SUM(o.paid_amount - (o.total_cost + o.total_commission + o.total_shipping_cost + o.service_fee + o.withholding_tax + o.net_vat + (o.gross_amount * $${extraParamIdx}))), 0) as net_profit
      FROM orders o
      WHERE ${whereClause}
    `, params);

    const agg = orderAgg[0] || {};
    const gross = parseFloat(agg.gross_revenue) || 0;
    const paid = parseFloat(agg.invoiced_revenue) || gross;
    const netProfit = parseFloat(agg.net_profit) || 0;
    const cogs = parseFloat(agg.cogs) || 0;
    const netProfitMargin = paid > 0 ? (netProfit / paid) * 100 : 0;
    const netProfitMarkup = cogs > 0 ? (netProfit / cogs) * 100 : 0;

    // Expenses breakdown object
    const cogsVal = parseFloat(agg.cogs) || 0;
    const commVal = parseFloat(agg.commission) || 0;
    const shipVal = parseFloat(agg.shipping) || 0;
    const retShipVal = parseFloat(agg.return_shipping_loss) || 0;
    const sFeeVal = parseFloat(agg.service_fee) || 0;
    const intlSFeeVal = parseFloat(agg.intl_service_fee) || 0;
    const intlOpVal = parseFloat(agg.intl_operation_fee) || 0;
    const wTaxVal = parseFloat(agg.withholding_tax) || 0;
    const nVatVal = parseFloat(agg.net_vat) || 0;
    const adSpendVal = parseFloat(agg.ad_spend_cost) || 0;
    const penaltyVal = parseFloat(agg.penalty_cost) || 0;
    const earlyPayoutVal = parseFloat(agg.early_payout_cost) || 0;
    const otherInvoicesVal = 0.00;
    const fixedExtraOpVal = parseFloat(agg.fixed_extra_operation_cost) || 0;

    const totalCostSum = cogsVal + commVal + shipVal + retShipVal + sFeeVal + intlSFeeVal + intlOpVal + wTaxVal + nVatVal + adSpendVal + penaltyVal + earlyPayoutVal + otherInvoicesVal + fixedExtraOpVal;

    // Daily Profit Performance Trends
    const dailyProfitTrends = await query(`
      SELECT 
        TO_CHAR(o.order_date, 'DD.MM') as "dayLabel",
        TO_CHAR(o.order_date, 'YYYY-MM-DD') as "fullDate",
        COUNT(o.id) as "orderCount",
        COALESCE(SUM(o.gross_amount), 0) as "revenue",
        COALESCE(SUM(o.paid_amount - (o.total_cost + o.total_commission + o.total_shipping_cost + o.service_fee + o.withholding_tax + o.net_vat + (o.gross_amount * $${extraParamIdx}))), 0) as "profit"
      FROM orders o
      WHERE ${whereClause}
      GROUP BY TO_CHAR(o.order_date, 'DD.MM'), TO_CHAR(o.order_date, 'YYYY-MM-DD')
      ORDER BY TO_CHAR(o.order_date, 'YYYY-MM-DD') ASC
    `, params);

    // Monthly breakdown (All Months)
    const monthlyTrends = await query(`
      SELECT 
        TO_CHAR(o.order_date, 'YYYY-MM') as "monthKey",
        TO_CHAR(o.order_date, 'TMMonth YYYY') as "monthLabel",
        COUNT(o.id) as "orderCount",
        COALESCE(SUM(o.gross_amount), 0) as "revenue",
        COALESCE(SUM(o.paid_amount - (o.total_cost + o.total_commission + o.total_shipping_cost + o.service_fee + o.withholding_tax + o.net_vat + (o.gross_amount * $1))), 0) as "profit",
        ROUND((COALESCE(SUM(o.paid_amount - (o.total_cost + o.total_commission + o.total_shipping_cost + o.service_fee + o.withholding_tax + o.net_vat + (o.gross_amount * $1))), 0) / NULLIF(SUM(o.paid_amount), 0) * 100)::numeric, 1) as "margin"
      FROM orders o
      GROUP BY TO_CHAR(o.order_date, 'YYYY-MM'), TO_CHAR(o.order_date, 'TMMonth YYYY')
      ORDER BY TO_CHAR(o.order_date, 'YYYY-MM') ASC
    `, [extraOpFraction]);

    // Carrier distribution for Selected Period
    const carrierDistribution = await query(`
      SELECT 
        COALESCE(o.carrier_name, 'Trendyol Express') as "carrier",
        COUNT(o.id) as "orderCount",
        SUM(o.total_shipping_cost) as "totalShippingCost",
        ROUND(AVG(o.billed_desi), 1) as "avgDesi",
        SUM(o.paid_amount - (o.total_cost + o.total_commission + o.total_shipping_cost + o.service_fee + o.withholding_tax + o.net_vat + (o.gross_amount * $${extraParamIdx}))) as "profit"
      FROM orders o
      WHERE ${whereClause}
      GROUP BY o.carrier_name
      ORDER BY COUNT(o.id) DESC
    `, params);

    // Hourly Order Distribution (Heatmap 0-23 hours)
    const hourlyDistribution = await query(`
      SELECT 
        EXTRACT(HOUR FROM o.order_date)::int as "hour",
        COUNT(o.id) as "orderCount",
        SUM(o.paid_amount) as "revenue",
        SUM(o.paid_amount - (o.total_cost + o.total_commission + o.total_shipping_cost + o.service_fee + o.withholding_tax + o.net_vat + (o.gross_amount * $${extraParamIdx}))) as "profit"
      FROM orders o
      WHERE ${whereClause}
      GROUP BY EXTRACT(HOUR FROM o.order_date)
      ORDER BY EXTRACT(HOUR FROM o.order_date) ASC
    `, params);

    // Top profitable products for Selected Period
    const topProducts = await query(`
      SELECT 
        oi.barcode,
        oi.title,
        oi.brand,
        SUM(oi.quantity) as "totalQuantity",
        SUM(oi.invoiced_amount) as "totalRevenue",
        SUM(oi.invoiced_amount - (oi.unit_cost_price * oi.quantity + (oi.invoiced_amount * 0.16) + (oi.invoiced_amount * $${extraParamIdx}))) as "totalProfit",
        ROUND((SUM(oi.invoiced_amount - (oi.unit_cost_price * oi.quantity + (oi.invoiced_amount * 0.16) + (oi.invoiced_amount * $${extraParamIdx}))) / NULLIF(SUM(oi.invoiced_amount), 0) * 100)::numeric, 1) as "avgMargin"
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE ${whereClause}
      GROUP BY oi.barcode, oi.title, oi.brand
      ORDER BY SUM(oi.invoiced_amount) DESC
      LIMIT 5
    `, params);

    // Recent orders for Selected Period
    const recentOrders = await query(`
      SELECT 
        o.id,
        o.marketplace_order_number as "orderNumber",
        TO_CHAR(o.order_date, 'YYYY-MM-DD HH24:MI') as "orderDate",
        o.customer_name as "customerName",
        o.customer_city as "city",
        o.carrier_name as "carrierName",
        o.paid_amount as "paidAmount",
        ROUND((o.paid_amount - (o.total_cost + o.total_commission + o.total_shipping_cost + o.service_fee + o.withholding_tax + o.net_vat + (o.gross_amount * $${extraParamIdx})))::numeric, 2) as "netProfit",
        ROUND(((o.paid_amount - (o.total_cost + o.total_commission + o.total_shipping_cost + o.service_fee + o.withholding_tax + o.net_vat + (o.gross_amount * $${extraParamIdx}))) / NULLIF(o.paid_amount, 0) * 100)::numeric, 1) as "marginPercent",
        o.status
      FROM orders o
      WHERE ${whereClause}
      ORDER BY o.order_date DESC
      LIMIT 8
    `, params);

    // Stores list
    const stores = await query(`SELECT id, store_name as "storeName", marketplace FROM stores ORDER BY created_at ASC`);

    return NextResponse.json({
      // KPI stats
      grossRevenue: gross,
      invoicedRevenue: paid,
      grossProfit: gross - cogs,
      netProfit,
      extraOperationTotal: fixedExtraOpVal,
      extraOperationRate: extraOpRate,
      netProfitMargin: Math.round(netProfitMargin * 100) / 100,
      netProfitMarkup: Math.round(netProfitMarkup * 100) / 100,
      shippingTotal: shipVal,
      commissionTotal: commVal,
      taxesTotal: wTaxVal + nVatVal,
      serviceFeeTotal: sFeeVal,
      totalOrders: parseInt(agg.total_orders || 0),
      activeOrders: parseInt(agg.active_orders || 0),
      cancelledOrders: parseInt(agg.cancelled_orders || 0),
      returnedOrders: parseInt(agg.returned_orders || 0),
      cancelledAmount: parseFloat(agg.cancelled_amount || 0),
      returnedAmount: parseFloat(agg.returned_amount || 0),
      discountAmount: parseFloat(agg.total_discount || 0),

      // 14 Masraf Kalemleri Detailed Breakdown
      expenses: {
        cogs: cogsVal,
        commission: commVal,
        shipping: shipVal,
        returnShippingLoss: retShipVal,
        serviceFee: sFeeVal,
        intlServiceFee: intlSFeeVal,
        intlOperationFee: intlOpVal,
        withholdingTax: wTaxVal,
        netVat: nVatVal,
        adSpendCost: adSpendVal,
        penaltyCost: penaltyVal,
        earlyPayoutCost: earlyPayoutVal,
        otherInvoices: otherInvoicesVal,
        fixedExtraOperation: fixedExtraOpVal,
        totalCostSum: Math.round(totalCostSum * 100) / 100,
        extraOperationRate: extraOpRate
      },

      dailyProfitTrends,
      monthlyTrends,
      carrierDistribution,
      hourlyDistribution,
      topProducts,
      recentOrders,
      stores
    });
  } catch (error: any) {
    console.error('Dashboard DB fetch error:', error);
    return NextResponse.json({ error: 'Veritabanından çekilemedi: ' + error.message }, { status: 500 });
  }
}
