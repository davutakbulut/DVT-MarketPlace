/**
 * Trendyol Marketplace API Type Definitions
 * Covers Products, Inventory, Orders, Claims/Returns, Settlements, and Batch Operations
 */

export interface TrendyolApiConfig {
  supplierId: string;
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
  timeoutMs?: number;
}

// ==========================================
// 1. PRODUCTS & INVENTORY TYPES
// ==========================================

export interface TrendyolProductAttribute {
  attributeId: number;
  attributeValueId?: number;
  customAttributeValue?: string;
}

export interface TrendyolProductImage {
  url: string;
}

export interface TrendyolProductItem {
  id?: string;
  barcode: string;
  title: string;
  productMainId?: string;
  brandId?: number;
  brand?: string;
  categoryId?: number;
  categoryName?: string;
  quantity: number;
  stockCode?: string;
  dimensionalWeight?: number; // Desi
  description?: string;
  listPrice: number;
  salePrice: number;
  vatRate: number;
  images?: TrendyolProductImage[];
  attributes?: TrendyolProductAttribute[];
  platformListingId?: string;
  onSale: boolean;
  approved: boolean;
  archived: boolean;
  locked: boolean;
  rejected: boolean;
  blacklisted: boolean;
  hasHtmlContent?: boolean;
  lastPriceChangeDate?: number;
  lastStockChangeDate?: number;
}

export interface TrendyolProductsResponse {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  content: TrendyolProductItem[];
}

export interface TrendyolProductFilterParams {
  approved?: boolean;
  barcode?: string;
  startDate?: number;
  endDate?: number;
  page?: number;
  size?: number;
  dateQueryType?: 'CREATED_DATE' | 'LAST_MODIFIED_DATE';
  onSale?: boolean;
  rejected?: boolean;
  brandId?: number;
}

export interface TrendyolPriceAndInventoryItem {
  barcode: string;
  quantity?: number;
  salePrice?: number;
  listPrice?: number;
}

export interface TrendyolPriceAndInventoryPayload {
  items: TrendyolPriceAndInventoryItem[];
}

export interface TrendyolBatchRequestResponse {
  batchRequestId: string;
}

export interface TrendyolBatchRequestStatusResponse {
  batchRequestId: string;
  items: Array<{
    requestItem: {
      barcode: string;
      quantity?: number;
      salePrice?: number;
      listPrice?: number;
    };
    status: 'SUCCESS' | 'FAILED';
    failureReasons?: string[];
  }>;
  status: 'SUCCESS' | 'FAILED' | 'PROCESSING';
  creationDate: number;
  lastModificationDate: number;
  sourceType: string;
  itemCount: number;
  failedItemCount: number;
  batchRequestType: string;
}

// ==========================================
// 2. ORDERS & SHIPPING TYPES
// ==========================================

export interface TrendyolAddress {
  id: number;
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  cityCode?: number;
  district: string;
  districtId?: number;
  postalCode?: string;
  countryCode?: string;
  neighborhoodId?: number;
  neighborhood?: string;
  phone?: string;
  fullAddress: string;
  fullName: string;
  taxNumber?: string;
  taxOffice?: string;
}

export interface TrendyolOrderLine {
  id: number;
  productCode?: number;
  productName: string;
  sku?: string;
  barcode: string;
  quantity: number;
  price: number; // Unit Sale Price
  amount: number; // Total amount for this line
  discount: number;
  tyDiscount: number; // Trendyol funded discount
  sellerDiscount: number; // Merchant funded discount
  vatBaseAmount: number;
  commissionRate?: number;
  currencyCode: string;
  orderItemStatus?: string;
  salesCampaignId?: number;
  merchantSku?: string;
  merchantId?: number;
}

