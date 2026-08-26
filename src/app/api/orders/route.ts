import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const carrier = searchParams.get('carrier') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let conditions = ['1=1'];
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

    const whereClause = conditions.join(' AND ');

    // Aggregate summary stats
    const statsQuery = `
      SELECT 
        COUNT(*) as "totalOrders",
        COALESCE(SUM(o.gross_amount), 0) as "totalGrossRevenue",
        COALESCE(SUM(o.paid_amount), 0) as "totalInvoicedRevenue",
        COALESCE(SUM(o.total_commission), 0) as "totalCommission",
        COALESCE(SUM(o.total_shipping_cost), 0) as "totalShipping",
        COALESCE(SUM(o.service_fee), 0) as "totalServiceFee",
        COALESCE(SUM(o.net_profit), 0) as "totalNetProfit",
        COALESCE(AVG(o.profit_margin_percent), 0) as "averageMarginPercent"
      FROM orders o
      WHERE ${whereClause}
    `;
    const statsRes = await query(statsQuery, params);
    const summary = statsRes[0] || {};

    // Orders List
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
        o.net_profit as "netProfit",
        o.profit_margin_percent as "marginPercent",
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
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;

    params.push(limit, offset);
    const orders = await query(listQuery, params);

    return NextResponse.json({
      summary,
      orders,
      pagination: {
        total: parseInt(summary.totalOrders || '0'),
        limit,
        offset
      }
    });
  } catch (error: any) {
    console.error('Orders API error:', error);
    return NextResponse.json({ error: 'Siparişler alınamadı: ' + error.message }, { status: 500 });
  }
}
