import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  testMssqlConnection,
  fetchItemCostByModelCodeFromMssql,
  fetchBatchCostsByModelCodesFromMssql,
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
      matchingKey: 'Trendyol Model Code (model_code / sku) -> MSSQL ItemCode',
      security: 'Read-only SELECT query restriction enforced'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action = 'sync_all', modelCode, modelCodes, storeId } = body;

    // 1. Single Model Code sync
    if (action === 'sync_single' && modelCode) {
      const costItem = await fetchItemCostByModelCodeFromMssql(modelCode);
      if (!costItem) {
        return NextResponse.json({
          success: false,
          message: `Model Kodu "${modelCode}" için MSSQL (prItemBasePrice) üzerinde maliyet kaydı bulunamadı.`
        }, { status: 404 });
      }

      // Update product in local DB by model_code or sku
      const updateRes = await query(
        `UPDATE products 
         SET current_cost = $1, cost_currency = $2, updated_at = NOW() 
         WHERE model_code = $3 OR sku = $3 
         RETURNING id, title, barcode, sku, model_code, current_cost`,
        [costItem.cost, costItem.currency || 'TRY', costItem.modelCode]
      );

      if (updateRes.length > 0) {
        // Record cost history
        for (const up of updateRes) {
          await query(
            `INSERT INTO product_cost_history (
               product_id, cost_price, vat_rate, currency, effective_date, change_reason
             ) VALUES ($1, $2, 20, $3, NOW(), 'MSSQL prItemBasePrice Model Kodu Senkronizasyonu')`,
            [up.id, costItem.cost, costItem.currency || 'TRY']
          ).catch(() => {});
        }
      }

      return NextResponse.json({
        success: true,
        message: `Model Kodu "${costItem.modelCode}" maliyeti ₺${costItem.cost.toFixed(2)} olarak güncellendi.`,
        item: costItem,
        updatedProducts: updateRes
      });
    }

    // 2. Batch / All products sync based on Model Code (ItemCode)
    let targetProducts: any[] = [];
    if (action === 'sync_batch' && Array.isArray(modelCodes) && modelCodes.length > 0) {
      targetProducts = await query(
        `SELECT id, barcode, sku, model_code, current_cost, title 
         FROM products 
         WHERE model_code = ANY($1::text[]) OR sku = ANY($1::text[])`,
        [modelCodes]
      );
    } else {
      let sql = `
        SELECT id, barcode, sku, model_code, current_cost, title 
        FROM products 
        WHERE is_active = true AND (model_code IS NOT NULL OR sku IS NOT NULL)
      `;
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
        message: 'Güncellenecek model koduna sahip ürün bulunamadı.',
        updatedCount: 0
      });
    }

    // Collect all distinct Model Codes / SKUs to query MSSQL
    const distinctModelCodes = Array.from(new Set(
      targetProducts
        .map(p => (p.model_code || p.sku || '').trim())
        .filter(Boolean)
    ));

    let mssqlCosts: { modelCode: string; cost: number; currency: string }[] = [];

    if (distinctModelCodes.length <= 500) {
      mssqlCosts = await fetchBatchCostsByModelCodesFromMssql(distinctModelCodes);
    } else {
      mssqlCosts = await fetchAllActiveCostsFromMssql();
    }

    // Map by normalized ItemCode (case-insensitive & trimmed)
    const costMap = new Map<string, { cost: number; currency: string }>();
    mssqlCosts.forEach(c => {
      if (c.modelCode) {
        costMap.set(c.modelCode.trim().toLowerCase(), { cost: c.cost, currency: c.currency });
      }
    });

    let updatedCount = 0;
    let missingCount = 0;
    const updatedDetails: any[] = [];

    for (const prod of targetProducts) {
      const codeKey1 = (prod.model_code || '').trim().toLowerCase();
      const codeKey2 = (prod.sku || '').trim().toLowerCase();
      
      const match = (codeKey1 && costMap.get(codeKey1)) || (codeKey2 && costMap.get(codeKey2));

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
             ) VALUES ($1, $2, 20, $3, NOW(), 'MSSQL Model Kodu (ItemCode) Otomatik Maliyet Çekme')`,
            [prod.id, match.cost, match.currency || 'TRY']
          ).catch(() => {});
        }

        updatedCount++;
        if (updatedDetails.length < 15) {
          updatedDetails.push({
            title: prod.title?.slice(0, 30),
            modelCode: prod.model_code || prod.sku,
            newCost: match.cost
          });
        }
      } else {
        missingCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `${updatedCount} ürünün maliyeti Trendyol Model Kodu ➔ MSSQL ItemCode eşleşmesiyle başarıyla güncellendi. (${missingCount} ürün MSSQL tablosunda bulunamadı)`,
      totalExamined: targetProducts.length,
      updatedCount,
      missingCount,
      totalMssqlRecordsFound: mssqlCosts.length,
      sampleUpdated: updatedDetails
    });
  } catch (error: any) {
    console.error('MSSQL cost sync error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Maliyet senkronizasyonu sırasında hata oluştu.'
    }, { status: 500 });
  }
}
