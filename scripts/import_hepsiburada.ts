import fs from 'fs';
import path from 'path';
import { query } from '../src/lib/db';

const COMPANY_ID = '11111111-1111-1111-1111-111111111111';
const HEPSIBURADA_STORE_ID = '62610a67-3f0f-4780-9afb-405e251f9640';
const TRENDYOL_STORE_ID = '22222222-2222-2222-2222-222222222221';

function parseTrFloat(val: any): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).trim().replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseOrderDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const trimmed = dateStr.trim();
  const parts = trimmed.split(' ');
  const datePart = parts[0];
  const timePart = parts[1] || '12:00:00';

  if (datePart.includes('-')) {
    const dParts = datePart.split('-');
    if (dParts[0].length === 2) {
      const day = parseInt(dParts[0], 10);
      const month = parseInt(dParts[1], 10) - 1;
      const year = parseInt(dParts[2], 10);
      const [hour, min, sec] = timePart.split(':').map(Number);
      return new Date(Date.UTC(year, month, day, hour || 0, min || 0, sec || 0));
    } else {
      return new Date(trimmed);
    }
  }
  return new Date();
}

function parseCSV(content: string, delimiter: string = ';'): string[][] {
  const lines = content.split(/\r?\n/);
  const results: string[][] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const row: string[] = [];
    let insideQuotes = false;
    let current = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === delimiter && !insideQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    results.push(row);
  }
  return results;
}

