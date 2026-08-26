import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 1. Negative Profit Orders from live orders
    const negativeOrders = await query(`
      SELECT 
        o.id,
        'negative_profit' as "alertType",
        'critical' as severity,
        'Zararına Sipariş Satışı' as title,
        CONCAT('Sipariş #', o.marketplace_order_number, ' (Müşteri: ', o.customer_name, ') kargo ve komisyon kesintileri sonrası ₺', ABS(o.net_profit), ' zarar üretmiştir.') as description,
        'order' as "relatedEntityType",
        o.marketplace_order_number as "relatedEntityId",
        ABS(o.net_profit) as "lossAmount",
        false as "isResolved",
        TO_CHAR(o.order_date, 'YYYY-MM-DD HH24:MI') as "createdAt"
      FROM orders o
      WHERE o.net_profit < 0
      ORDER BY o.net_profit ASC
      LIMIT 20
    `);

    // 2. Desi Overcharge alerts from orders
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
      WHERE o.billed_desi > o.calculated_desi
      ORDER BY o.order_date DESC
      LIMIT 20
    `);

    // 3. Missing Cost Products alerts
    const missingCostAlerts = await query(`
      SELECT 
        p.id,
        'missing_cost' as "alertType",
        'warning' as severity,
        'Alış Maliyeti Girilmemiş Ürün' as title,
        CONCAT(p.title, ' (Barkod: ', p.barcode, ') için alış maliyeti ₺0 olarak kayıtlıdır.') as description,
        'product' as "relatedEntityType",
        p.barcode as "relatedEntityId",
        0.00 as "lossAmount",
        false as "isResolved",
        TO_CHAR(p.created_at, 'YYYY-MM-DD HH24:MI') as "createdAt"
      FROM products p
      WHERE p.current_cost = 0
      LIMIT 10
    `);

    const alerts = [...negativeOrders, ...desiAlerts, ...missingCostAlerts];

    let criticalCount = negativeOrders.length;
    let warningCount = desiAlerts.length + missingCostAlerts.length;
    let totalRiskAmount = negativeOrders.reduce((sum, a) => sum + parseFloat(a.lossAmount || 0), 0) +
                          desiAlerts.reduce((sum, a) => sum + parseFloat(a.lossAmount || 0), 0);

    return NextResponse.json({
      alerts,
      summary: {
        totalAlerts: alerts.length,
        criticalCount,
        warningCount,
        totalRiskAmount: Math.round(totalRiskAmount * 100) / 100,
      }
    });
  } catch (error: any) {
    console.error('Alerts fetch error:', error);
    return NextResponse.json({ error: 'Uyarılar alınamadı.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    return NextResponse.json({ success: true, message: 'Uyarı güncellendi.' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Güncellenemedi.' }, { status: 500 });
  }
}