export interface TrendyolOrderPackage {
  id: number;
  orderNumber: string;
  grossAmount: number;
  totalDiscount: number;
  totalPrice: number;
  taxNumber?: string;
  invoiceAddress: TrendyolAddress;
  shipmentAddress: TrendyolAddress;
  customerFirstName: string;
  customerLastName: string;
  customerEmail?: string;
  customerId: number;
  cargoTrackingNumber?: string;
  cargoTrackingLink?: string;
  cargoProviderName: string;
  lines: TrendyolOrderLine[];
  orderDate: number;
  tcIdentityNumber?: string;
  currencyCode: string;
  packageHistories?: Array<{
    createdDate: number;
    status: string;
  }>;
  shipmentPackageStatus: 'Created' | 'Picking' | 'Invoiced' | 'Shipped' | 'Delivered' | 'UnDelivered' | 'Returned' | 'Cancelled' | 'UnDeliveredAndReturned' | 'ReadyToShip' | string;
  status: string;
  deliveryType?: string;
  timeSlotId?: number;
  estimatedDeliveryStartDate?: number;
  estimatedDeliveryEndDate?: number;
  deliveryAddressType?: string;
  agreedDeliveryDate?: number;
  fastDelivery?: boolean;
  originShipmentDate?: number;
  commercial?: boolean;
  micro?: boolean; // Micro-export flag
  giftBoxRequested?: boolean;
}

export interface TrendyolOrdersResponse {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  content: TrendyolOrderPackage[];
}

export interface TrendyolOrderFilterParams {
  startDate?: number;
  endDate?: number;
  page?: number;
  size?: number;
  orderNumber?: string;
  status?: 'Created' | 'Picking' | 'Invoiced' | 'Shipped' | 'Delivered' | 'UnDelivered' | 'Returned' | 'Cancelled';
  orderByField?: 'PackageLastModifiedDate' | 'CreatedDate';
  orderByDirection?: 'ASC' | 'DESC';
  shipmentPackageIds?: number[];
}

// ==========================================
// 3. CLAIMS & RETURNS TYPES
// ==========================================

export interface TrendyolClaimItem {
  id: string;
  claimItemStatus: string;
  customerClaimItemReason: {
    id: number;
    name: string;
    code?: string;
  };
  orderItemId: number;
  barcode: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface TrendyolClaim {
  id: string;
  claimDate: number;
  claimStatus: 'Created' | 'Approved' | 'Rejected' | 'InReview' | 'WaitingInCargo' | 'Accepted';
  customerFirstName: string;
  customerLastName: string;
  orderNumber: string;
  orderDate: number;
  cargoTrackingNumber?: string;
  cargoProviderName?: string;
  items: TrendyolClaimItem[];
  rejectionReason?: string;
  rejectionDescription?: string;
}

export interface TrendyolClaimsResponse {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  content: TrendyolClaim[];
}

// ==========================================
// 4. SETTLEMENTS & FINANCE TYPES
// ==========================================

export interface TrendyolSettlementTransaction {
  id: string;
  transactionDate: number;
  barcode?: string;
  orderNumber?: string;
  transactionType: 'Sale' | 'Cancel' | 'Return' | 'Commission' | 'Cargo' | 'ServiceFee' | 'AdSpend' | 'Penalty' | 'EarlyPayment' | 'WithholdingTax' | 'WireTransfer';
  debt: number; // Borç (Gider/Kesinti)
  credit: number; // Alacak (Gelir/Hakediş)
  description?: string;
  commissionAmount?: number;
  commissionRate?: number;
  cargoAmount?: number;
  settlementAmount: number;
  paymentOrderId?: string;
}

export interface TrendyolSettlementsResponse {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  content: TrendyolSettlementTransaction[];
}

// ==========================================
// 5. TEST CONNECTION RESULT
// ==========================================

export interface TrendyolConnectionTestResult {
  success: boolean;
  supplierId: string;
  message: string;
  storeName?: string;
  productCount?: number;
  statusCode?: number;
  latencyMs?: number;
  error?: string;
}
