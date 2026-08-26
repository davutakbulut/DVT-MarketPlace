/**
 * Trendyol Marketplace API Client
 * High-performance HTTP client with Basic Authentication, Exponential Backoff, Rate Limiting & Health Checks
 */

import {
  TrendyolApiConfig,
  TrendyolProductsResponse,
  TrendyolProductFilterParams,
  TrendyolPriceAndInventoryPayload,
  TrendyolBatchRequestResponse,
  TrendyolBatchRequestStatusResponse,
  TrendyolOrdersResponse,
  TrendyolOrderFilterParams,
  TrendyolClaimsResponse,
  TrendyolSettlementsResponse,
  TrendyolConnectionTestResult,
} from './types';

export class TrendyolClient {
  private supplierId: string;
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;
  private timeoutMs: number;

  constructor(config: TrendyolApiConfig) {
    if (!config.supplierId) {
      throw new Error('Trendyol Supplier ID zorunludur.');
    }
    this.supplierId = config.supplierId.trim();
    this.apiKey = (config.apiKey || '').trim();
    this.apiSecret = (config.apiSecret || '').trim();
    this.baseUrl = (config.baseUrl || 'https://apigw.trendyol.com').replace(/\/$/, '');
    this.timeoutMs = config.timeoutMs || 25000;
  }

  /**
   * Generates standard Trendyol Basic Authorization Header
   */
  private getAuthHeader(): string {
    const raw = `${this.apiKey}:${this.apiSecret}`;
    const base64 = Buffer.from(raw).toString('base64');
    return `Basic ${base64}`;
  }

