import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'orders';

    let csvContent = '\uFEFF'; // UTF-8 BOM for Turkish Excel support

    if (reportType === 'orders') {
      csvContent += 'Siparis No,Pazaryeri,Magaza,Tarih,Brut Tutar (TL),Maliyet (TL),Komisyon (TL),Kargo (TL),Hizmet Bedeli (TL),Stopaj (TL),Net Kar (TL),Kar Marji (%)\r\n';
      const orders = await query(`
        SELECT 
          o.marketplace_order_number, s.marketplace, s.store_name,
          TO_CHAR(o.order_date, 'YYYY-MM-DD HH24:MI') as order_date,
          o.gross_amount, o.total_cost, o.total_commission,
          o.total_shipping_cost, o.service_fee, o.withholding_tax,
          o.net_profit, o.profit_margin_percent
        FROM orders o
        LEFT JOIN stores s ON s.id = o.store_id
        ORDER BY o.order_date DESC
      `);
      for (const o of orders) {
        csvContent += `"${o.marketplace_order_number}","${o.marketplace}","${o.store_name || ''}","${o.order_date}",${o.gross_amount},${o.total_cost},${o.total_commission},${o.total_shipping_cost},${o.service_fee},${o.withholding_tax},${o.net_profit},${o.profit_margin_percent}\r\n`;
      }
    } else if (reportType === 'products') {
      csvContent += 'Barkod,SKU,Urun Adi,Satis Fiyati (TL),Maliyet (TL),Komisyon Orani (%),Desi\r\n';
      const prods = await query('SELECT barcode, sku, title, current_sale_price, current_cost, commission_rate, shipment_desi FROM products');
      for (const p of prods) {
        csvContent += `"${p.barcode}","${p.sku}","${p.title}",${p.current_sale_price},${p.current_cost},${p.commission_rate},${p.shipment_desi}\r\n`;
      }
    } else if (reportType === 'marketing') {
      csvContent += 'Fatura No,Platform,Tarih,KDV Haric Tutar (TL),KDV Tutari (TL),Toplam Tutar (TL)\r\n';
      const ads = await query(`
        SELECT 
          invoice_number, COALESCE(invoice_type, 'Trendyol Reklam') as platform,
          TO_CHAR(invoice_date, 'YYYY-MM-DD') as idate,
          ROUND((amount_inc_vat / (1 + vat_rate / 100))::numeric, 2) as amount_ex_vat,
          ROUND((amount_inc_vat - (amount_inc_vat / (1 + vat_rate / 100)))::numeric, 2) as vat_amount,
          amount_inc_vat as total_amount
        FROM ad_invoices
        ORDER BY invoice_date DESC
      `);
      for (const a of ads) {
        csvContent += `"${a.invoice_number}","${a.platform}","${a.idate}",${a.amount_ex_vat},${a.vat_amount},${a.total_amount}\r\n`;
      }
    } else {
      csvContent += 'Rapor,Detay\r\nGenel Rapor,Aktif\r\n';
    }

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="dvt_finansal_rapor_${reportType}_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
