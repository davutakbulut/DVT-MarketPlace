import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { buildDateConditions } from '@/lib/dateFilterHelper';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const brand = searchParams.get('brand') || 'all';
    const storeId = searchParams.get('storeId') || 'all';
    const marketplace = searchParams.get('marketplace') || 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(250, Math.max(10, parseInt(searchParams.get('pageSize') || '50')));
    const offset = (page - 1) * pageSize;

    // Fetch dynamic company settings (extra operation rate default 6%)
    const settingsRes = await query(`SELECT extra_operation_rate as "extraOperationRate" FROM company_settings LIMIT 1`);
    const extraOpRate = parseFloat(settingsRes[0]?.extraOperationRate ?? 6.00);
    const extraOpFraction = extraOpRate / 100.0;

    let conditions: string[] = ['1=1'];
    let params: any[] = [];
    let pIdx = 1;

    if (search) {
      conditions.push(`(oi.title ILIKE $${pIdx} OR oi.barcode ILIKE $${pIdx} OR oi.brand ILIKE $${pIdx} OR p.title ILIKE $${pIdx} OR p.barcode ILIKE $${pIdx})`);
      params.push(`%${search}%`);
      pIdx++;
    }

    if (brand && brand !== 'all') {
      conditions.push(`(COALESCE(p.brand, oi.brand, 'Genel') ILIKE $${pIdx})`);
      params.push(`%${brand}%`);
      pIdx++;
    }

    if (storeId && storeId !== 'all') {
      conditions.push(`(o.store_id::text = $${pIdx} OR p.store_id::text = $${pIdx})`);
      params.push(storeId);
      pIdx++;
    }

    if (marketplace && marketplace !== 'all') {
      conditions.push(`COALESCE(o.marketplace, p.marketplace) = $${pIdx}`);
      params.push(marketplace);
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

    // Extra operation fraction parameter
    const extraParamIdx = pIdx;
    const allParams = [...params, extraOpFraction];

    // Overall Profitability Summary (Dynamic Math)
    const summaryRes = await query(`
      SELECT 
        COUNT(DISTINCT oi.barcode) as "totalUniqueProducts",
        COALESCE(SUM(oi.quantity), 0) as "totalUnitsSold",
        COALESCE(SUM(COALESCE(oi.invoiced_amount, oi.unit_sale_price * oi.quantity, 0)), 0) as "totalRevenue",
        COALESCE(SUM(COALESCE(oi.unit_cost_price, 0) * oi.quantity), 0) as "totalCogs",
        COALESCE(SUM(oi.commission_amount), 0) as "totalCommission",
        COALESCE(SUM(COALESCE(oi.shipping_amount, 0)), 0) as "totalShipping",
        COALESCE(SUM(COALESCE(oi.service_fee_share, 0)), 0) as "totalServiceFee",
        COALESCE(SUM(COALESCE(oi.invoiced_amount, oi.unit_sale_price * oi.quantity, 0) * $${extraParamIdx}), 0) as "totalExtraOp",
        COALESCE(SUM(
          COALESCE(oi.invoiced_amount, oi.unit_sale_price * oi.quantity, 0) - (
            (COALESCE(oi.unit_cost_price, 0) * oi.quantity) + 
            COALESCE(oi.commission_amount, 0) + 
            COALESCE(oi.shipping_amount, 0) + 
            COALESCE(oi.service_fee_share, 0) + 
            (COALESCE(oi.invoiced_amount, oi.unit_sale_price * oi.quantity, 0) * $${extraParamIdx})
          )
        ), 0) as "totalNetProfit"
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN products p ON p.barcode = oi.barcode
      WHERE ${whereClause}
    `, allParams);

    const summary = summaryRes[0] || {};
    const totalRev = parseFloat(summary.totalRevenue) || 1;
    const totalProfit = parseFloat(summary.totalNetProfit) || 0;
    summary.overallMarginPercent = Math.round((totalProfit / totalRev) * 1000) / 10;

    // Total Count for Pagination
    const countRes = await query(`
      SELECT COUNT(DISTINCT oi.barcode) as total 
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN products p ON p.barcode = oi.barcode
      WHERE ${whereClause}
    `, params);
    const totalCount = parseInt(countRes[0]?.total || '0');
    const totalPages = Math.ceil(totalCount / pageSize);

    // Products Profitability List with Pagination
    const listParams = [...params, extraOpFraction, pageSize, offset];
    const limitIdx = pIdx + 1;
    const offsetIdx = pIdx + 2;

    const items = await query(`
      SELECT 
        oi.barcode,
        COALESCE(MAX(p.title), MAX(oi.title)) as "title",
        COALESCE(MAX(p.brand), MAX(oi.brand), 'Genel') as "brand",
        COALESCE(MAX(p.marketplace), MAX(o.marketplace), 'trendyol') as "marketplace",
        MAX(p.image_url) as "imageUrl",
        MAX(p.marketplace_product_url) as "marketplaceUrl",
        COALESCE(MAX(p.current_sale_price), AVG(oi.unit_sale_price)) as "currentSalePrice",
        COALESCE(MAX(p.current_cost), AVG(COALESCE(oi.unit_cost_price, 0))) as "unitCost",
        SUM(oi.quantity) as "unitsSold",
        SUM(COALESCE(oi.invoiced_amount, oi.unit_sale_price * oi.quantity, 0)) as "totalRevenue",
        SUM(COALESCE(oi.unit_cost_price, 0) * oi.quantity) as "totalCogs",
        SUM(COALESCE(oi.commission_amount, 0)) as "totalCommission",
        SUM(COALESCE(oi.shipping_amount, 0)) as "totalShipping",
        SUM(COALESCE(oi.service_fee_share, 0)) as "totalServiceFee",
        ROUND((SUM(COALESCE(oi.invoiced_amount, oi.unit_sale_price * oi.quantity, 0) * $${extraParamIdx}))::numeric, 2) as "extraOperationCost",
        ROUND((SUM(
          COALESCE(oi.invoiced_amount, oi.unit_sale_price * oi.quantity, 0) - (
            (COALESCE(oi.unit_cost_price, 0) * oi.quantity) + 
            COALESCE(oi.commission_amount, 0) + 
            COALESCE(oi.shipping_amount, 0) + 
            COALESCE(oi.service_fee_share, 0) + 
            (COALESCE(oi.invoiced_amount, oi.unit_sale_price * oi.quantity, 0) * $${extraParamIdx})
          )
        ))::numeric, 2) as "totalNetProfit",
        ROUND((
          SUM(
            COALESCE(oi.invoiced_amount, oi.unit_sale_price * oi.quantity, 0) - (
              (COALESCE(oi.unit_cost_price, 0) * oi.quantity) + 
              COALESCE(oi.commission_amount, 0) + 
              COALESCE(oi.shipping_amount, 0) + 
              COALESCE(oi.service_fee_share, 0) + 
              (COALESCE(oi.invoiced_amount, oi.unit_sale_price * oi.quantity, 0) * $${extraParamIdx})
            )
          ) / NULLIF(SUM(COALESCE(oi.invoiced_amount, oi.unit_sale_price * oi.quantity, 0)), 0) * 100
        )::numeric, 1) as "marginPercent"
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN products p ON p.barcode = oi.barcode
      WHERE ${whereClause}
      GROUP BY oi.barcode
      ORDER BY SUM(
        COALESCE(oi.invoiced_amount, oi.unit_sale_price * oi.quantity, 0) - (
          (COALESCE(oi.unit_cost_price, 0) * oi.quantity) + 
          COALESCE(oi.commission_amount, 0) + 
          COALESCE(oi.shipping_amount, 0) + 
          COALESCE(oi.service_fee_share, 0) + 
          (COALESCE(oi.invoiced_amount, oi.unit_sale_price * oi.quantity, 0) * $${extraParamIdx})
        )
      ) DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `, listParams);

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
