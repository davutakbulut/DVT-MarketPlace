export type VatRate = 0 | 1 | 10 | 20;

export interface ReversePricingInput {
  cogs: number; // Cost of goods sold (KDV Dahil)
  costVatRate: VatRate;
  saleVatRate: VatRate;
  desi: number;
  shippingFee: number; // Carrier fee for Desi (KDV Dahil)
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
  shippingFee: number;
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
  serviceFeeShare: number;
  withholdingTax: number;
  netVatPayable: number;
  totalCost: number;
  netProfit: number;
  profitMarginPercent: number;
  profitMarkupPercent: number;
}
