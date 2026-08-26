import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const rows = await query(`
      SELECT 
        desi,
        MAX(CASE WHEN carrier_name = 'Aras' THEN price_ex_vat END) as "Aras",
        MAX(CASE WHEN carrier_name = 'DHL eCommerce' THEN price_ex_vat END) as "DHL eCommerce",
        MAX(CASE WHEN carrier_name = 'Kolay Gelsin' THEN price_ex_vat END) as "Kolay Gelsin",
        MAX(CASE WHEN carrier_name = 'PTT' THEN price_ex_vat END) as "PTT",
        MAX(CASE WHEN carrier_name = 'Sürat' THEN price_ex_vat END) as "Sürat",
        MAX(CASE WHEN carrier_name = 'TEX' THEN price_ex_vat END) as "TEX",
        MAX(CASE WHEN carrier_name = 'Yurtiçi' THEN price_ex_vat END) as "Yurtiçi",
        MAX(CASE WHEN carrier_name = 'CEVA Tedarik' THEN price_ex_vat END) as "CEVA Tedarik",
        MAX(CASE WHEN carrier_name = 'CEVA' THEN price_ex_vat END) as "CEVA",
        MAX(CASE WHEN carrier_name = 'Horoz' THEN price_ex_vat END) as "Horoz"
      FROM carrier_desi_matrices
      WHERE marketplace = 'trendyol'
      GROUP BY desi
      ORDER BY desi ASC
    `);

    // Build CSV
    const headers = ['Desi/KG', 'Aras', 'DHL eCommerce', 'Kolay Gelsin', 'PTT', 'Sürat', 'TEX', 'Yurtiçi', 'CEVA Tedarik', 'CEVA', 'Horoz'];
    const csvLines = [headers.join(';')];

    for (const r of rows) {
      const line = [
        r.desi,
        r['Aras'] || '',
        r['DHL eCommerce'] || '',
        r['Kolay Gelsin'] || '',
        r['PTT'] || '',
        r['Sürat'] || '',
        r['TEX'] || '',
        r['Yurtiçi'] || '',
        r['CEVA Tedarik'] || '',
        r['CEVA'] || '',
        r['Horoz'] || ''
      ].join(';');
      csvLines.push(line);
    }

    const csvContent = '\uFEFF' + csvLines.join('\r\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="DVT_Kargo_Guncel_Desi_Fiyatlari_2026.csv"',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
