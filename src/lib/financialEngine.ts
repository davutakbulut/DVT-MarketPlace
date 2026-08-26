/**
 * DVT-MarketPlace Centralized Financial Engine
 * Single Source of Truth for Revenue, COGS, Expenses, and Net Profit
 */

export interface FinancialBreakdown {
  invoicedRevenue: number;
  grossRevenue: number;
  cogs: number;
  commission: number;
  shippingCost: number;
  serviceFee: number;
  stopaj: number;
  netVat: number;
  extraOperationCost: number;
  earlyPayoutCost: number;
  adSpendCost: number;
  totalExpenses: number;
  netProfit: number;
  marginPercent: number;
}

/**
 * Pure TypeScript Financial Calculator
 */
export function calculateOrderFinancials(params: {
  paidAmount: number;
  grossAmount?: number;
  cogs: number;
  commission: number;
  shippingCost: number;
  serviceFee?: number;
  stopaj?: number;
  netVat?: number;
  extraOperationRate?: number;
  earlyPayoutRate?: number;
  adSpendCost?: number;
}): FinancialBreakdown {
  const invoicedRevenue = Number(params.paidAmount) || 0;
  const grossRevenue = Number(params.grossAmount ?? params.paidAmount) || invoicedRevenue;
  const cogs = Number(params.cogs) || 0;
  const commission = Number(params.commission) || 0;
  const shippingCost = Number(params.shippingCost) || 0;
  const serviceFee = Number(params.serviceFee ?? 13.19) || 0;
  const stopaj = Number(params.stopaj ?? (invoicedRevenue * 0.01)) || 0;
  const netVat = Number(params.netVat) || 0;
  
  const extraOpRate = Number(params.extraOperationRate ?? 6.00) / 100.0;
  const extraOperationCost = grossRevenue * extraOpRate;

  const earlyPayoutRate = Number(params.earlyPayoutRate ?? 0) / 100.0;
  const earlyPayoutCost = grossRevenue * earlyPayoutRate;

  const adSpendCost = Number(params.adSpendCost ?? 0) || 0;

  const totalExpenses = 
    cogs + 
    commission + 
    shippingCost + 
    serviceFee + 
    stopaj + 
    netVat + 
    extraOperationCost + 
    earlyPayoutCost + 
    adSpendCost;

  const netProfit = invoicedRevenue - totalExpenses;
  const marginPercent = invoicedRevenue > 0 ? (netProfit / invoicedRevenue) * 100 : 0;

  return {
    invoicedRevenue,
    grossRevenue,
    cogs,
    commission,
    shippingCost,
    serviceFee,
    stopaj,
    netVat,
    extraOperationCost,
    earlyPayoutCost,
    adSpendCost,
    totalExpenses,
    netProfit,
    marginPercent: Math.round(marginPercent * 100) / 100,
  };
}

/**
 * SQL Expression for Dynamic Order Net Profit
 */
export function getOrderNetProfitSQL(pExtraOpIndex: number): string {
  return `(
    COALESCE(o.paid_amount, 0) - (
      COALESCE(o.total_cost, 0) + 
      COALESCE(o.total_commission, 0) + 
      COALESCE(o.total_shipping_cost, 0) + 
      COALESCE(o.service_fee, 13.19) + 
      COALESCE(o.withholding_tax, 0) + 
      COALESCE(o.net_vat, 0) + 
      (COALESCE(o.gross_amount, o.paid_amount, 0) * $${pExtraOpIndex})
    )
  )`;
}

/**
 * SQL Expression for Dynamic Order Total Expenses
 */
export function getOrderTotalExpensesSQL(pExtraOpIndex: number): string {
  return `(
    COALESCE(o.total_cost, 0) + 
    COALESCE(o.total_commission, 0) + 
    COALESCE(o.total_shipping_cost, 0) + 
    COALESCE(o.service_fee, 13.19) + 
    COALESCE(o.withholding_tax, 0) + 
    COALESCE(o.net_vat, 0) + 
    (COALESCE(o.gross_amount, o.paid_amount, 0) * $${pExtraOpIndex})
  )`;
}

/**
 * SQL Expression for Order Item Dynamic Net Profit
 */
export function getOrderItemNetProfitSQL(pExtraOpIndex: number): string {
  return `(
    (COALESCE(oi.unit_sale_price, 0) * COALESCE(oi.quantity, 1)) - (
      (COALESCE(oi.unit_cost_price, 0) * COALESCE(oi.quantity, 1)) + 
      COALESCE(oi.commission_amount, 0) + 
      COALESCE(oi.shipping_amount, 0) + 
      COALESCE(oi.service_fee_share, 0) + 
      ((COALESCE(oi.unit_sale_price, 0) * COALESCE(oi.quantity, 1)) * $${pExtraOpIndex})
    )
  )`;
}
