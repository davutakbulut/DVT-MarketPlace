/**
 * ULTRA-SECURE READ-ONLY MSSQL CLIENT
 * 
 * Güvenlik Politikası:
 * 1. Bu istemci KESİNLİKLE sadece veri okuma (SELECT) amaçlıdır.
 * 2. INSERT, UPDATE, DELETE, DROP, ALTER, EXEC, SP_, XP_ ve tüm veri değiştirici komutlar kod seviyesinde engellenmiştir.
 * 3. readOnlyIntent aktiftir.
 * 4. Tüm sorgular parametrik (SQL Injection korumalı) olarak çalıştırılır.
 * 5. Eşleşme kuralı: Trendyol'daki Model Kodu (model_code / sku) -> MSSQL tablosundaki ItemCode alanına denk gelir.
 */

import sql from 'mssql';

export interface MssqlConfig {
  server: string;
  port?: number;
  database: string;
  user: string;
  password: string;
  trustServerCertificate: boolean;
  encrypt: boolean;
}

export interface ItemCostResult {
  modelCode: string;
  cost: number;
  currency: string;
}

const DEFAULT_CONFIG: MssqlConfig = {
  server: process.env.MSSQL_SERVER || '195.175.214.66',
  port: parseInt(process.env.MSSQL_PORT || '1433'),
  database: process.env.MSSQL_DATABASE || 'Bdd2017',
  user: process.env.MSSQL_USER || 'sa',
  password: process.env.MSSQL_PASSWORD || '8969',
  trustServerCertificate: true,
  encrypt: false,
};

/**
 * SQL Güvenlik Denetçisi:
 * Sorgu metninde veri değiştirme, silme veya çalıştırma komutları varsa anında işlemi engeller.
 */
