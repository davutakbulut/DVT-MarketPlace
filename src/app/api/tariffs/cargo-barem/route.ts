import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const tiers = await query(`
      SELECT 
        id, carrier_name as "carrierName", tier_name as "tierName",
        min_amount as "minAmount", max_amount as "maxAmount",
        discounted_price_ex_vat as "discountedPriceExVat",
        standard_price_ex_vat as "standardPriceExVat",
        effective_date as "effectiveDate", is_active as "isActive"
      FROM cargo_barem_tiers
      WHERE marketplace = 'trendyol'
      ORDER BY min_amount ASC, carrier_name ASC
    `);

    const desiRates = await query(`
      SELECT 
        carrier_name as "carrierName",
        min_desi as "minDesi",
        max_desi as "maxDesi",
        base_price as "basePrice"
      FROM carrier_desi_rates
      ORDER BY carrier_name ASC, min_desi ASC
    `);

    return NextResponse.json({
      tiers,
      desiRates
    });
  } catch (error: any) {
    console.error('Cargo barem fetch error:', error);
    return NextResponse.json({ error: 'Barem tarifesi veritabanından çekilemedi.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { id, discountedPriceExVat, standardPriceExVat } = await request.json();

    if (!id || discountedPriceExVat === undefined || standardPriceExVat === undefined) {
      return NextResponse.json({ error: 'Eksik parametre.' }, { status: 400 });
    }

    await query(`
      UPDATE cargo_barem_tiers
      SET discounted_price_ex_vat = $1, standard_price_ex_vat = $2, updated_at = now()
      WHERE id = $3
    `, [discountedPriceExVat, standardPriceExVat, id]);

    return NextResponse.json({ success: true, message: 'Kargo barem tarifesi başarıyla güncellendi.' });
  } catch (error: any) {
    console.error('Cargo barem update error:', error);
    return NextResponse.json({ error: 'Barem tarifesi güncellenemedi.' }, { status: 500 });
  }
}
