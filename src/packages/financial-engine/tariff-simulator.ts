import { OrderProfitEngine } from './order-profit';
import { VatRate } from './types';

export class TariffSimulator {
  public static simulateTier(params: {
    unitCostPrice: number;
    vatRate: VatRate;
    shippingFee: number;
    serviceFee: number;
    currentPrice: number;
    currentCommissionRate: number;
    simulatedPrice: number;
    simulatedCommissionRate: number;
  }) {
    const current = OrderProfitEngine.calculate({
      unitSalePrice: params.currentPrice,
      unitCostPrice: params.unitCostPrice,
      quantity: 1,
      saleVatRate: params.vatRate,
      costVatRate: params.vatRate,
      commissionRate: params.currentCommissionRate,
      shippingFee: params.shippingFee,
      serviceFeeShare: params.serviceFee,
    });

    const simulated = OrderProfitEngine.calculate({
      unitSalePrice: params.simulatedPrice,
      unitCostPrice: params.unitCostPrice,
      quantity: 1,
      saleVatRate: params.vatRate,
      costVatRate: params.vatRate,
      commissionRate: params.simulatedCommissionRate,
      shippingFee: params.shippingFee,
      serviceFeeShare: params.serviceFee,
    });

    const profitDifference = Math.round((simulated.netProfit - current.netProfit) * 100) / 100;
    const isAdvantageous = profitDifference > 0;

    return {
      currentProfit: current.netProfit,
      currentMargin: current.profitMarginPercent,
      simulatedProfit: simulated.netProfit,
      simulatedMargin: simulated.profitMarginPercent,
      profitDifference,
      isAdvantageous,
      badgeText: `${profitDifference >= 0 ? '+' : ''}₺${profitDifference.toFixed(2)} (${simulated.profitMarginPercent.toFixed(1)}%)`,
    };
  }
}
