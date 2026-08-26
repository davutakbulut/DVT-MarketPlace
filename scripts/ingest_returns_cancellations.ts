import { query } from '../src/lib/db';
import * as fs from 'fs';

interface OrderData {
  orderNumber: string;
  orderDate: string;
  returnDate?: string;
  cancellationDate?: string;
  customerName: string;
  productTitle: string;
  quantity: number;
  barcode: string;
  sku: string;
  grossAmount: number;
  paidAmount: number;
  trackingCode: string;
  desi: number;
  carrierName: string;
  returnReason?: string;
  cancellationReason?: string;
  status: string;
  type: 'return' | 'cancellation';
}

function parseTurkishDate(dateStr?: string): Date {
  if (!dateStr) return new Date();

  // Format 1: '01.06.2026 16:01'
  const dotMatch = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?/);
  if (dotMatch) {
    const day = parseInt(dotMatch[1]);
    const month = parseInt(dotMatch[2]) - 1;
    const year = parseInt(dotMatch[3]);
    const hour = parseInt(dotMatch[4] || '12');
    const min = parseInt(dotMatch[5] || '0');
    return new Date(year, month, day, hour, min);
  }

  // Format 2: '24 Ağustos 2026 10:16'
  const months: Record<string, number> = {
    'ocak': 0, 'şubat': 1, 'mart': 2, 'nisan': 3, 'mayıs': 4, 'haziran': 5,
    'temmuz': 6, 'ağustos': 7, 'eylül': 8, 'ekim': 9, 'kasım': 10, 'aralık': 11
  };
  const textMatch = dateStr.match(/(\d{1,2})\s+([a-zA-ZçğıöşüÇĞİÖŞÜ]+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{1,2}))?/i);
  if (textMatch) {
    const day = parseInt(textMatch[1]);
    const monthName = textMatch[2].toLowerCase();
    const month = months[monthName] ?? 7;
    const year = parseInt(textMatch[3]);
    const hour = parseInt(textMatch[4] || '12');
    const min = parseInt(textMatch[5] || '0');
    return new Date(year, month, day, hour, min);
  }

  return new Date();
}

