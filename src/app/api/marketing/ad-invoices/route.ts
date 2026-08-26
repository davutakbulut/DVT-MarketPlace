import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { buildDateConditions } from '@/lib/dateFilterHelper';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    // 1. Build conditions for ad_invoices (using invoice_date)
    let adConditions: string[] = [];
    let adParams: any[] = [];
    let adIdx = 1;

    if (storeId && storeId !== 'all') {
      adConditions.push(`store_id::text = $${adIdx}`);
      adParams.push(storeId);
      adIdx++;
    }

    const adDateHelper = buildDateConditions(searchParams, 'invoice_date', adIdx);
    if (adDateHelper.whereClause && adDateHelper.whereClause !== '1=1') {
      adConditions.push(adDateHelper.whereClause);
      adParams.push(...adDateHelper.params);
      adIdx = adDateHelper.nextIndex;
    }

    const adWhereClause = adConditions.length > 0 ? adConditions.join(' AND ') : '1=1';

    // Query ad invoices
    const invoices = await query(`
      SELECT 
        id, 
        invoice_number as "invoiceNumber", 
        invoice_type as "invoiceType",
        country, 
        TO_CHAR(invoice_date, 'YYYY-MM-DD') as "invoiceDate",
        amount_inc_vat as "amountIncVat", 
        vat_rate as "vatRate",
        period_month as "periodMonth"
      FROM ad_invoices
      WHERE ${adWhereClause}
      ORDER BY invoice_date DESC, created_at DESC
    `, adParams);

    // Query total ad spend & count
    const sumRes = await query(`
      SELECT 
        COALESCE(SUM(amount_inc_vat), 0) as "totalAdSpend", 
        COUNT(*) as "invoiceCount"
      FROM ad_invoices
      WHERE ${adWhereClause}
    `, adParams);

    // 2. Build conditions for orders (using order_date) to compute ROAS & TACoS for the same period
    let orderConditions: string[] = [];
    let orderParams: any[] = [];
    let orderIdx = 1;

    if (storeId && storeId !== 'all') {
      orderConditions.push(`store_id::text = $${orderIdx}`);
      orderParams.push(storeId);
      orderIdx++;
    }

    const orderDateHelper = buildDateConditions(searchParams, 'order_date', orderIdx);
    if (orderDateHelper.whereClause && orderDateHelper.whereClause !== '1=1') {
      orderConditions.push(orderDateHelper.whereClause);
      orderParams.push(...orderDateHelper.params);
      orderIdx = orderDateHelper.nextIndex;
    }

    const orderWhereClause = orderConditions.length > 0 ? orderConditions.join(' AND ') : '1=1';

    const orderRes = await query(`
      SELECT 
        COUNT(DISTINCT id) as "totalOrders",
        COALESCE(SUM(gross_amount), 0) as "grossRevenue"
      FROM orders
      WHERE ${orderWhereClause}
    `, orderParams);

    const totalAdSpend = parseFloat(sumRes[0]?.totalAdSpend || '0');
    const invoiceCount = parseInt(sumRes[0]?.invoiceCount || '0');
    const totalOrders = parseInt(orderRes[0]?.totalOrders || '0');
    const grossRevenue = parseFloat(orderRes[0]?.grossRevenue || '0');

    const adSpendPerOrder = totalOrders > 0 ? Math.round((totalAdSpend / totalOrders) * 100) / 100 : 0;
    const tacosPercent = grossRevenue > 0 ? Math.round((totalAdSpend / grossRevenue) * 10000) / 100 : 0;

    return NextResponse.json({
      invoices,
      summary: {
        totalAdSpend,
        invoiceCount,
        totalOrders,
        grossRevenue,
        adSpendPerOrder,
        tacosPercent,
      }
    });
  } catch (error: any) {
    console.error('Ad invoices fetch error:', error);
    return NextResponse.json({ error: 'Reklam faturaları çekilemedi: ' + error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { id, invoiceNumber, invoiceType, country, invoiceDate, amountIncVat } = await request.json();

    if (!invoiceNumber || !invoiceDate || amountIncVat === undefined) {
      return NextResponse.json({ error: 'Eksik fatura bilgisi.' }, { status: 400 });
    }

    const periodMonth = invoiceDate.substring(0, 7);

    if (id) {
      // Update
      await query(`
        UPDATE ad_invoices
        SET invoice_number = $1, invoice_type = $2, country = $3,
            invoice_date = $4, amount_inc_vat = $5, period_month = $6, updated_at = now()
        WHERE id = $7
      `, [invoiceNumber, invoiceType || 'Reklam Bedeli', country || 'Türkiye', invoiceDate, amountIncVat, periodMonth, id]);
      return NextResponse.json({ success: true, message: 'Fatura başarıyla güncellendi.' });
    } else {
      // Insert
      const storeRes = await query("SELECT id, company_id FROM stores LIMIT 1");
      const storeId = storeRes[0]?.id || '22222222-2222-2222-2222-222222222221';
      const companyId = storeRes[0]?.company_id || '11111111-1111-1111-1111-111111111111';

      await query(`
        INSERT INTO ad_invoices (company_id, store_id, invoice_number, invoice_type, country, invoice_date, amount_inc_vat, period_month)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [companyId, storeId, invoiceNumber, invoiceType || 'Reklam Bedeli', country || 'Türkiye', invoiceDate, amountIncVat, periodMonth]);
      return NextResponse.json({ success: true, message: 'Yeni reklam faturası veritabanına kaydedildi.' });
    }
  } catch (error: any) {
    console.error('Ad invoice save error:', error);
    return NextResponse.json({ error: 'Fatura kaydedilemedi: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID parametresi gereklidir.' }, { status: 400 });
    }

    await query('DELETE FROM ad_invoices WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Fatura başarıyla silindi.' });
  } catch (error: any) {
    console.error('Ad invoice delete error:', error);
    return NextResponse.json({ error: 'Fatura silinemedi: ' + error.message }, { status: 500 });
  }
}
