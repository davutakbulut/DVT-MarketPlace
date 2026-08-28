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

export interface TrendyolProductVariant {
  variantId?: number;
  barcode: string;
  stockCode?: string;
  productUrl?: string;
  commission?: number;
  vatRate?: number;
  dimensionalWeight?: number;
  onSale?: boolean;
  locked?: boolean;
  archived?: boolean;
  blacklisted?: boolean;
  blacklistReason?: string;
  origin?: string;
  price?: {
    salePrice?: number;
    listPrice?: number;
    priceSeenByCustomer?: number;
  };
  stock?: {
    quantity?: number;
    lastModifiedDate?: number;
  };
  deliveryOptions?: {
    deliveryDuration?: number;
    isRushDelivery?: boolean;
    fastDeliveryOptions?: Array<{ deliveryOptionType?: string }>;
  };
}

export interface TrendyolProductItem {
  id?: string;
  contentId?: number;
  barcode?: string;
  title?: string;
  productMainId?: string;
  brandId?: number;
  brand?: string | { id?: number; name?: string };
  categoryId?: number;
  category?: { id?: number; name?: string };
  categoryName?: string;
  quantity?: number;
  stockCode?: string;
  dimensionalWeight?: number; // Desi
  description?: string;
  listPrice?: number;
  salePrice?: number;
  vatRate?: number;
  images?: Array<{ url: string }>;
  attributes?: Array<{
    attributeId: number;
    attributeName?: string;
    attributeValueId?: number;
    attributeValue?: string;
    customAttributeValue?: string;
  }>;
  platformListingId?: string;
  onSale?: boolean;
  approved?: boolean;
  archived?: boolean;
  locked?: boolean;
  rejected?: boolean;
  blacklisted?: boolean;
  hasHtmlContent?: boolean;
  lastPriceChangeDate?: number;
  lastStockChangeDate?: number;
  variants?: TrendyolProductVariant[];
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
  lineId?: number;
  productCode?: number;
  contentId?: number;
  productName: string;
  sku?: string;
  stockCode?: string;
  barcode: string;
  quantity: number;
  price: number; // Unit Sale Price (Net)
  lineUnitPrice?: number;
  amount: number; // Total amount for this line
  lineGrossAmount?: number;
  discount?: number;
  lineTotalDiscount?: number;
  tyDiscount?: number; // Trendyol funded discount
  lineTyDiscount?: number;
  sellerDiscount?: number; // Merchant funded discount
  lineSellerDiscount?: number;
  discountDetails?: Array<{
    lineItemPrice: number;
    lineItemSellerDiscount?: number;
    lineItemTyDiscount?: number;
    lineItemDiscount?: number;
  }>;
  vatBaseAmount?: number;
  vatRate?: number;
  commission?: number;
  commissionRate?: number;
  currencyCode: string;
  orderItemStatus?: string;
  orderLineItemStatusName?: string;
  salesCampaignId?: number;
  merchantSku?: string;
  merchantId?: number;
  sellerId?: number;
  productSize?: string;
  productColor?: string;
  productOrigin?: string;
  productCategoryId?: number;
  businessUnit?: string;
  cancelledBy?: string;
  cancelReason?: string;
  cancelReasonCode?: number;
  defectiveClaimListingInsight?: string;
  fastDeliveryOptions?: Array<{ type: string }>;
}

export interface TrendyolOrderPackage {
  id: number;
  shipmentPackageId?: number;
  orderNumber: string;
  orderCountryCode?: string;
  grossAmount?: number;
  packageGrossAmount?: number;
  totalDiscount?: number;
  packageSellerDiscount?: number;
  totalTyDiscount?: number;
  packageTyDiscount?: number;
  packageTotalDiscount?: number;
  totalPrice?: number;
  packageTotalPrice?: number;
  discountDisplays?: Array<{
    displayName: string;
    discountAmount: number;
  }>;
  taxNumber?: string;
  invoiceAddress: TrendyolAddress;
  shipmentAddress: TrendyolAddress;
  customerFirstName: string;
  customerLastName: string;
  customerEmail?: string;
  customerId: number;
  supplierId?: number;
  channelId?: number;
  cargoTrackingNumber?: string | number;
  cargoTrackingLink?: string;
  cargoSenderNumber?: string;
  cargoProviderName: string;
  cargoDeci?: number;
  lines: TrendyolOrderLine[];
  orderDate: number;
  identityNumber?: string;
  tcIdentityNumber?: string;
  currencyCode: string;
  packageHistories?: Array<{
    createdDate: number;
    status: string;
  }>;
  shipmentPackageStatus: 'Created' | 'Picking' | 'Invoiced' | 'Shipped' | 'Delivered' | 'UnDelivered' | 'Returned' | 'Cancelled' | 'UnDeliveredAndReturned' | 'ReadyToShip' | 'AtCollectionPoint' | 'UnPacked' | 'UnSupplied' | string;
  status: string;
  deliveryType?: string;
  timeSlotId?: number;
  estimatedDeliveryStartDate?: number;
  estimatedDeliveryEndDate?: number;
  deliveryAddressType?: string;
  agreedDeliveryDate?: number;
  fastDelivery?: boolean;
  fastDeliveryType?: 'TodayDelivery' | 'SameDayShipping' | 'FastDelivery' | string;
  originShipmentDate?: number;
  lastModifiedDate?: number;
  commercial?: boolean;
  micro?: boolean; // Micro-export flag
  is4P?: boolean; // Trendyol Yurt Dışı Aracılığı
  whoPays?: number; // 1 if seller agreement
  giftBoxRequested?: boolean;
  containsDangerousProduct?: boolean;
  isCod?: boolean;
  createdBy?: 'order-creation' | 'split' | 'cancel' | 'transfer' | string;
  originPackageIds?: string[] | null;
  hsCode?: string;
  etgbNo?: string;
  etgbDate?: number;
  shipmentNumber?: number | string;
  invoiceStatus?: 'NotInvoiced' | 'Received' | 'Rejected' | 'Invoiced' | string;
  invoiceNumber?: string;
  invoiceLink?: string;
  invoiceRejectedReasonKeys?: string[];
  '3pByTrendyol'?: boolean;
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
  status?: 'Created' | 'Picking' | 'Invoiced' | 'Shipped' | 'Delivered' | 'UnDelivered' | 'Returned' | 'Cancelled' | 'AtCollectionPoint' | 'UnPacked' | 'UnSupplied' | string;
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