async function runIngestion() {
  console.log('🚀 Starting Ingestion of Returns & Cancellations into Supabase PostgreSQL...');

  // 1. Ensure Columns Exist in orders table
  await query(`
    ALTER TABLE orders 
    ADD COLUMN IF NOT EXISTS return_reason text,
    ADD COLUMN IF NOT EXISTS return_date timestamptz,
    ADD COLUMN IF NOT EXISTS return_status text,
    ADD COLUMN IF NOT EXISTS cancellation_reason text,
    ADD COLUMN IF NOT EXISTS cancellation_date timestamptz,
    ADD COLUMN IF NOT EXISTS refund_amount numeric(12,4) DEFAULT 0;
  `);

  // Get first store & company ID
  const storeRows = await query('SELECT id, company_id FROM stores LIMIT 1');
  const storeId = storeRows[0]?.id || '11111111-1111-1111-1111-111111111111';
  const companyId = storeRows[0]?.company_id || '11111111-1111-1111-1111-111111111111';

  // Read JSON
  const jsonPath = '/tmp/parsed_returns_and_cancellations.json';
  if (!fs.existsSync(jsonPath)) {
    throw new Error('Parsed json not found at ' + jsonPath);
  }
  const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const allOrders: OrderData[] = [...(raw.returns || []), ...(raw.cancellations || [])];

  console.log(`Processing ${allOrders.length} total orders (${raw.returns.length} returns, ${raw.cancellations.length} cancellations)...`);

  let mergedCount = 0;
  let insertedCount = 0;

  for (const item of allOrders) {
    if (!item.orderNumber) continue;

    const orderDate = parseTurkishDate(item.orderDate);
    const returnDate = item.returnDate ? parseTurkishDate(item.returnDate) : null;
    const cancellationDate = item.cancellationDate ? parseTurkishDate(item.cancellationDate) : null;

    // Check if order already exists in DB
    const existing = await query('SELECT id, status FROM orders WHERE marketplace_order_number = $1', [item.orderNumber]);

    if (existing.length > 0) {
      // Merge / Update status & reason
      const existingId = existing[0].id;
      await query(`
        UPDATE orders 
        SET status = $1,
            return_reason = COALESCE($2, return_reason),
            return_date = COALESCE($3, return_date),
            return_status = COALESCE($4, return_status),
            cancellation_reason = COALESCE($5, cancellation_reason),
            cancellation_date = COALESCE($6, cancellation_date),
            refund_amount = COALESCE($7, refund_amount),
            updated_at = now()
        WHERE id = $8
      `, [
        item.status,
        item.returnReason || null,
        returnDate,
        item.type === 'return' ? 'Onaylandı' : null,
        item.cancellationReason || null,
        cancellationDate,
        item.paidAmount || item.grossAmount,
        existingId
      ]);
      mergedCount++;
    } else {
      // Insert new order
      const pkgNumber = item.trackingCode || `PKG${item.orderNumber}`;
      const commission = Math.round(item.grossAmount * 0.1615 * 100) / 100;
      const shippingCost = item.type === 'return' ? 46.49 : 0.00;
      const serviceFee = item.type === 'return' ? 13.19 : 0.00;
      const totalCost = Math.round(item.grossAmount * 0.45 * 100) / 100;
      const withholding = Math.round(item.grossAmount * 0.01 * 100) / 100;
      const netProfit = item.type === 'return' 
        ? -(shippingCost + serviceFee) 
        : 0.00;

      const newOrder = await query(`
        INSERT INTO orders (
          company_id, store_id, marketplace_order_number, package_number,
          order_date, status, customer_name, customer_city, customer_district,
          carrier_name, tracking_code, gross_amount, discount_amount,
          paid_amount, total_cost, total_commission, total_shipping_cost, service_fee,
          withholding_tax, net_profit, profit_margin_percent, billed_desi, calculated_desi,
          return_reason, return_date, return_status, cancellation_reason, cancellation_date,
          refund_amount, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, 'İstanbul', 'Merkez',
          $8, $9, $10, 0,
          $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25,
          $26, now(), now()
        ) RETURNING id
      `, [
        companyId, storeId, item.orderNumber, pkgNumber,
        orderDate, item.status, item.customerName,
        item.carrierName, item.trackingCode, item.grossAmount,
        item.paidAmount, totalCost, commission, shippingCost, serviceFee,
        withholding, netProfit, item.type === 'return' ? -15.0 : 0.0, item.desi, item.desi,
        item.returnReason || null, returnDate, item.type === 'return' ? 'Onaylandı' : null,
        item.cancellationReason || null, cancellationDate, item.paidAmount,
      ]);

      const newOrderId = newOrder[0]?.id;
      if (newOrderId && item.productTitle) {
        // Insert order_items
        await query(`
          INSERT INTO order_items (
            order_id, title, barcode, sku, quantity, unit_sale_price,
            unit_cost_price, commission_rate, commission_amount,
            net_profit, status
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, 16.15, $8,
            $9, $10
          )
        `, [
          newOrderId, item.productTitle, item.barcode, item.sku, item.quantity,
          item.quantity > 0 ? (item.grossAmount / item.quantity) : item.grossAmount,
          item.quantity > 0 ? (totalCost / item.quantity) : totalCost,
          commission, netProfit, item.status
        ]);
      }
      insertedCount++;
    }
  }

  console.log(`\n🎉 Ingestion Complete!`);
  console.log(`- Merged with existing orders: ${mergedCount}`);
  console.log(`- Inserted new return/cancel orders: ${insertedCount}`);
  console.log(`- Total processed: ${mergedCount + insertedCount}`);
}

runIngestion().catch((err) => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
