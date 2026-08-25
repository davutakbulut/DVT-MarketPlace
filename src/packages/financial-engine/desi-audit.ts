export class DesiAuditEngine {
  public static calculateDesiOvercharge(params: {
    billedDesi: number;
    catalogDesi: number;
    billedShippingFee: number;
    expectedShippingFee: number;
  }) {
    const desiDifference = Math.max(0, params.billedDesi - params.catalogDesi);
    const overchargeAmount = Math.max(0, params.billedShippingFee - params.expectedShippingFee);
    const hasOvercharge = overchargeAmount > 0;

    return {
      desiDifference,
      overchargeAmount: Math.round(overchargeAmount * 100) / 100,
      hasOvercharge,
    };
  }
}
