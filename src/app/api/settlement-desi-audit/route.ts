import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const audits = await query(`
      SELECT 
        id, order_number as "orderNumber", package_number as "packageNumber",
        product_title as "productTitle", carrier_name as "carrierName",
        declared_desi as "declaredDesi", billed_desi as "billedDesi",
        desi_diff as "desiDiff", declared_cost as "declaredCost",
        billed_cost as "billedCost", overcharge_amount as "overchargeAmount",
        dispute_status as "disputeStatus", dispute_notes as "disputeNotes",
        TO_CHAR(invoice_date, 'YYYY-MM-DD') as "invoiceDate"
      FROM shipment_desi_audits
      ORDER BY invoice_date DESC, overcharge_amount DESC
    `);

    const settlements = await query(`
      SELECT 
        id, period_name as "periodName", gross_sales as "grossSales",
        commission_fee as "commissionFee", shipping_fee as "shippingFee",
        service_fee as "serviceFee", withholding_tax as "withholdingTax",
        penalty_fee as "penaltyFee", early_payout_fee as "earlyPayoutFee",
        net_payout as "netPayout", TO_CHAR(settlement_date, 'YYYY-MM-DD') as "settlementDate"
      FROM settlement_deductions
      ORDER BY settlement_date DESC
    `);

    // KPI Summary
    let totalOvercharge = 0;
    let overchargedCount = 0;
    let pendingDisputeAmount = 0;
    let totalDesiDiff = 0;

    for (const a of audits) {
      const oc = parseFloat(a.overchargeAmount) || 0;
      if (oc > 0) {
        totalOvercharge += oc;
        overchargedCount++;
        totalDesiDiff += parseFloat(a.desiDiff) || 0;
        if (a.disputeStatus === 'pending') {
          pendingDisputeAmount += oc;
        }
      }
    }

    const avgDesiDiff = overchargedCount > 0 ? Math.round((totalDesiDiff / overchargedCount) * 10) / 10 : 0;

    return NextResponse.json({
      audits,
      settlements,
      summary: {
        totalOvercharge: Math.round(totalOvercharge * 100) / 100,
        overchargedCount,
        pendingDisputeAmount: Math.round(pendingDisputeAmount * 100) / 100,
        avgDesiDiff,
      }
    });
  } catch (error: any) {
    console.error('Audit fetch error:', error);
    return NextResponse.json({ error: 'Denetim verileri çekilemedi.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { id, disputeStatus, disputeNotes } = await request.json();
    if (!id || !disputeStatus) {
      return NextResponse.json({ error: 'Eksik parametre.' }, { status: 400 });
    }

    await query(`
      UPDATE shipment_desi_audits
      SET dispute_status = $1, dispute_notes = $2, updated_at = now()
      WHERE id = $3
    `, [disputeStatus, disputeNotes || '', id]);

    return NextResponse.json({ success: true, message: 'İtiraz durumu güncellendi.' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Güncellenemedi.' }, { status: 500 });
  }
}