function assertReadOnlyQuery(queryStr: string): void {
  const forbiddenKeywords = [
    /\binsert\b/i,
    /\bupdate\b/i,
    /\bdelete\b/i,
    /\bdrop\b/i,
    /\balter\b/i,
    /\bcreate\b/i,
    /\btruncate\b/i,
    /\bexec\b/i,
    /\bexecute\b/i,
    /\bgrant\b/i,
    /\brevoke\b/i,
    /\bmerge\b/i,
    /\bbackup\b/i,
    /\brestore\b/i,
    /\bshutdown\b/i,
    /\bxp_\w+/i,
    /\bsp_\w+/i,
  ];

  const trimmed = queryStr.trim();
  if (!trimmed.toLowerCase().startsWith('select')) {
    throw new Error('GÜVENLİK ENGELİ: Bu servis yalnızca "SELECT" sorgularına izin verir.');
  }

  for (const pattern of forbiddenKeywords) {
    if (pattern.test(queryStr)) {
      throw new Error(`GÜVENLİK ENGELİ: Güvensiz anahtar kelime (${pattern.source}) tespit edildi. Bu servis kesinlikle sadece veri okuma (read-only) yapabilir.`);
    }
  }
}

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export async function getMssqlPool(customConfig?: Partial<MssqlConfig>): Promise<sql.ConnectionPool> {
  const finalConfig = { ...DEFAULT_CONFIG, ...customConfig };

  const sqlConfig: sql.config = {
    user: finalConfig.user,
    password: finalConfig.password,
    server: finalConfig.server,
    port: finalConfig.port || 1433,
    database: finalConfig.database,
    options: {
      encrypt: finalConfig.encrypt,
      trustServerCertificate: finalConfig.trustServerCertificate,
      connectTimeout: 8000,
      requestTimeout: 15000,
      readOnlyIntent: true,
    },
    pool: {
      max: 5,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };

  if (!poolPromise || customConfig) {
    poolPromise = new sql.ConnectionPool(sqlConfig).connect();
  }

  return poolPromise;
}

/**
 * Tek bir Model Kodunun (ItemCode) maliyetini çeker
 * SQL: SELECT TOP 1 ItemCode AS ModelKodu, Price AS Maliyet, CurrencyCode AS ParaBirimi FROM prItemBasePrice WHERE ItemCode = @ModelKodu AND BasePriceCode = 1
 */
export async function fetchItemCostByModelCodeFromMssql(modelCode: string): Promise<ItemCostResult | null> {
  if (!modelCode || typeof modelCode !== 'string') return null;

  const pool = await getMssqlPool();
  const queryStr = `
    SELECT TOP 1
      ItemCode AS ModelKodu, 
      Price AS Maliyet, 
      CurrencyCode AS ParaBirimi 
    FROM prItemBasePrice 
    WHERE ItemCode = @ModelKodu AND BasePriceCode = 1
  `;

  assertReadOnlyQuery(queryStr);

  const request = pool.request();
  request.input('ModelKodu', sql.NVarChar(100), modelCode.trim());

  const result = await request.query(queryStr);
  if (result.recordset && result.recordset.length > 0) {
    const row = result.recordset[0];
    return {
      modelCode: String(row.ModelKodu).trim(),
      cost: parseFloat(row.Maliyet) || 0,
      currency: String(row.ParaBirimi || 'TRY').trim(),
    };
  }

  return null;
}

/**
 * Birden fazla Model Kodunun (ItemCode) maliyetini toplu (Batch) olarak çeker
 */
export async function fetchBatchCostsByModelCodesFromMssql(modelCodes: string[]): Promise<ItemCostResult[]> {
  if (!Array.isArray(modelCodes) || modelCodes.length === 0) return [];

  const cleanCodes = Array.from(new Set(modelCodes.map(c => String(c).trim()).filter(Boolean)));
  if (cleanCodes.length === 0) return [];

  const pool = await getMssqlPool();
  const request = pool.request();

  // Parameterized IN clause for safe execution
  const paramNames: string[] = [];
  cleanCodes.forEach((code, idx) => {
    const pName = `m_${idx}`;
    paramNames.push(`@${pName}`);
    request.input(pName, sql.NVarChar(100), code);
  });

  const queryStr = `
    SELECT 
      ItemCode AS ModelKodu, 
      Price AS Maliyet, 
      CurrencyCode AS ParaBirimi 
    FROM prItemBasePrice 
    WHERE ItemCode IN (${paramNames.join(', ')}) AND BasePriceCode = 1
  `;

  assertReadOnlyQuery(queryStr);

  const result = await request.query(queryStr);
  return (result.recordset || []).map((row: any) => ({
    modelCode: String(row.ModelKodu).trim(),
    cost: parseFloat(row.Maliyet) || 0,
    currency: String(row.ParaBirimi || 'TRY').trim(),
  }));
}

/**
 * MSSQL üzerindeki tüm aktif BasePriceCode = 1 maliyet kayıtlarını çeker
 */
export async function fetchAllActiveCostsFromMssql(): Promise<ItemCostResult[]> {
  const pool = await getMssqlPool();
  const queryStr = `
    SELECT 
      ItemCode AS ModelKodu, 
      Price AS Maliyet, 
      CurrencyCode AS ParaBirimi 
    FROM prItemBasePrice 
    WHERE BasePriceCode = 1
  `;

  assertReadOnlyQuery(queryStr);

  const result = await pool.request().query(queryStr);
  return (result.recordset || []).map((row: any) => ({
    modelCode: String(row.ModelKodu).trim(),
    cost: parseFloat(row.Maliyet) || 0,
    currency: String(row.ParaBirimi || 'TRY').trim(),
  }));
}

/**
 * MSSQL Bağlantısını ve Yetkisini Test Eder
 */
export async function testMssqlConnection(customConfig?: Partial<MssqlConfig>): Promise<{ success: boolean; message: string; sampleCount?: number; latencyMs?: number }> {
  const start = Date.now();
  try {
    const pool = await getMssqlPool(customConfig);
    const queryStr = 'SELECT COUNT(1) AS TotalCount FROM prItemBasePrice WHERE BasePriceCode = 1';
    assertReadOnlyQuery(queryStr);

    const result = await pool.request().query(queryStr);
    const latencyMs = Date.now() - start;
    const count = result.recordset[0]?.TotalCount || 0;

    return {
      success: true,
      message: `MSSQL sunucusuna başarıyla bağlanıldı. prItemBasePrice tablosunda ${count} adet Model Kodu (ItemCode) maliyet kaydı bulundu. (${latencyMs}ms)`,
      sampleCount: count,
      latencyMs,
    };
  } catch (error: any) {
    const latencyMs = Date.now() - start;
    return {
      success: false,
      message: `MSSQL Bağlantı Hatası: ${error.message || error}`,
      latencyMs,
    };
  }
}
