import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Lütfen bir CSV veya Excel dosyası yükleyin.' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) {
      return NextResponse.json({ error: 'Dosya boş veya geçersiz format.' }, { status: 400 });
    }

    const delimiter = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));

    const carrierNames = ['Aras', 'DHL eCommerce', 'Kolay Gelsin', 'PTT', 'Sürat', 'TEX', 'Yurtiçi', 'CEVA Tedarik', 'CEVA', 'Horoz'];
    let updatedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
      const desi = parseInt(cols[0]);
      if (isNaN(desi)) continue;

      for (let cIdx = 1; cIdx < cols.length && cIdx < headers.length; cIdx++) {
        const headerCarrier = headers[cIdx];
        const matchCarrier = carrierNames.find(c => c.toLowerCase() === headerCarrier.toLowerCase());
        const price = parseFloat(cols[cIdx]?.replace(',', '.'));

        if (matchCarrier && !isNaN(price)) {
          await query(`
            INSERT INTO carrier_desi_matrices (marketplace, carrier_name, desi, price_ex_vat)
            VALUES ('trendyol', $1, $2, $3)
            ON CONFLICT (marketplace, carrier_name, desi)
            DO UPDATE SET price_ex_vat = EXCLUDED.price_ex_vat, updated_at = now()
          `, [matchCarrier, desi, price]);
          updatedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Tebrikler! ${updatedCount} adet desi fiyatı veritabanına başarıyla aktarıldı ve güncellendi.`,
      updatedCount,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Dosya işlenirken hata oluştu: ' + error.message }, { status: 500 });
  }
}
