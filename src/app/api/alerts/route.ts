import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getOrderNetProfitSQL } from '@/lib/financialEngine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || 'all';

    const settingsRes = await query(`SELECT extra_operation_rate as "extraOperationRate" FROM company_settings LIMIT 1`);
    const extraOpRate = parseFloat(settingsRes[0]?.extraOperationRate ?? 6.00);
    const extraOpFraction = extraOpRate / 100.0;

    let storeCondition = '1=1';
    let params: any[] = [extraOpFraction];
    if (storeId && storeId !== 'all') {
      storeCondition = 'o.store_id::text = $2';
      params.push(storeId);
    }

    // 1. Negative Profit Orders calculated dynamically
    const negativeOrders = await query(`
      SELECT 
        o.id,
        'negative_profit' as "alertType",
        'critical' as severity,
        'Zararına Sipariş Satışı' as title,
        CONCAT('Sipariş #', o.marketplace_order_number, ' (Müşteri: ', o.customer_name, ') kargo ve komisyon kesintileri sonrası ₺', ABS(ROUND(${getOrderNetProfitSQL(1)}::numeric, 2)), ' zarar üretmiştir.') as description,
        'order' as "relatedEntityType",
        o.marketplace_order_number as "relatedEntityId",
        ABS(ROUND(${getOrderNetProfitSQL(1)}::numeric, 2)) as "lossAmount",
        false as "isResolved",
        TO_CHAR(o.order_date, 'YYYY-MM-DD HH24:MI') as "createdAt"
      FROM orders o
      WHERE ${getOrderNetProfitSQL(1)} < 0 AND ${storeCondition}
      ORDER BY ${getOrderNetProfitSQL(1)} ASC
      LIMIT 20
    `, params);

    // 2. Desi Overcharge alerts from orders
    let desiParams: any[] = [];
    let desiStoreCondition = '1=1';
    if (storeId && storeId !== 'all') {
      desiStoreCondition = 'o.store_id::text = $1';
      desiParams.push(storeId);
    }

    const desiAlerts = await query(`
      SELECT 
        o.id,
        'desi_overcharge' as "alertType",
        'warning' as severity,
        'Kargo Desi Aşım Kesintisi' as title,
        CONCAT('Paket #', o.package_number, ' için kargo şirketi ', o.billed_desi, ' desi faturalandırmış, satıcı hesabı ', o.calculated_desi, ' desi.') as description,
        'shipment' as "relatedEntityType",
        o.package_number as "relatedEntityId",
        ROUND((COALESCE(o.billed_desi, 1) - COALESCE(o.calculated_desi, 1)) * 14.50, 2) as "lossAmount",
        false as "isResolved",
        TO_CHAR(o.order_date, 'YYYY-MM-DD HH24:MI') as "createdAt"
      FROM orders o
      WHERE o.billed_desi > o.calculated_desi AND ${desiStoreCondition}
      ORDER BY o.order_date DESC
      LIMIT 20
    `, desiParams);

    const alerts = [...negativeOrders, ...desiAlerts];

    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const warningCount = alerts.filter(a => a.severity === 'warning').length;
    const totalRiskAmount = alerts.reduce((acc, a) => acc + (parseFloat(a.lossAmount) || 0), 0);

    return NextResponse.json({
      alerts,
      summary: {
        totalAlerts: alerts.length,
        criticalCount,
        warningCount,
        totalRiskAmount: Math.round(totalRiskAmount * 100) / 100
      }
    });

  } catch (error: any) {
    console.error('Alerts API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    return NextResponse.json({ success: true, message: 'Uyarı çözümlendi olarak işaretlendi.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
