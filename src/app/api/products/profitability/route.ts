import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { buildDateConditions } from '@/lib/dateFilterHelper';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const brand = searchParams.get('brand') || 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(250, Math.max(10, parseInt(searchParams.get('pageSize') || '50')));
    const offset = (page - 1) * pageSize;

    let conditions: string[] = ['1=1'];
    let params: any[] = [];
    let pIdx = 1;

    if (search) {
      conditions.push(`(oi.title ILIKE $${pIdx} OR oi.barcode ILIKE $${pIdx} OR oi.brand ILIKE $${pIdx})`);
      params.push(`%${search}%`);
      pIdx++;
    }

    if (brand && brand !== 'all') {
      conditions.push(`oi.brand ILIKE $${pIdx}`);
      params.push(`%${brand}%`);
      pIdx++;
    }

    // Date Conditions from orders table
    const dateHelper = buildDateConditions(searchParams, 'o.order_date', pIdx);
    if (dateHelper.whereClause && dateHelper.whereClause !== '1=1') {
      conditions.push(dateHelper.whereClause);
      params.push(...dateHelper.params);
      pIdx = dateHelper.nextIndex;
    }

    const whereClause = conditions.join(' AND ');

    // Overall Profitability Summary
    const summaryRes = await query(`
      SELECT 
        COUNT(DISTINCT oi.barcode) as "totalUniqueProducts",
        COALESCE(SUM(oi.quantity), 0) as "totalUnitsSold",
        COALESCE(SUM(oi.invoiced_amount), 0) as "totalRevenue",
        COALESCE(SUM(oi.unit_cost_price * oi.quantity), 0) as "totalCogs",
        COALESCE(SUM(oi.commission_amount), 0) as "totalCommission",
        COALESCE(SUM(oi.shipping_amount), 0) as "totalShipping",
        COALESCE(SUM(oi.net_profit), 0) as "totalNetProfit"
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE ${whereClause}
    `, params);

    const summary = summaryRes[0] || {};
    const totalRev = parseFloat(summary.totalRevenue) || 1;
    const totalProfit = parseFloat(summary.totalNetProfit) || 0;
    summary.overallMarginPercent = Math.round((totalProfit / totalRev) * 1000) / 10;

    // Total Count for Pagination
    const countRes = await query(`
      SELECT COUNT(DISTINCT oi.barcode) as total 
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE ${whereClause}
    `, params);
    const totalCount = parseInt(countRes[0]?.total || '0');
    const totalPages = Math.ceil(totalCount / pageSize);

    // Products Profitability List
    const items = await query(`
      SELECT 
        oi.barcode,
        oi.title,
        COALESCE(oi.brand, 'Genject') as "brand",
        p.image_url as "imageUrl",
        p.marketplace_product_url as "marketplaceUrl",
        p.current_sale_price as "currentSalePrice",
        p.current_cost as "unitCost",
        SUM(oi.quantity) as "unitsSold",
        SUM(oi.invoiced_amount) as "totalRevenue",
        SUM(oi.unit_cost_price * oi.quantity) as "totalCogs",
        SUM(oi.commission_amount) as "totalCommission",
        SUM(oi.shipping_amount) as "totalShipping",
        SUM(oi.service_fee_share) as "totalServiceFee",
        SUM(oi.net_profit) as "totalNetProfit",
        ROUND((SUM(oi.net_profit) / NULLIF(SUM(oi.invoiced_amount), 0)) * 100, 1) as "marginPercent"
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN products p ON p.barcode = oi.barcode
      WHERE ${whereClause}
      GROUP BY oi.barcode, oi.title, oi.brand, p.image_url, p.marketplace_product_url, p.current_sale_price, p.current_cost
      ORDER BY SUM(oi.net_profit) DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `, params);

    return NextResponse.json({
      summary,
      items,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages
      }
    });
  } catch (error: any) {
    console.error('Product Profitability API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
