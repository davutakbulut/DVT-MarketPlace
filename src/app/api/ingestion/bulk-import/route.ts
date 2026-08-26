import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const importType = (formData.get('importType') as string) || 'products';

    if (!file) {
      return NextResponse.json({ error: 'Lütfen bir dosya seçin.' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);

    if (lines.length < 2) {
      return NextResponse.json({ error: 'Dosya boş veya başlık satırı eksik.' }, { status: 400 });
    }

    const storeRows = await query('SELECT id, company_id FROM stores LIMIT 1');
    const storeId = storeRows[0]?.id || '22222222-2222-2222-2222-222222222221';
    const companyId = storeRows[0]?.company_id || '11111111-1111-1111-1111-111111111111';

    let processedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (row.length < 2) continue;

      if (importType === 'products') {
        const barcode = row[0];
        const title = row[1] || 'İçe Aktarılan Ürün';
        const costPrice = parseFloat(row[2]) || 0;
        const salePrice = parseFloat(row[3]) || 0;
        const commissionRate = parseFloat(row[4]) || 18.0;
        const desi = parseFloat(row[5]) || 1.0;

        if (barcode) {
          await query(`
            INSERT INTO products (
              company_id, store_id, barcode, sku, title, current_cost, current_sale_price,
              commission_rate, shipment_desi, stock_quantity, updated_at
            ) VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8, 100, now())
            ON CONFLICT (store_id, barcode) DO UPDATE
            SET current_cost = EXCLUDED.current_cost,
                current_sale_price = EXCLUDED.current_sale_price,
                commission_rate = EXCLUDED.commission_rate,
                shipment_desi = EXCLUDED.shipment_desi,
                updated_at = now()
          `, [companyId, storeId, barcode, title, costPrice, salePrice, commissionRate, desi]);
          processedCount++;
        }
      } else if (importType === 'invoices') {
        const invoiceNumber = row[0];
        const platform = row[1] || 'Trendyol Reklam';
        const date = row[2] || new Date().toISOString().slice(0, 10);
        const total = parseFloat(row[3]) || 0;

        if (invoiceNumber && total > 0) {
          await query(`
            INSERT INTO ad_invoices (
              company_id, store_id, invoice_number, invoice_type, invoice_date, amount_inc_vat, vat_rate
            ) VALUES ($1, $2, $3, $4, $5, $6, 20)
            ON CONFLICT DO NOTHING
          `, [companyId, storeId, invoiceNumber, platform, date, total]);
          processedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Toplu içe aktarım tamamlandı! Toplam ${processedCount} kayıt başarıyla işlendi ve veritabanına kaydedildi.`,
      processedCount,
    });
  } catch (error: any) {
    console.error('Bulk ingestion error:', error);
    return NextResponse.json({ error: 'İçe aktarım sırasında hata oluştu: ' + error.message }, { status: 500 });
  }
}
