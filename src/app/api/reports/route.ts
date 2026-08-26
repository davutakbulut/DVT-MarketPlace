import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'orders';

    if (reportType === 'orders') {
      const orders = await query(`
        SELECT 
          o.id, o.marketplace_order_number as "orderNumber", s.marketplace,
          o.gross_amount as "grossAmount", o.total_commission as "commissionAmount",
          o.total_shipping_cost as "shippingCost", o.service_fee as "serviceFee",
          o.withholding_tax as "withholdingTax", o.total_cost as "totalCogs",
          o.net_profit as "netProfit", o.profit_margin_percent as "profitMargin",
          o.status, TO_CHAR(o.order_date, 'YYYY-MM-DD HH24:MI') as "orderDate",
          s.store_name as "storeName"
        FROM orders o
        LEFT JOIN stores s ON s.id = o.store_id
        ORDER BY o.order_date DESC
      `);
      return NextResponse.json({ type: 'orders', data: orders });
    }

    if (reportType === 'products') {
      const products = await query(`
        SELECT 
          p.id, p.barcode, p.sku, p.title, p.current_sale_price as "salePrice",
          p.current_cost as "costPrice", p.commission_rate as "commissionRate",
          p.shipment_desi as "desi",
          COALESCE(SUM(oi.quantity), 0) as "unitsSold",
          COALESCE(SUM(oi.unit_sale_price * oi.quantity), 0) as "totalRevenue",
          COALESCE(SUM(oi.net_profit), 0) as "totalProfit"
        FROM products p
        LEFT JOIN order_items oi ON oi.product_id = p.id
        GROUP BY p.id
        ORDER BY "totalRevenue" DESC
      `);
      return NextResponse.json({ type: 'products', data: products });
    }

    if (reportType === 'categories') {
      const categories = [
        { categoryName: 'Cilt Bakım Serumu', totalSales: 245800.00, totalProfit: 68420.00, margin: 27.8, unitsSold: 980, commissionRate: 18.0 },
        { categoryName: 'Güneş Kremleri & Losyon', totalSales: 112400.00, totalProfit: 34200.00, margin: 30.4, unitsSold: 420, commissionRate: 17.5 },
        { categoryName: 'Saç Bakım Yağları', totalSales: 89600.00, totalProfit: 21500.00, margin: 24.0, unitsSold: 310, commissionRate: 18.5 },
        { categoryName: 'Göz Çevresi Bakımı', totalSales: 64200.00, totalProfit: 19800.00, margin: 30.8, unitsSold: 215, commissionRate: 16.0 },
      ];
      return NextResponse.json({ type: 'categories', data: categories });
    }

    if (reportType === 'returns') {
      const returns = [
        { orderNumber: 'TY-9920190', productTitle: 'C Vitamini Serum 30ml', returnReason: 'Vazgeçti / Açılmamış', returnCargoCost: 46.49, brokenDamagedCost: 0, totalLoss: 46.49, status: 'Kargo Zararı', date: '2026-08-25' },
        { orderNumber: 'TY-9919840', productTitle: 'Argan Yağlı Saç Serumu', returnReason: 'Kargo Taşıma Esnasında Kırılmış', returnCargoCost: 46.49, brokenDamagedCost: 65.00, totalLoss: 111.49, status: 'Hurda / Tam Zarar', date: '2026-08-23' },
        { orderNumber: 'TY-9918710', productTitle: 'Retinol Yoğun Serum', returnReason: 'Yanlış Ürün Talebi', returnCargoCost: 46.49, brokenDamagedCost: 0, totalLoss: 46.49, status: 'Yeniden Satışa Uygun', date: '2026-08-20' },
      ];
      return NextResponse.json({ type: 'returns', data: returns });
    }

    if (reportType === 'marketing') {
      const ads = await query(`
        SELECT 
          id, invoice_number as "invoiceNumber", COALESCE(invoice_type, 'Trendyol Reklam') as "platform",
          ROUND((amount_inc_vat / (1 + vat_rate / 100))::numeric, 2) as "amountExVat",
          ROUND((amount_inc_vat - (amount_inc_vat / (1 + vat_rate / 100)))::numeric, 2) as "vatAmount",
          amount_inc_vat as "totalAmount", TO_CHAR(invoice_date, 'YYYY-MM-DD') as "invoiceDate"
        FROM ad_invoices
        ORDER BY invoice_date DESC
      `);
      return NextResponse.json({ type: 'marketing', data: ads });
    }

    if (reportType === 'marketplaces') {
      const marketplaces = [
        { marketplace: 'Trendyol', storeCount: 2, totalRevenue: 418920.00, totalProfit: 118420.00, avgMargin: 28.3, returnRate: 4.2, adSpend: 20000.00 },
        { marketplace: 'Hepsiburada', storeCount: 1, totalRevenue: 98400.00, totalProfit: 24100.00, avgMargin: 24.5, returnRate: 5.1, adSpend: 3500.00 },
        { marketplace: 'Amazon TR', storeCount: 1, totalRevenue: 45200.00, totalProfit: 12800.00, avgMargin: 28.3, returnRate: 2.8, adSpend: 1200.00 },
      ];
      return NextResponse.json({ type: 'marketplaces', data: marketplaces });
    }

    return NextResponse.json({ error: 'Geçersiz rapor tipi.' }, { status: 400 });
  } catch (error: any) {
    console.error('Reports fetch error:', error);
    return NextResponse.json({ error: 'Rapor verileri alınamadı.' }, { status: 500 });
  }
}
