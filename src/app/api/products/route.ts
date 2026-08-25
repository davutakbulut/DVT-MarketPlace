import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId') || '22222222-2222-2222-2222-222222222221';

    const products = await query(`
      SELECT 
        p.id, p.barcode, p.sku, p.model_code as "modelCode", p.title,
        p.current_sale_price as "salePrice", p.current_cost as "costPrice",
        p.vat_rate as "vatRate", p.shipment_desi as desi,
        p.commission_rate as "commissionRate", p.stock_quantity as "stockQuantity",
        p.target_profit_margin_percent as "targetMargin"
      FROM products p
      WHERE p.store_id = $1
      ORDER BY p.created_at DESC
    `, [storeId]);

    return NextResponse.json(products);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { productId, costPrice } = await request.json();
    if (!productId || costPrice === undefined) {
      return NextResponse.json({ error: 'Eksik parametre.' }, { status: 400 });
    }

    await query(`
      UPDATE products 
      SET current_cost = $1, updated_at = now()
      WHERE id = $2
    `, [costPrice, productId]);

    // Insert cost history log
    await query(`
      INSERT INTO product_cost_history (product_id, cost_price, vat_rate, change_reason)
      VALUES ($1, $2, 20, 'Kullanıcı Canlı Analiz Düzenlemesi')
    `, [productId, costPrice]);

    return NextResponse.json({ success: true, updatedCost: costPrice });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
