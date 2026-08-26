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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch dynamic extra operation rate from company_settings (default 6.00%)
    const settingsRes = await query(`SELECT extra_operation_rate as "extraOperationRate" FROM company_settings LIMIT 1`);
    const extraOpRate = parseFloat(settingsRes[0]?.extraOperationRate ?? 6.00);
    const extraOpFraction = extraOpRate / 100.0;

    let conditions: string[] = [];
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

    // Apply Date Filter Helper
    const dateHelper = buildDateConditions(searchParams, 'o.order_date', pIdx);
    if (dateHelper.whereClause && dateHelper.whereClause !== '1=1') {
      conditions.push(dateHelper.whereClause);
      params.push(...dateHelper.params);
      pIdx = dateHelper.nextIndex;
    }

    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '1=1';

    // Add extra operation fraction param
    const extraParamIdx = pIdx;
    const statsParams = [...params, extraOpFraction];

    // Aggregate summary stats
    const statsQuery = `
      SELECT 
        COUNT(*) as "totalOrders",
        COALESCE(SUM(o.gross_amount), 0) as "totalGrossRevenue",
        COALESCE(SUM(o.paid_amount), 0) as "totalInvoicedRevenue",
        COALESCE(SUM(o.total_commission), 0) as "totalCommission",
        COALESCE(SUM(o.total_shipping_cost), 0) as "totalShipping",
        COALESCE(SUM(o.service_fee), 0) as "totalServiceFee",
        COALESCE(SUM(o.gross_amount * $${extraParamIdx}), 0) as "totalExtraOperation",
        COALESCE(SUM(o.paid_amount - (o.total_cost + o.total_commission + o.total_shipping_cost + o.service_fee + o.withholding_tax + o.net_vat + (o.gross_amount * $${extraParamIdx}))), 0) as "totalNetProfit",
        COALESCE(AVG((o.paid_amount - (o.total_cost + o.total_commission + o.total_shipping_cost + o.service_fee + o.withholding_tax + o.net_vat + (o.gross_amount * $${extraParamIdx}))) / NULLIF(o.paid_amount, 0) * 100), 0) as "averageMarginPercent"
      FROM orders o
      WHERE ${whereClause}
    `;
    const statsRes = await query(statsQuery, statsParams);
    const summary = statsRes[0] || {};

    // Orders List params: params + extraOpFraction + limit + offset
    const listParams = [...params, extraOpFraction, limit, offset];
    const limitIdx = pIdx + 1;
    const offsetIdx = pIdx + 2;

    const listQuery = `
      SELECT 
        o.id,
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
        o.discount_amount as "discountAmount",
        o.platform_discount_amount as "platformDiscount",
        o.paid_amount as "paidAmount",
        o.total_cost as "cogs",
        o.total_commission as "commission",
        o.total_shipping_cost as "shippingCost",
        o.service_fee as "serviceFee",
        o.withholding_tax as "withholdingTax",
        o.net_vat as "netVat",
        ROUND((o.gross_amount * $${extraParamIdx})::numeric, 2) as "extraOperationCost",
        ROUND((o.paid_amount - (o.total_cost + o.total_commission + o.total_shipping_cost + o.service_fee + o.withholding_tax + o.net_vat + (o.gross_amount * $${extraParamIdx})))::numeric, 2) as "netProfit",
        ROUND(((o.paid_amount - (o.total_cost + o.total_commission + o.total_shipping_cost + o.service_fee + o.withholding_tax + o.net_vat + (o.gross_amount * $${extraParamIdx}))) / NULLIF(o.paid_amount, 0) * 100)::numeric, 1) as "marginPercent",
        o.billed_desi as "billedDesi",
        o.calculated_desi as "calculatedDesi",
        o.is_corporate_invoice as "isCorporate",
        o.company_name as "companyName",
        o.tax_id as "taxId",
        o.tax_office as "taxOffice",
        o.delivery_address as "deliveryAddress",
        o.invoice_address as "invoiceAddress",
        o.boutique_number as "boutiqueNumber",
        o.customer_order_count_label as "customerOrderCountLabel",
        s.store_name as "storeName"
      FROM orders o
      LEFT JOIN stores s ON s.id = o.store_id
      WHERE ${whereClause}
      ORDER BY o.order_date DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const orders = await query(listQuery, listParams);

    return NextResponse.json({
      orders,
      summary: {
        totalOrders: parseInt(summary.totalOrders || 0),
        totalGrossRevenue: parseFloat(summary.totalGrossRevenue || 0),
        totalInvoicedRevenue: parseFloat(summary.totalInvoicedRevenue || 0),
        totalCommission: parseFloat(summary.totalCommission || 0),
        totalShipping: parseFloat(summary.totalShipping || 0),
        totalServiceFee: parseFloat(summary.totalServiceFee || 0),
        totalExtraOperation: parseFloat(summary.totalExtraOperation || 0),
        totalNetProfit: parseFloat(summary.totalNetProfit || 0),
        averageMarginPercent: parseFloat(summary.averageMarginPercent || 0),
        extraOperationRate: extraOpRate
      }
    });
  } catch (error: any) {
    console.error('Orders API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