  /**
   * Internal robust fetch with retry and exponential backoff
   */
  private async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: any;
      queryParams?: Record<string, string | number | boolean | undefined>;
      retries?: number;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, queryParams, retries = 3 } = options;

    let url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    if (queryParams) {
      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const headers: Record<string, string> = {
      'Authorization': this.getAuthHeader(),
      'User-Agent': `${this.supplierId} - SelfIntegration`,
      'Accept': 'application/json',
    };

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    let lastError: any = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
          cache: 'no-store',
        });

        clearTimeout(timeoutId);

        // Success (200 - 299)
        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            return (await response.json()) as T;
          }
          const text = await response.text();
          return (text ? JSON.parse(text) : {}) as T;
        }

        // Rate Limit (429) -> Exponential backoff and retry
        if (response.status === 429 && attempt < retries) {
          const retryAfterSec = parseInt(response.headers.get('retry-after') || '2', 10);
          const waitTime = Math.max(retryAfterSec * 1000, attempt * 1500);
          console.warn(`[TrendyolClient] 429 Rate Limit. Attempt ${attempt}/${retries}. Retrying in ${waitTime}ms...`);
          await new Promise((res) => setTimeout(res, waitTime));
          continue;
        }

        // Server Error (500, 502, 503, 504) -> Retry
        if (response.status >= 500 && attempt < retries) {
          const waitTime = attempt * 1000;
          console.warn(`[TrendyolClient] Server ${response.status}. Attempt ${attempt}/${retries}. Retrying in ${waitTime}ms...`);
          await new Promise((res) => setTimeout(res, waitTime));
          continue;
        }

        // Client Errors (401 Unauthorized, 403 Forbidden, 400 Bad Request, 404 Not Found)
        let errorDetails = '';
        try {
          const errJson = await response.json();
          if (errJson.errors && Array.isArray(errJson.errors)) {
            errorDetails = errJson.errors.map((e: any) => e.message || e.key || JSON.stringify(e)).join('; ');
          } else if (errJson.message) {
            errorDetails = errJson.message;
          } else {
            errorDetails = JSON.stringify(errJson);
          }
        } catch {
          errorDetails = await response.text().catch(() => 'Bilinmeyen yanıt gövdesi');
        }

        let userFriendlyMsg = `Trendyol API Hatası (${response.status}): ${errorDetails}`;
        if (response.status === 401) {
          userFriendlyMsg = `Trendyol Yetkilendirme Hatası (401): API Key veya API Secret geçersiz. Lütfen mağaza ayarlarınızı kontrol edin.`;
        } else if (response.status === 403) {
          userFriendlyMsg = `Trendyol Erişim Engeli (403): Satıcı ID (${this.supplierId}) için bu endpoint'e erişim izni yok.`;
        } else if (response.status === 404) {
          userFriendlyMsg = `Trendyol Kaynak Bulunamadı (404): İstenen veri veya endpoint mevcut değil.`;
        }

        const error = new Error(userFriendlyMsg);
        (error as any).statusCode = response.status;
        (error as any).rawDetails = errorDetails;
        throw error;
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err;
        if (err.name === 'AbortError') {
          lastError = new Error(`Trendyol API zaman aşımına uğradı (${this.timeoutMs}ms). Sunucu yanıt vermedi.`);
        }
        if (attempt === retries) {
          break;
        }
      }
    }

    throw lastError || new Error('Trendyol API çağrısı başarısız oldu.');
  }

  // ==========================================
  // PUBLIC API ENDPOINTS
  // ==========================================

  /**
   * 1. Test Connection / Health Check
   * Calls the product list API with limit 1 to verify credentials and response latency.
   */
  public async testConnection(): Promise<TrendyolConnectionTestResult> {
    const startTime = Date.now();
    try {
      // Calling GET /suppliers/{supplierId}/products?size=1
      const res = await this.getProducts({ size: 1, page: 0 });
      const latencyMs = Date.now() - startTime;

      return {
        success: true,
        supplierId: this.supplierId,
        message: `Trendyol API bağlantısı başarılı! (${latencyMs}ms)`,
        productCount: res?.totalElements || 0,
        statusCode: 200,
        latencyMs,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      return {
        success: false,
        supplierId: this.supplierId,
        message: err.message || 'Trendyol API bağlantısı kurulamadı.',
        statusCode: err.statusCode || 500,
        latencyMs,
        error: err.rawDetails || err.message,
      };
    }
  }

  /**
   * 2. Get Products (Ürün Kataloğu Çekme)
   * GET /suppliers/{supplierId}/products
   */
  public async getProducts(params: TrendyolProductFilterParams = {}): Promise<TrendyolProductsResponse> {
    return this.request<TrendyolProductsResponse>(`/suppliers/${this.supplierId}/products`, {
      method: 'GET',
      queryParams: {
        approved: params.approved,
        barcode: params.barcode,
        startDate: params.startDate,
        endDate: params.endDate,
        page: params.page ?? 0,
        size: params.size ?? 50,
        dateQueryType: params.dateQueryType,
        onSale: params.onSale,
        rejected: params.rejected,
        brandId: params.brandId,
      },
    });
  }

  /**
   * 3. Update Price & Inventory (Fiyat & Stok Güncelleme - Çift Yönlü Writeback)
   * POST /suppliers/{supplierId}/v2/products/price-and-inventory
   */
  public async updatePriceAndInventory(
    payload: TrendyolPriceAndInventoryPayload
  ): Promise<TrendyolBatchRequestResponse> {
    if (!payload.items || payload.items.length === 0) {
      throw new Error('Güncellenecek ürün listesi boş olamaz.');
    }
    return this.request<TrendyolBatchRequestResponse>(
      `/suppliers/${this.supplierId}/v2/products/price-and-inventory`,
      {
        method: 'POST',
        body: payload,
      }
    );
  }

  /**
   * 4. Get Batch Request Status (Toplu Fiyat/Stok İşlem Durumu Kontrolü)
   * GET /suppliers/{supplierId}/products/batch-requests/{batchRequestId}
   */
  public async getBatchRequestResult(
    batchRequestId: string
  ): Promise<TrendyolBatchRequestStatusResponse> {
    return this.request<TrendyolBatchRequestStatusResponse>(
      `/suppliers/${this.supplierId}/products/batch-requests/${batchRequestId}`,
      {
        method: 'GET',
      }
    );
  }

  /**
   * 5. Get Orders (Sipariş Paketleri Çekme)
   * GET /suppliers/{supplierId}/orders
   */
  public async getOrders(params: TrendyolOrderFilterParams = {}): Promise<TrendyolOrdersResponse> {
    return this.request<TrendyolOrdersResponse>(`/suppliers/${this.supplierId}/orders`, {
      method: 'GET',
      queryParams: {
        startDate: params.startDate,
        endDate: params.endDate,
        page: params.page ?? 0,
        size: params.size ?? 50,
        orderNumber: params.orderNumber,
        status: params.status,
        orderByField: params.orderByField || 'PackageLastModifiedDate',
        orderByDirection: params.orderByDirection || 'DESC',
        shipmentPackageIds: params.shipmentPackageIds?.join(','),
      },
    });
  }

  /**
   * 6. Get Claims (İade & İptal Talepleri Çekme)
   * GET /suppliers/{supplierId}/claims
   */
  public async getClaims(params: {
    page?: number;
    size?: number;
    claimDateType?: string;
    startDate?: number;
    endDate?: number;
  } = {}): Promise<TrendyolClaimsResponse> {
    return this.request<TrendyolClaimsResponse>(`/suppliers/${this.supplierId}/claims`, {
      method: 'GET',
      queryParams: {
        page: params.page ?? 0,
        size: params.size ?? 50,
        claimDateType: params.claimDateType || 'CREATED_DATE',
        startDate: params.startDate,
        endDate: params.endDate,
      },
    });
  }

  /**
   * 7. Get Settlements & Other Financials (Finansal Ekstre & Mutabakat)
   * GET /suppliers/{supplierId}/settlements/otherfinancials
   */
  public async getSettlements(params: {
    startDate?: number;
    endDate?: number;
    page?: number;
    size?: number;
    transactionType?: string;
  } = {}): Promise<TrendyolSettlementsResponse> {
    return this.request<TrendyolSettlementsResponse>(
      `/suppliers/${this.supplierId}/settlements/otherfinancials`,
      {
        method: 'GET',
        queryParams: {
          startDate: params.startDate,
          endDate: params.endDate,
          page: params.page ?? 0,
          size: params.size ?? 100,
          transactionType: params.transactionType,
        },
      }
    );
  }
}
