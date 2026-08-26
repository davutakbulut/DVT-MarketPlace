import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { buildDateConditions } from '@/lib/dateFilterHelper';
import { getOrderNetProfitSQL, getOrderItemNetProfitSQL } from '@/lib/financialEngine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'order';
    const storeId = searchParams.get('storeId') || 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(250, Math.max(10, parseInt(searchParams.get('pageSize') || '50')));
    const offset = (page - 1) * pageSize;
    const search = searchParams.get('search') || '';

    // Fetch dynamic company settings
    const settingsRes = await query(`SELECT extra_operation_rate as "extraOperationRate" FROM company_settings LIMIT 1`);
    const extraOpRate = parseFloat(settingsRes[0]?.extraOperationRate ?? 6.00);
    const extraOpFraction = extraOpRate / 100.0;

    if (type === 'order') {
      let conditions: string[] = ['1=1'];
      let params: any[] = [];
      let pIdx = 1;

      if (search) {
        conditions.push(`(o.marketplace_order_number ILIKE $${pIdx} OR o.package_number ILIKE $${pIdx} OR o.customer_name ILIKE $${pIdx} OR o.customer_city ILIKE $${pIdx})`);
        params.push(`%${search}%`);
        pIdx++;
      }

      if (storeId && storeId !== 'all') {
        conditions.push(`o.store_id::text = $${pIdx}`);
        params.push(storeId);
        pIdx++;
      }

      // Date Filter
      const dateHelper = buildDateConditions(searchParams, 'o.order_date', pIdx);
      if (dateHelper.whereClause && dateHelper.whereClause !== '1=1') {
        conditions.push(dateHelper.whereClause);
        params.push(...dateHelper.params);
        pIdx = dateHelper.nextIndex;
      }

      const whereClause = conditions.join(' AND ');

      // Total count
      const countRes = await query(`SELECT COUNT(o.id) as total FROM orders o WHERE ${whereClause}`, params);
      const totalCount = parseInt(countRes[0]?.total || '0');
      const totalPages = Math.ceil(totalCount / pageSize);

      const extraParamIdx = pIdx;
      const limitIdx = pIdx + 1;
      const offsetIdx = pIdx + 2;
      const allParams = [...params, extraOpFraction, pageSize, offset];

      const orders = await query(`
        SELECT 
          o.id,
          o.marketplace_order_number as "orderNumber",
          o.package_number as "packageNumber",
          TO_CHAR(o.order_date, 'YYYY-MM-DD HH24:MI') as "orderDate",
          o.customer_name as "customerName",
          o.customer_city as "city",
          o.carrier_name as "carrierName",
          o.paid_amount as "paidAmount",
          o.total_cost as "cogs",
          o.total_commission as "commission",
          o.total_shipping_cost as "shippingCost",
          o.service_fee as "serviceFee",
          o.withholding_tax as "withholdingTax",
          o.net_vat as "netVat",
          ROUND(${getOrderNetProfitSQL(extraParamIdx)}::numeric, 2) as "netProfit",
          ROUND(((${getOrderNetProfitSQL(extraParamIdx)} / NULLIF(o.paid_amount, 0)) * 100)::numeric, 1) as "marginPercent",
          o.status
        FROM orders o
        WHERE ${whereClause}
        ORDER BY o.order_date DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `, allParams);

      return NextResponse.json({ 
        type, 
        pagination: { page, pageSize, totalCount, totalPages },
        data: orders 
      });
    }

    if (type === 'product') {
      let conditions: string[] = ['1=1'];
      let params: any[] = [];
      let pIdx = 1;

      if (search) {
        conditions.push(`(oi.title ILIKE $${pIdx} OR oi.barcode ILIKE $${pIdx} OR oi.brand ILIKE $${pIdx})`);
        params.push(`%${search}%`);
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

      const countRes = await query(`
        SELECT COUNT(DISTINCT oi.barcode) as total 
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE ${whereClause}
      `, params);
      const totalCount = parseInt(countRes[0]?.total || '0');
      const totalPages = Math.ceil(totalCount / pageSize);

      const extraParamIdx = pIdx;
      const limitIdx = pIdx + 1;
      const offsetIdx = pIdx + 2;
      const allParams = [...params, extraOpFraction, pageSize, offset];

      const products = await query(`
        SELECT 
          oi.barcode,
          oi.title,
          COALESCE(oi.brand, 'Genel') as "brand",
          SUM(oi.quantity) as "totalQuantity",
          SUM(oi.unit_sale_price * oi.quantity) as "totalRevenue",
          SUM(COALESCE(oi.unit_cost_price, 0) * oi.quantity) as "totalCogs",
          SUM(COALESCE(oi.commission_amount, 0)) as "totalCommission",
          SUM(COALESCE(oi.shipping_amount, 0)) as "totalShipping",
          ROUND(SUM(${getOrderItemNetProfitSQL(extraParamIdx)})::numeric, 2) as "totalProfit",
          ROUND((SUM(${getOrderItemNetProfitSQL(extraParamIdx)}) / NULLIF(SUM(oi.unit_sale_price * oi.quantity), 0) * 100)::numeric, 1) as "avgMarginPercent"
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE ${whereClause}
        GROUP BY oi.barcode, oi.title, oi.brand
        ORDER BY SUM(${getOrderItemNetProfitSQL(extraParamIdx)}) DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `, allParams);

      return NextResponse.json({ 
        type, 
        pagination: { page, pageSize, totalCount, totalPages },
        data: products 
      });
    }

    if (type === 'category' || type === 'brand') {
      let conditions: string[] = ['1=1'];
      let params: any[] = [];
      let pIdx = 1;

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

      const countRes = await query(`
        SELECT COUNT(DISTINCT COALESCE(oi.brand, 'Genel')) as total 
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE ${whereClause}
      `, params);
      const totalCount = parseInt(countRes[0]?.total || '0');
      const totalPages = Math.ceil(totalCount / pageSize);

      const extraParamIdx = pIdx;
      const limitIdx = pIdx + 1;
      const offsetIdx = pIdx + 2;
      const allParams = [...params, extraOpFraction, pageSize, offset];

      const brands = await query(`
        SELECT 
          COALESCE(oi.brand, 'Genel') as "brand",
          COUNT(DISTINCT oi.order_id) as "orderCount",
          SUM(oi.quantity) as "totalQuantity",
          SUM(oi.unit_sale_price * oi.quantity) as "totalRevenue",
          ROUND(SUM(${getOrderItemNetProfitSQL(extraParamIdx)})::numeric, 2) as "totalProfit",
          ROUND((SUM(${getOrderItemNetProfitSQL(extraParamIdx)}) / NULLIF(SUM(oi.unit_sale_price * oi.quantity), 0) * 100)::numeric, 1) as "marginPercent"
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE ${whereClause}
        GROUP BY oi.brand
        ORDER BY SUM(${getOrderItemNetProfitSQL(extraParamIdx)}) DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `, allParams);

      return NextResponse.json({ 
        type, 
        pagination: { page, pageSize, totalCount, totalPages },
        data: brands 
      });
    }

    if (type === 'returns') {
      let conditions = ["(o.status ILIKE '%İade%' OR o.status ILIKE '%İptal%' OR o.status ILIKE '%return%' OR o.status ILIKE '%cancel%')"];
      let params: any[] = [];
      let pIdx = 1;

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

      const countRes = await query(`SELECT COUNT(o.id) as total FROM orders o WHERE ${whereClause}`, params);
      const totalCount = parseInt(countRes[0]?.total || '0');
      const totalPages = Math.ceil(totalCount / pageSize);

      const limitIdx = pIdx;
      const offsetIdx = pIdx + 1;
      const allParams = [...params, pageSize, offset];

      const returns = await query(`
        SELECT 
          o.id,
          o.marketplace_order_number as "orderNumber",
          TO_CHAR(o.order_date, 'YYYY-MM-DD HH24:MI') as "orderDate",
          o.customer_name as "customerName",
          o.carrier_name as "carrierName",
          o.paid_amount as "paidAmount",
          o.total_shipping_cost as "shippingLoss",
          o.service_fee as "serviceFeeLoss",
          (o.total_shipping_cost + o.service_fee) as "totalReturnLoss",
          o.status
        FROM orders o
        WHERE ${whereClause}
        ORDER BY o.order_date DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `, allParams);

      return NextResponse.json({ 
        type, 
        pagination: { page, pageSize, totalCount, totalPages },
        data: returns 
      });
    }

    return NextResponse.json({ type, data: [] });
  } catch (error: any) {
    console.error('Reports API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
