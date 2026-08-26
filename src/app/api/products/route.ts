import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const brand = searchParams.get('brand') || 'all';
    const storeId = searchParams.get('storeId') || 'all';
    const marketplace = searchParams.get('marketplace') || 'all';
    const stockStatus = searchParams.get('stockStatus') || 'all';
    const hasPagination = searchParams.has('page') || searchParams.has('pageSize');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(500, Math.max(10, parseInt(searchParams.get('pageSize') || '50')));
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

    if (storeId && storeId !== 'all') {
      conditions.push(`p.store_id::text = $${pIdx}`);
      params.push(storeId);
      pIdx++;
    }

    if (marketplace && marketplace !== 'all') {
      conditions.push(`p.marketplace = $${pIdx}`);
      params.push(marketplace);
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

    const limitClause = hasPagination ? `LIMIT ${pageSize} OFFSET ${offset}` : `LIMIT 500`;

    const products = await query(`
      SELECT 
        p.id, 
        p.store_id as "storeId",
        p.marketplace,
        p.barcode, 
        p.sku, 
        p.model_code as "modelCode", 
        p.title,
        p.brand,
        p.image_url as "imageUrl",
        p.marketplace_product_url as "marketplaceUrl",
        p.current_sale_price as "salePrice", 
        p.current_cost as "currentCost", 
        p.current_cost as "costPrice",
        p.vat_rate as "vatRate", 
        p.commission_rate as "commissionRate", 
        p.shipment_desi as "desi",
        p.shipment_desi as "shipmentDesi", 
        p.measured_desi as "measuredDesi",
        p.stock_quantity as "stockQuantity",
        p.extra_cost as "extraCost",
        p.target_profit_margin_percent as "targetMarginPercent",
        p.target_profit_amount as "targetProfitAmount",
        p.delivery_type as "deliveryType",
        p.selected_tariff_tier as "selectedTariffTier",
        p.is_active as "isActive",
        ROUND((p.current_sale_price - (
          COALESCE(p.current_cost, 0) + 
          (p.current_sale_price * (COALESCE(p.commission_rate, 15) / 100)) + 
          46.50 + 
          (p.current_sale_price * 0.06)
        ))::numeric, 2) as "calculatedNetProfit",
        ROUND((
          (p.current_sale_price - (
            COALESCE(p.current_cost, 0) + 
            (p.current_sale_price * (COALESCE(p.commission_rate, 15) / 100)) + 
            46.50 + 
            (p.current_sale_price * 0.06)
          )) / NULLIF(p.current_sale_price, 0) * 100
        )::numeric, 1) as "calculatedMarginPercent"
      FROM products p
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
      ${limitClause}
    `, params);

    return NextResponse.json({
      products,
      brands,
      pagination: hasPagination ? {
        page,
        pageSize,
        totalCount,
        totalPages
      } : undefined
    });
  } catch (error: any) {
    console.error('Products API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const productId = body.productId || body.id;
    const barcode = body.barcode;
    const costPrice = body.costPrice !== undefined ? body.costPrice : body.currentCost;
    const salePrice = body.salePrice;
    const stockQuantity = body.stockQuantity;

    if (!productId && !barcode) {
      return NextResponse.json({ error: 'Ürün ID veya Barkod zorunludur' }, { status: 400 });
    }

    let updateQuery = 'UPDATE products SET updated_at = NOW()';
    const params: any[] = [];
    let pIdx = 1;

    if (costPrice !== undefined) {
      updateQuery += `, current_cost = $${pIdx}`;
      params.push(costPrice);
      pIdx++;
    }

    if (salePrice !== undefined) {
      updateQuery += `, current_sale_price = $${pIdx}`;
      params.push(salePrice);
      pIdx++;
    }

    if (stockQuantity !== undefined) {
      updateQuery += `, stock_quantity = $${pIdx}`;
      params.push(stockQuantity);
      pIdx++;
    }

    if (productId) {
      updateQuery += ` WHERE id = $${pIdx} RETURNING *`;
      params.push(productId);
    } else {
      updateQuery += ` WHERE barcode = $${pIdx} RETURNING *`;
      params.push(barcode);
    }

    const updatedProduct = await query(updateQuery, params);

    if (updatedProduct.length === 0) {
      return NextResponse.json({ error: 'Ürün bulunamadı' }, { status: 404 });
    }

    const prod = updatedProduct[0];

    // Also update order_items with this cost for live consistency
    if (costPrice !== undefined && prod.barcode) {
      await query(`
        UPDATE order_items 
        SET unit_cost_price = $1, updated_at = NOW() 
        WHERE barcode = $2
      `, [costPrice, prod.barcode]);
    }

    return NextResponse.json({ success: true, product: prod });
  } catch (error: any) {
    console.error('Update Product Cost error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
