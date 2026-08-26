import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const brand = searchParams.get('brand') || 'all';
    const stockStatus = searchParams.get('stockStatus') || 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(250, Math.max(10, parseInt(searchParams.get('pageSize') || '50')));
    const offset = (page - 1) * pageSize;

    let conditions: string[] = ['1=1'];
    let params: any[] = [];
    let pIdx = 1;

    if (search) {
      conditions.push(`(p.title ILIKE $${pIdx} OR p.barcode ILIKE $${pIdx} OR p.model_code ILIKE $${pIdx} OR p.sku ILIKE $${pIdx})`);
      params.push(`%${search}%`);
      pIdx++;
    }

    if (brand && brand !== 'all') {
      conditions.push(`p.brand ILIKE $${pIdx}`);
      params.push(`%${brand}%`);
      pIdx++;
    }

    if (stockStatus === 'in_stock') {
      conditions.push(`p.stock_quantity > 0`);
    } else if (stockStatus === 'out_of_stock') {
      conditions.push(`p.stock_quantity = 0`);
    }

    const whereClause = conditions.join(' AND ');

    // Total Count
    const countRes = await query(`SELECT COUNT(*) as total FROM products p WHERE ${whereClause}`, params);
    const totalCount = parseInt(countRes[0]?.total || '0');
    const totalPages = Math.ceil(totalCount / pageSize);

    // Brands list for filter dropdown
    const brandsRes = await query(`SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND brand != '' ORDER BY brand ASC`);
    const brands = brandsRes.map((r: any) => r.brand);

    const products = await query(`
      SELECT 
        p.id, 
        p.barcode, 
        p.sku, 
        p.model_code as "modelCode", 
        p.title,
        p.brand,
        p.image_url as "imageUrl",
        p.marketplace_product_url as "marketplaceUrl",
        p.current_sale_price as "salePrice", 
        p.current_cost as "costPrice",
        p.vat_rate as "vatRate", 
        p.shipment_desi as desi,
        p.commission_rate as "commissionRate", 
        p.stock_quantity as "stockQuantity",
        p.delivery_type as "deliveryType",
        p.target_profit_margin_percent as "targetMargin",
        TO_CHAR(p.created_at, 'YYYY-MM-DD') as "createdAt"
      FROM products p
      WHERE ${whereClause}
      ORDER BY p.stock_quantity DESC, p.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `, params);

    return NextResponse.json({
      products,
      brands,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { productId, barcode, costPrice, salePrice, stockQuantity } = await request.json();

    if (productId) {
      await query(`
        UPDATE products 
        SET current_cost = COALESCE($1, current_cost),
            current_sale_price = COALESCE($2, current_sale_price),
            stock_quantity = COALESCE($3, stock_quantity),
            updated_at = now()
        WHERE id::text = $4
      `, [costPrice, salePrice, stockQuantity, productId]);

      return NextResponse.json({ success: true });
    }

    if (barcode) {
      await query(`
        UPDATE products 
        SET current_cost = COALESCE($1, current_cost),
            current_sale_price = COALESCE($2, current_sale_price),
            stock_quantity = COALESCE($3, stock_quantity),
            updated_at = now()
        WHERE barcode = $4
      `, [costPrice, salePrice, stockQuantity, barcode]);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Eksik parametre.' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
