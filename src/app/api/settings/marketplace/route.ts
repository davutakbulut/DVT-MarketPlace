export async function GET() {
  try {
    const stores = await query(`
      SELECT id, store_name, marketplace, supplier_id, api_key, is_active, updated_at
      FROM stores
      ORDER BY created_at ASC
    `);
    return NextResponse.json({ success: true, integrations: stores });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { marketplace, supplierId, apiKey, apiSecret } = await request.json();

    if (!marketplace) {
      return NextResponse.json({ error: 'Pazaryeri belirtilmedi.' }, { status: 400 });
    }

    const storeRes = await query(`
      SELECT id FROM stores WHERE marketplace = $1 LIMIT 1
    `, [marketplace]);

    if (storeRes.length > 0) {
      await query(`
        UPDATE stores
        SET supplier_id = $1, api_key = $2, api_secret = $3, updated_at = now()
        WHERE id = $4
      `, [supplierId, apiKey, apiSecret, storeRes[0].id]);
    } else {
      const compRes = await query(`SELECT id FROM companies LIMIT 1`);
      const compId = compRes[0]?.id || '11111111-1111-1111-1111-111111111111';
      await query(`
        INSERT INTO stores (company_id, store_name, marketplace, supplier_id, api_key, api_secret)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [compId, marketplace.toUpperCase() + ' Mağazam', marketplace, supplierId, apiKey, apiSecret]);
    }

    return NextResponse.json({ success: true, message: `${marketplace.toUpperCase()} API anahtarları veritabanına kaydedildi!` });
  } catch (error: any) {
    console.error('Marketplace settings save error:', error);
    return NextResponse.json({ error: 'API anahtarları kaydedilemedi: ' + error.message }, { status: 500 });
  }
}
