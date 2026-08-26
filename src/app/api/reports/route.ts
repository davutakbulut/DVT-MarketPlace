import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'order';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(250, Math.max(10, parseInt(searchParams.get('pageSize') || '50')));
    const offset = (page - 1) * pageSize;
    const search = searchParams.get('search') || '';

    if (type === 'order') {
      let whereClause = '1=1';
      let params: any[] = [];
      if (search) {
        whereClause = `(o.marketplace_order_number ILIKE $1 OR o.package_number ILIKE $1 OR o.customer_name ILIKE $1 OR o.customer_city ILIKE $1)`;
        params.push(`%${search}%`);
      }

      // Total count
      const countRes = await query(`SELECT COUNT(o.id) as total FROM orders o WHERE ${whereClause}`, params);
      const totalCount = parseInt(countRes[0]?.total || '0');
      const totalPages = Math.ceil(totalCount / pageSize);

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
          o.net_profit as "netProfit",
          o.profit_margin_percent as "marginPercent",
          o.status
        FROM orders o
        WHERE ${whereClause}
        ORDER BY o.order_date DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `, params);

      return NextResponse.json({ 
        type, 
        pagination: { page, pageSize, totalCount, totalPages },
        data: orders 
      });
    }

    if (type === 'product') {
      let whereClause = '1=1';
      let params: any[] = [];
      if (search) {
        whereClause = `(oi.title ILIKE $1 OR oi.barcode ILIKE $1 OR oi.brand ILIKE $1)`;
        params.push(`%${search}%`);
      }

      const countRes = await query(`
        SELECT COUNT(DISTINCT oi.barcode) as total FROM order_items oi WHERE ${whereClause}
      `, params);
      const totalCount = parseInt(countRes[0]?.total || '0');
      const totalPages = Math.ceil(totalCount / pageSize);

      const products = await query(`
        SELECT 
          oi.barcode,
          oi.title,
          oi.brand,
          SUM(oi.quantity) as "totalQuantity",
          SUM(oi.invoiced_amount) as "totalRevenue",
          SUM(oi.unit_cost_price * oi.quantity) as "totalCogs",
          SUM(oi.commission_amount) as "totalCommission",
          SUM(oi.shipping_amount) as "totalShipping",
          SUM(oi.net_profit) as "totalProfit",
          ROUND((SUM(oi.net_profit) / NULLIF(SUM(oi.invoiced_amount), 0)) * 100, 1) as "avgMarginPercent"
        FROM order_items oi
        WHERE ${whereClause}
        GROUP BY oi.barcode, oi.title, oi.brand
        ORDER BY SUM(oi.net_profit) DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `, params);

      return NextResponse.json({ 
        type, 
        pagination: { page, pageSize, totalCount, totalPages },
        data: products 
      });
    }

    if (type === 'category' || type === 'brand') {
      const countRes = await query(`SELECT COUNT(DISTINCT COALESCE(oi.brand, 'Genel')) as total FROM order_items oi`);
      const totalCount = parseInt(countRes[0]?.total || '0');
      const totalPages = Math.ceil(totalCount / pageSize);

      const brands = await query(`
        SELECT 
          COALESCE(oi.brand, 'Genel') as "brand",
          COUNT(DISTINCT oi.order_id) as "orderCount",
          SUM(oi.quantity) as "totalQuantity",
          SUM(oi.invoiced_amount) as "totalRevenue",
          SUM(oi.net_profit) as "totalProfit",
          ROUND((SUM(oi.net_profit) / NULLIF(SUM(oi.invoiced_amount), 0)) * 100, 1) as "marginPercent"
        FROM order_items oi
        GROUP BY oi.brand
        ORDER BY SUM(oi.net_profit) DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `);

      return NextResponse.json({ 
        type, 
        pagination: { page, pageSize, totalCount, totalPages },
        data: brands 
      });
    }

    if (type === 'returns') {
      const countRes = await query(`
        SELECT COUNT(o.id) as total 
        FROM orders o 
        WHERE o.status ILIKE '%İade%' OR o.status ILIKE '%İptal%' OR o.net_profit < 0
      `);
      const totalCount = parseInt(countRes[0]?.total || '0');
      const totalPages = Math.ceil(totalCount / pageSize);

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
        WHERE o.status ILIKE '%İade%' OR o.status ILIKE '%İptal%' OR o.net_profit < 0
        ORDER BY o.order_date DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `);

      return NextResponse.json({ 
        type, 
        pagination: { page, pageSize, totalCount, totalPages },
        data: returns 
      });
    }

    if (type === 'shipping') {
      const carriers = await query(`
        SELECT 
          COALESCE(o.carrier_name, 'Trendyol Express') as "carrier",
          COUNT(o.id) as "totalShipments",
          SUM(o.total_shipping_cost) as "totalShippingFee",
          ROUND(AVG(o.billed_desi), 1) as "avgBilledDesi",
          ROUND(AVG(o.calculated_desi), 1) as "avgCalculatedDesi",
          SUM(o.net_profit) as "totalGeneratedProfit"
        FROM orders o
        GROUP BY o.carrier_name
        ORDER BY COUNT(o.id) DESC
      `);

      return NextResponse.json({ 
        type, 
        pagination: { page: 1, pageSize: carriers.length, totalCount: carriers.length, totalPages: 1 },
        data: carriers 
      });
    }

    return NextResponse.json({ type, count: 0, data: [] });
  } catch (error: any) {
    console.error('Reports API error:', error);
    return NextResponse.json({ error: 'Rapor verileri alınamadı: ' + error.message }, { status: 500 });
  }
}