async function runImport() {
  console.log('🚀 Starting Hepsiburada Products and Orders Ingestion...');

  // 1. Schema & Tagging
  console.log('1️⃣ Updating Schema: Adding marketplace column & tagging Trendyol...');
  await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS marketplace VARCHAR(50) DEFAULT 'trendyol'`);
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS marketplace VARCHAR(50) DEFAULT 'trendyol'`);
  await query(`UPDATE orders SET marketplace = 'trendyol' WHERE store_id = $1`, [TRENDYOL_STORE_ID]);
  await query(`UPDATE products SET marketplace = 'trendyol' WHERE store_id = $1`, [TRENDYOL_STORE_ID]);

  // Load existing products for cost mapping
  const existingProducts = await query(`SELECT barcode, title, current_cost, vat_rate, commission_rate FROM products WHERE store_id = $1`, [TRENDYOL_STORE_ID]);
  const costByBarcode = new Map<string, number>();
  const costByTitle = new Map<string, number>();
  for (const p of existingProducts) {
    if (p.barcode && p.current_cost) costByBarcode.set(p.barcode.trim().toLowerCase(), parseFloat(p.current_cost));
    if (p.title && p.current_cost) costByTitle.set(p.title.trim().toLowerCase(), parseFloat(p.current_cost));
  }

  // 2. Locate Hepsiburada files directory
  const rootFiles = fs.readdirSync('.');
  const hbDirName = rootFiles.find(f => f.toLowerCase().includes('hepsiburada')) || 'hepsiburada-siparişler ve ürünler';
  console.log(`📁 Found Hepsiburada Directory: ${hbDirName}`);

  // 3. Import Hepsiburada Orders from CSVs
  const csvFiles = fs.readdirSync(hbDirName).filter(f => f.endsWith('.csv'));
  console.log(`2️⃣ Processing ${csvFiles.length} CSV order files...`);

  const ordersMap = new Map<string, {
    orderNumber: string;
    packageNumber: string;
    orderDate: Date;
    carrierName: string;
    customerName: string;
    customerCity: string;
    customerDistrict: string;
    customerEmail: string;
    trackingCode: string;
    status: string;
    items: any[];
  }>();

  for (const csvFile of csvFiles) {
    const filePath = path.join(hbDirName, csvFile);
    const content = fs.readFileSync(filePath, 'utf-8');
    const rows = parseCSV(content, ';');
    if (rows.length < 2) continue;

    const dataRows = rows.slice(1);
    for (const r of dataRows) {
      if (!r || r.length < 10) continue;
      const orderNumber = r[9]?.trim();
      const packageNumber = r[1]?.trim() || orderNumber;
      if (!orderNumber || orderNumber === 'Sipariş Numarası') continue;

      const rawStatus = r[34]?.trim() || '';
      let status = 'Delivered';
      if (rawStatus.includes('Teslim edildi')) status = 'Delivered';
      else if (rawStatus.includes('Kargo') || rawStatus.includes('Taşıma')) status = 'Shipped';
      else if (rawStatus.includes('İptal') || rawStatus.includes('Teslim edilemedi')) status = 'Cancelled';
      else if (rawStatus.includes('İade')) status = 'Returned';
      else status = 'New';

      const barcode = r[0]?.trim() || '';
      const hbSku = r[15]?.trim() || '';
      const sellerSku = r[16]?.trim() || '';
      const title = r[18]?.trim() || 'Hepsiburada Ürünü';
      const quantity = Math.max(1, parseInt(r[23] || '1', 10) || 1);
      const unitSalePrice = parseTrFloat(r[21]) || parseTrFloat(r[22]) || 100;
      const invoicedAmount = parseTrFloat(r[25]) || (unitSalePrice * quantity);
      const commissionAmount = parseTrFloat(r[29]) || parseTrFloat(r[26]) || (invoicedAmount * 0.17);
      const serviceFee = parseTrFloat(r[27]) || 0;
      const desi = Math.max(1, parseTrFloat(r[7]) || 1);

      let unitCost = costByBarcode.get(barcode.toLowerCase()) || 
                     costByBarcode.get(sellerSku.toLowerCase()) ||
                     costByTitle.get(title.toLowerCase()) || 
                     (unitSalePrice * 0.40);

      if (!ordersMap.has(orderNumber)) {
        ordersMap.set(orderNumber, {
          orderNumber,
          packageNumber,
          orderDate: parseOrderDate(r[3]),
          carrierName: r[2]?.trim() || 'Hepsijet',
          customerName: r[11]?.trim() || r[42]?.trim() || 'Müşteri',
          customerCity: r[13]?.trim() || 'İstanbul',
          customerDistrict: r[14]?.trim() || '',
          customerEmail: r[39]?.trim() || `${orderNumber}@hepsiburada.com`,
          trackingCode: r[5]?.trim() || '',
          status,
          items: []
        });
      }

      ordersMap.get(orderNumber)!.items.push({
        barcode: barcode || sellerSku || hbSku,
        hbSku,
        sellerSku,
        title,
        quantity,
        unitSalePrice,
        invoicedAmount,
        unitCost,
        commissionAmount,
        serviceFee,
        desi
      });
    }
  }

  console.log(`📦 Found ${ordersMap.size} unique Hepsiburada orders to insert/upsert.`);

  let insertedOrders = 0;
  let insertedItems = 0;

  for (const [orderNumber, ord] of ordersMap.entries()) {
    const existing = await query(`SELECT id FROM orders WHERE marketplace_order_number = $1`, [orderNumber]);
    let orderId = existing[0]?.id;

    let grossAmount = 0;
    let paidAmount = 0;
    let totalCogs = 0;
    let totalCommission = 0;
    let totalServiceFee = 0;
    let maxDesi = 1;

    for (const item of ord.items) {
      grossAmount += item.unitSalePrice * item.quantity;
      paidAmount += item.invoicedAmount;
      totalCogs += item.unitCost * item.quantity;
      totalCommission += item.commissionAmount;
      totalServiceFee += item.serviceFee;
      if (item.desi > maxDesi) maxDesi = item.desi;
    }

    const shippingCost = maxDesi <= 1 ? 46.50 : maxDesi <= 5 ? 65.00 : 85.00;
    const withholdingTax = paidAmount * 0.01;
    const vatRate = 0.10;
    const vatOutput = paidAmount * (vatRate / (1 + vatRate));
    const vatInput = (totalCogs + totalCommission + shippingCost) * (vatRate / (1 + vatRate));
    const netVat = Math.max(0, vatOutput - vatInput);
    const extraOpCost = grossAmount * 0.06;

    const netProfit = paidAmount - (totalCogs + totalCommission + shippingCost + totalServiceFee + withholdingTax + netVat + extraOpCost);
    const marginPercent = paidAmount > 0 ? (netProfit / paidAmount) * 100 : 0;

    if (!orderId) {
      const insRes = await query(`
        INSERT INTO orders (
          company_id, store_id, marketplace, marketplace_order_number, package_number,
          order_date, status, customer_name, customer_city, customer_district, customer_email,
          carrier_name, tracking_code, gross_amount, paid_amount, total_cost,
          total_commission, total_shipping_cost, service_fee, withholding_tax, net_vat,
          net_profit, profit_margin_percent, created_at, updated_at
        ) VALUES (
          $1, $2, 'hepsiburada', $3, $4,
          $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20,
          $21, $22, NOW(), NOW()
        ) RETURNING id
      `, [
        COMPANY_ID, HEPSIBURADA_STORE_ID, orderNumber, ord.packageNumber,
        ord.orderDate, ord.status, ord.customerName, ord.customerCity, ord.customerDistrict, ord.customerEmail,
        ord.carrierName, ord.trackingCode, grossAmount, paidAmount, totalCogs,
        totalCommission, shippingCost, totalServiceFee, withholdingTax, netVat,
        netProfit, marginPercent
      ]);
      orderId = insRes[0]?.id;
      insertedOrders++;
    } else {
      await query(`
        UPDATE orders SET
          marketplace = 'hepsiburada',
          store_id = $1,
          gross_amount = $2,
          paid_amount = $3,
          total_cost = $4,
          total_commission = $5,
          total_shipping_cost = $6,
          service_fee = $7,
          withholding_tax = $8,
          net_vat = $9,
          net_profit = $10,
          profit_margin_percent = $11,
          updated_at = NOW()
        WHERE id = $12
      `, [
        HEPSIBURADA_STORE_ID, grossAmount, paidAmount, totalCogs, totalCommission,
        shippingCost, totalServiceFee, withholdingTax, netVat, netProfit, marginPercent, orderId
      ]);
    }

    await query(`DELETE FROM order_items WHERE order_id = $1`, [orderId]);

    for (const item of ord.items) {
      const itemShipping = shippingCost / ord.items.length;
      const itemService = totalServiceFee / ord.items.length;
      const itemNetProfit = item.invoicedAmount - ((item.unitCost * item.quantity) + item.commissionAmount + itemShipping + itemService + (item.invoicedAmount * 0.06));

      await query(`
        INSERT INTO order_items (
          order_id, barcode, title, brand, quantity,
          unit_sale_price, invoiced_amount, unit_cost_price,
          commission_amount, shipping_amount, service_fee_share, net_profit
        ) VALUES (
          $1, $2, $3, 'Genel', $4,
          $5, $6, $7,
          $8, $9, $10, $11
        )
      `, [
        orderId, item.barcode, item.title, item.quantity,
        item.unitSalePrice, item.invoicedAmount, item.unitCost,
        item.commissionAmount, itemShipping, itemService, itemNetProfit
      ]);
      insertedItems++;
    }
  }

  console.log(`🎉 ALL DONE! Successfully imported ${ordersMap.size} Hepsiburada orders (${insertedItems} items) & tagged all orders.`);
}

runImport()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Ingestion Error:', err);
    process.exit(1);
  });
