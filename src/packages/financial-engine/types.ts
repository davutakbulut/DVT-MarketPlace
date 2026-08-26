export type VatRate = 0 | 1 | 10 | 20;

export interface CargoBaremInput {
  packetAmountExVat: number; // Sepet / Paket Tutarı (KDV Hariç)
  carrier: 'Aras' | 'DHL eCommerce' | 'Kolay Gelsin' | 'PTT' | 'Sürat' | 'TEX' | 'YK' | string;
  desi?: number;
  isFastDeliveryCompliant?: boolean; // 1 gün termin / Hızlı Teslimat başarılı teslimat
  customStandardPrice?: number; // Desi tarifesi için standart tutar
}

export interface CargoBaremResult {
  appliedTier: '0_199' | '200_349' | 'standard_desi';
  tierLabel: string;
  isDiscounted: boolean;
  shippingFeeExVat: number;
  shippingFeeIncVat: number;
  baremSupportSaving: number; // Barem desteği sayesinde kurtarılan para
  carrier: string;
}

export interface ReversePricingInput {
  cogs: number; // Cost of goods sold (KDV Dahil)
  costVatRate: VatRate;
  saleVatRate: VatRate;
  desi: number;
  shippingFee?: number; // If manual override provided
  carrier?: string; // e.g. 'TEX', 'Aras'
  isFastDeliveryCompliant?: boolean;
  commissionRate: number; // % (KDV Hariç, e.g. 18.0)
  serviceFee?: number; // Default 8.49 TL (KDV Dahil)
  withholdingRate?: number; // Default 1.0 for 1% Stopaj
  extraCost?: number; // Packaging / extra costs (KDV Dahil)
  targetMode: 'margin_percent' | 'cash_amount' | 'markup_percent';
  targetValue: number; // e.g. 20.0 for 20% margin, or 50.0 for 50 TL
}

export interface ReversePricingResult {
  targetSalePrice: number;
  netProfit: number;
  profitMarginPercent: number;
  profitMarkupPercent: number;
  breakdown: {
    cogs: number;
    shippingFee: number;
    baremSaving: number;
    commissionAmount: number;
    serviceFee: number;
    withholdingTax: number;
    netVatPayable: number;
    extraCost: number;
    totalDeductions: number;
  };
}

export interface OrderItemProfitInput {
  unitSalePrice: number;
  unitCostPrice: number;
  quantity: number;
  saleVatRate: VatRate;
  costVatRate: VatRate;
  commissionRate: number;
  shippingFee?: number;
  carrier?: string;
  isFastDeliveryCompliant?: boolean;
  serviceFeeShare: number;
  withholdingRate?: number;
  extraCost?: number;
  adSpendShare?: number;
  penaltyShare?: number;
  earlyPayoutShare?: number;
}

export interface OrderItemProfitResult {
  grossRevenue: number;
  cogs: number;
  commissionAmount: number;
  shippingFee: number;
  baremSaving: number;
  serviceFeeShare: number;
  withholdingTax: number;
  netVatPayable: number;
  totalCost: number;
  netProfit: number;
  profitMarginPercent: number;
  profitMarkupPercent: number;
}
