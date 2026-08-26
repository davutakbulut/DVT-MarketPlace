import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    let whereClause = '1=1';
    let params: any[] = [];

    if (storeId && storeId !== 'all') {
      whereClause = 'p.store_id::text = $1';
      params.push(storeId);
    }

    const products = await query(`
      SELECT 
        p.id, 
        p.barcode, 
        p.sku, 
        p.model_code as "modelCode", 
        p.title,
        p.current_sale_price as "salePrice", 
        p.current_cost as "costPrice",
        p.vat_rate as "vatRate", 
        p.shipment_desi as desi,
        p.commission_rate as "commissionRate", 
        p.stock_quantity as "stockQuantity",
        p.target_profit_margin_percent as "targetMargin"
      FROM products p
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
    `, params);

    return NextResponse.json(products);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { productId, barcode, costPrice, currentCost } = await request.json();
    const newCost = costPrice !== undefined ? costPrice : currentCost;

    if (productId && newCost !== undefined) {
      await query(`
        UPDATE products 
        SET current_cost = $1, updated_at = now()
        WHERE id::text = $2
      `, [newCost, productId]);

      return NextResponse.json({ success: true, updatedCost: newCost });
    }

    if (barcode && newCost !== undefined) {
      await query(`
        UPDATE products 
        SET current_cost = $1, updated_at = now()
        WHERE barcode = $2
      `, [newCost, barcode]);

      // Update order items matching barcode
      await query(`
        UPDATE order_items
        SET unit_cost_price = $1,
            net_profit = (invoiced_amount + platform_discount) - ($1 * quantity + commission_amount + shipping_amount + service_fee_share + withholding_tax + net_vat),
            margin_percent = ROUND((((invoiced_amount + platform_discount) - ($1 * quantity + commission_amount + shipping_amount + service_fee_share + withholding_tax + net_vat)) / NULLIF(invoiced_amount, 0)) * 100, 2)
        WHERE barcode = $2
      `, [newCost, barcode]);

      return NextResponse.json({ success: true, updatedCost: newCost });
    }

    return NextResponse.json({ error: 'Eksik parametre.' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
