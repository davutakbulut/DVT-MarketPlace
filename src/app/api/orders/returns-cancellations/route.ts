import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { buildDateConditions } from '@/lib/dateFilterHelper';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'all', 'return', 'cancellation'
    const reason = searchParams.get('reason') || 'all';
    const search = searchParams.get('search') || '';
    const storeId = searchParams.get('storeId') || 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(200, Math.max(10, parseInt(searchParams.get('pageSize') || '50')));
    const offset = (page - 1) * pageSize;

    let conditions: string[] = ["(o.status ILIKE '%İade%' OR o.status ILIKE '%İptal%' OR o.status ILIKE '%return%' OR o.status ILIKE '%cancel%')"];
    let params: any[] = [];
    let pIdx = 1;

    // Type filter
    if (type === 'return') {
      conditions.push(`(o.status ILIKE '%İade%' OR o.status ILIKE '%return%')`);
    } else if (type === 'cancellation') {
      conditions.push(`(o.status ILIKE '%İptal%' OR o.status ILIKE '%cancel%')`);
    }

    // Reason filter
    if (reason && reason !== 'all') {
      conditions.push(`(o.return_reason ILIKE $${pIdx} OR o.cancellation_reason ILIKE $${pIdx})`);
      params.push(`%${reason}%`);
      pIdx++;
    }

    // Store filter
    if (storeId && storeId !== 'all') {
      conditions.push(`o.store_id::text = $${pIdx}`);
      params.push(storeId);
      pIdx++;
    }

    // Search filter
    if (search) {
      conditions.push(`(
        o.marketplace_order_number ILIKE $${pIdx} OR 
        o.package_number ILIKE $${pIdx} OR 
        o.customer_name ILIKE $${pIdx} OR 
        o.tracking_code ILIKE $${pIdx} OR
        o.return_reason ILIKE $${pIdx} OR
        o.cancellation_reason ILIKE $${pIdx}
      )`);
      params.push(`%${search}%`);
      pIdx++;
    }

    // Date range filter
    const dateHelper = buildDateConditions(searchParams, 'COALESCE(o.return_date, o.cancellation_date, o.order_date)', pIdx);
    if (dateHelper.whereClause && dateHelper.whereClause !== '1=1') {
      conditions.push(dateHelper.whereClause);
      params.push(...dateHelper.params);
      pIdx = dateHelper.nextIndex;
    }

    const whereClause = conditions.join(' AND ');

    // 1. Summary KPIs
    const summaryRes = await query(`
      SELECT 
        COUNT(*) as "totalCount",
        COUNT(CASE WHEN o.status ILIKE '%İade%' OR o.status ILIKE '%return%' THEN 1 END) as "returnCount",
        COUNT(CASE WHEN o.status ILIKE '%İptal%' OR o.status ILIKE '%cancel%' THEN 1 END) as "cancellationCount",
        COALESCE(SUM(CASE WHEN o.status ILIKE '%İade%' OR o.status ILIKE '%return%' THEN o.paid_amount ELSE 0 END), 0) as "returnGrossTotal",
        COALESCE(SUM(CASE WHEN o.status ILIKE '%İptal%' OR o.status ILIKE '%cancel%' THEN o.paid_amount ELSE 0 END), 0) as "cancellationGrossTotal",
        COALESCE(SUM(CASE WHEN o.status ILIKE '%İade%' OR o.status ILIKE '%return%' THEN (o.total_shipping_cost + o.service_fee) ELSE 0 END), 0) as "totalReturnLoss",
        COALESCE(SUM(o.paid_amount), 0) as "totalRefundAmount"
      FROM orders o
      WHERE ${whereClause}
    `, params);

    const summary = summaryRes[0] || {};

    // 2. Reasons Distribution (İade & İptal Nedenleri Dağılımı)
    const reasonsRes = await query(`
      SELECT 
        COALESCE(NULLIF(TRIM(o.return_reason), ''), NULLIF(TRIM(o.cancellation_reason), ''), 'Diğer') as "reasonName",
        CASE 
          WHEN o.status ILIKE '%İade%' OR o.status ILIKE '%return%' THEN 'return'
          ELSE 'cancellation'
        END as "type",
        COUNT(*) as "count",
        SUM(o.paid_amount) as "totalAmount"
      FROM orders o
      WHERE ${whereClause}
      GROUP BY 1, 2
      ORDER BY "count" DESC
      LIMIT 10
    `, params);

    // 3. Orders List with items
    const ordersRes = await query(`
      SELECT 
        o.id,
        o.marketplace_order_number as "orderNumber",
        o.package_number as "packageNumber",
        TO_CHAR(o.order_date, 'YYYY-MM-DD HH24:MI') as "orderDate",
        TO_CHAR(o.return_date, 'YYYY-MM-DD HH24:MI') as "returnDate",
        TO_CHAR(o.cancellation_date, 'YYYY-MM-DD HH24:MI') as "cancellationDate",
        o.status,
        CASE 
          WHEN o.status ILIKE '%İade%' OR o.status ILIKE '%return%' THEN 'return'
          ELSE 'cancellation'
        END as "orderType",
        o.customer_name as "customerName",
        o.customer_city as "city",
        o.carrier_name as "carrierName",
        o.tracking_code as "trackingCode",
        o.gross_amount as "grossAmount",
        o.paid_amount as "paidAmount",
        o.refund_amount as "refundAmount",
        o.total_shipping_cost as "shippingCost",
        o.service_fee as "serviceFee",
        o.net_profit as "netProfit",
        o.return_reason as "returnReason",
        o.return_status as "returnStatus",
        o.cancellation_reason as "cancellationReason",
        s.store_name as "storeName",
        COALESCE(
          (
            SELECT json_agg(json_build_object(
              'id', oi.id,
              'title', oi.title,
              'barcode', oi.barcode,
              'sku', oi.sku,
              'quantity', oi.quantity,
              'unitPrice', oi.unit_sale_price,
              'grossAmount', oi.unit_sale_price * oi.quantity
            ))
            FROM order_items oi
            WHERE oi.order_id = o.id
          ),
          '[]'::json
        ) as "items"
      FROM orders o
      LEFT JOIN stores s ON s.id = o.store_id
      WHERE ${whereClause}
      ORDER BY COALESCE(o.return_date, o.cancellation_date, o.order_date) DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `, params);

    const totalCount = parseInt(summary.totalCount || '0');
    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      success: true,
      orders: ordersRes,
      summary: {
        totalCount,
        returnCount: parseInt(summary.returnCount || '0'),
        cancellationCount: parseInt(summary.cancellationCount || '0'),
        returnGrossTotal: parseFloat(summary.returnGrossTotal || '0'),
        cancellationGrossTotal: parseFloat(summary.cancellationGrossTotal || '0'),
        totalReturnLoss: parseFloat(summary.totalReturnLoss || '0'),
        totalRefundAmount: parseFloat(summary.totalRefundAmount || '0'),
      },
      reasonsDistribution: reasonsRes,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages
      }
    });
  } catch (error: any) {
    console.error('Returns and cancellations API error:', error);
    return NextResponse.json({ error: 'İade ve iptal siparişleri alınamadı: ' + error.message }, { status: 500 });
  }
}
