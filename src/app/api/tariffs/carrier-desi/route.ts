import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const carrier = searchParams.get('carrier');
    const minDesi = parseInt(searchParams.get('minDesi') || '0');
    const maxDesi = parseInt(searchParams.get('maxDesi') || '500');

    let sql = `
      SELECT 
        desi,
        MAX(CASE WHEN carrier_name = 'Aras' THEN price_ex_vat END) as "aras",
        MAX(CASE WHEN carrier_name = 'DHL eCommerce' THEN price_ex_vat END) as "dhl",
        MAX(CASE WHEN carrier_name = 'Kolay Gelsin' THEN price_ex_vat END) as "kolayGelsin",
        MAX(CASE WHEN carrier_name = 'PTT' THEN price_ex_vat END) as "ptt",
        MAX(CASE WHEN carrier_name = 'Sürat' THEN price_ex_vat END) as "surat",
        MAX(CASE WHEN carrier_name = 'TEX' THEN price_ex_vat END) as "tex",
        MAX(CASE WHEN carrier_name = 'Yurtiçi' THEN price_ex_vat END) as "yurtici",
        MAX(CASE WHEN carrier_name = 'CEVA Tedarik' THEN price_ex_vat END) as "cevaTedarik",
        MAX(CASE WHEN carrier_name = 'CEVA' THEN price_ex_vat END) as "ceva",
        MAX(CASE WHEN carrier_name = 'Horoz' THEN price_ex_vat END) as "horoz"
      FROM carrier_desi_matrices
      WHERE marketplace = 'trendyol' AND desi >= $1 AND desi <= $2
      GROUP BY desi
      ORDER BY desi ASC
    `;

    const rows = await query(sql, [minDesi, maxDesi]);
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Desi fetch error:', error);
    return NextResponse.json({ error: 'Desi matrisi çekilemedi.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { carrierName, desi, priceExVat } = await request.json();

    if (!carrierName || desi === undefined || priceExVat === undefined) {
      return NextResponse.json({ error: 'Eksik parametre.' }, { status: 400 });
    }

    await query(`
      INSERT INTO carrier_desi_matrices (marketplace, carrier_name, desi, price_ex_vat)
      VALUES ('trendyol', $1, $2, $3)
      ON CONFLICT (marketplace, carrier_name, desi)
      DO UPDATE SET price_ex_vat = EXCLUDED.price_ex_vat, updated_at = now()
    `, [carrierName, desi, priceExVat]);

    return NextResponse.json({ success: true, message: `${carrierName} ${desi} Desi fiyatı güncellendi.` });
  } catch (error: any) {
    console.error('Desi update error:', error);
    return NextResponse.json({ error: 'Fiyat güncellenemedi.' }, { status: 500 });
  }
}
