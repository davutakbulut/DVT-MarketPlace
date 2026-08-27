import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  testMssqlConnection,
  fetchItemCostFromMssql,
  fetchBatchCostsFromMssql,
  fetchAllActiveCostsFromMssql
} from '@/lib/integrations/mssql/mssqlClient';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'test') {
      const testResult = await testMssqlConnection();
      return NextResponse.json(testResult);
    }

    return NextResponse.json({
      service: 'MSSQL Read-Only Cost Sync API',
      status: 'active',
      security: 'Read-only SELECT query restriction enforced'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action = 'sync_all', barcode, barcodes, storeId } = body;

    // 1. Single barcode sync
    if (action === 'sync_single' && barcode) {
      const costItem = await fetchItemCostFromMssql(barcode);
      if (!costItem) {
        return NextResponse.json({
          success: false,
          message: `Barkod ${barcode} için MSSQL üzerinde maliyet kaydı bulunamadı.`
        }, { status: 404 });
      }

      // Update product in local DB
      const updateRes = await query(
        `UPDATE products 
         SET current_cost = $1, cost_currency = $2, updated_at = NOW() 
         WHERE barcode = $3 
         RETURNING id, title, barcode, current_cost`,
        [costItem.cost, costItem.currency || 'TRY', costItem.barcode]
      );

      if (updateRes.length > 0) {
        // Record cost history
        await query(
          `INSERT INTO product_cost_history (
             product_id, cost_price, vat_rate, currency, effective_date, change_reason
           ) VALUES ($1, $2, 20, $3, NOW(), 'MSSQL prItemBasePrice Senkronizasyonu')`,
          [updateRes[0].id, costItem.cost, costItem.currency || 'TRY']
        ).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        message: `Barkod ${costItem.barcode} maliyeti ₺${costItem.cost.toFixed(2)} olarak güncellendi.`,
        item: costItem,
        updatedProducts: updateRes
      });
    }

    // 2. Batch / All products sync
    let targetProducts: any[] = [];
    if (action === 'sync_batch' && Array.isArray(barcodes) && barcodes.length > 0) {
      targetProducts = await query(
        `SELECT id, barcode, current_cost, title FROM products WHERE barcode = ANY($1::text[])`,
        [barcodes]
      );
    } else {
      let sql = `SELECT id, barcode, current_cost, title FROM products WHERE is_active = true AND barcode IS NOT NULL`;
      const params: any[] = [];
      if (storeId && storeId !== 'all') {
        sql += ` AND store_id = $1`;
        params.push(storeId);
      }
      targetProducts = await query(sql, params);
    }

    if (targetProducts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Güncellenecek ürün bulunamadı.',
        updatedCount: 0
      });
    }

    // Fetch costs from MSSQL (either full active table or batch)
    const productBarcodes = targetProducts.map(p => p.barcode).filter(Boolean);
    let mssqlCosts: { barcode: string; cost: number; currency: string }[] = [];

    if (productBarcodes.length <= 500) {
      mssqlCosts = await fetchBatchCostsFromMssql(productBarcodes);
    } else {
      mssqlCosts = await fetchAllActiveCostsFromMssql();
    }

    const costMap = new Map<string, { cost: number; currency: string }>();
    mssqlCosts.forEach(c => {
      costMap.set(c.barcode.trim(), { cost: c.cost, currency: c.currency });
    });

    let updatedCount = 0;
    let missingCount = 0;

    for (const prod of targetProducts) {
      const match = costMap.get(prod.barcode?.trim());
      if (match && match.cost > 0) {
        await query(
          `UPDATE products 
           SET current_cost = $1, cost_currency = $2, updated_at = NOW() 
           WHERE id = $3`,
          [match.cost, match.currency || 'TRY', prod.id]
        );

        // Record history if cost changed
        if (parseFloat(prod.current_cost || 0) !== match.cost) {
          await query(
            `INSERT INTO product_cost_history (
               product_id, cost_price, vat_rate, currency, effective_date, change_reason
             ) VALUES ($1, $2, 20, $3, NOW(), 'MSSQL Otomatik Maliyet Çekme')`,
            [prod.id, match.cost, match.currency || 'TRY']
          ).catch(() => {});
        }

        updatedCount++;
      } else {
        missingCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `${updatedCount} ürünün maliyeti MSSQL üzerinden başarıyla güncellendi. (${missingCount} ürün MSSQL tablosunda bulunamadı)`,
      totalExamined: targetProducts.length,
      updatedCount,
      missingCount,
      totalMssqlRecordsFound: mssqlCosts.length
    });
  } catch (error: any) {
    console.error('MSSQL cost sync error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Maliyet senkronizasyonu sırasında hata oluştu.'
    }, { status: 500 });
  }
}
