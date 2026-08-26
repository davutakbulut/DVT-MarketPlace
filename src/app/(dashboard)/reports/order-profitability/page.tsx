"use client";
import React, { useState, useEffect } from "react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  FileSpreadsheet, Download, RefreshCw, Layers, ShoppingBag, 
  Tag, RotateCcw, Megaphone, Store, Filter, Calendar 
} from "lucide-react";

export default function ComprehensiveReportsPage() {
  const [activeReport, setActiveReport] = useState<"orders" | "products" | "categories" | "returns" | "marketing" | "marketplaces">("orders");
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const reportTabs = [
    { id: "orders", label: "Sipariş Kârlılık", icon: ShoppingBag },
    { id: "products", label: "Ürün & SKU Kârlılık", icon: Tag },
    { id: "categories", label: "Kategori Dökümü", icon: Layers },
    { id: "returns", label: "İade & Zarar Analizi", icon: RotateCcw },
    { id: "marketing", label: "Reklam & ROAS", icon: Megaphone },
    { id: "marketplaces", label: "Pazaryeri Kıyaslama", icon: Store },
  ];

  const fetchReport = async (type: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?type=${type}`);
      const json = await res.json();
      setReportData(json.data || []);
    } catch (e) {
      console.error(e);
      toast.error("Rapor verisi çekilemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(activeReport);
  }, [activeReport]);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-dark">Kapsamlı Finansal Raporlar</h3>
            <Badge variant="excellent">Adım 16: 6 Rapor Modülü</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sipariş, ürün, kategori, iade, reklam ve pazaryeri bazlı detaylı kârlılık dökümleri ve anlık Excel aktarımı
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a href={`/api/reports/export?type=${activeReport}`} download>
            <Button size="sm" className="text-xs h-8 sm:h-9 gap-1.5 font-bold shadow-xs bg-emerald-600 hover:bg-emerald-700">
              <Download className="w-3.5 h-3.5" />
              <span>Excel / CSV İndir</span>
            </Button>
          </a>

          <Button size="sm" variant="ghost" onClick={() => fetchReport(activeReport)} className="h-8 sm:h-9 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 6 Report Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white p-2.5 rounded-2xl border border-border shadow-xs">
        {reportTabs.map((t) => {
          const Icon = t.icon;
          const active = activeReport === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveReport(t.id as any)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                active
                  ? "bg-primary text-white shadow-xs"
                  : "bg-canvas text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* REPORT CONTENT TABLES */}
      <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
        {/* 1. ORDERS REPORT */}
        {activeReport === "orders" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                  <th className="py-3 px-4 table-sticky-first-col bg-canvas">Sipariş No</th>
                  <th className="py-3 px-4">Tarih</th>
                  <th className="py-3 px-4">Pazaryeri</th>
                  <th className="py-3 px-4">Satış Tutarı</th>
                  <th className="py-3 px-4">Ürün Maliyeti</th>
                  <th className="py-3 px-4">Komisyon</th>
                  <th className="py-3 px-4">Kargo</th>
                  <th className="py-3 px-4">Hizmet Bedeli</th>
                  <th className="py-3 px-4">Stopaj</th>
                  <th className="py-3 px-4">Net Kâr</th>
                  <th className="py-3 px-4 text-right">Marj</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {reportData.map((o) => {
                  const gross = parseFloat(o.grossAmount) || 0;
                  const cogs = parseFloat(o.totalCogs) || 0;
                  const comm = parseFloat(o.commissionAmount) || 0;
                  const ship = parseFloat(o.shippingCost) || 0;
                  const srv = parseFloat(o.serviceFee) || 13.19;
                  const stopaj = parseFloat(o.withholdingTax) || 0;
                  const profit = parseFloat(o.netProfit) || 0;
                  const margin = parseFloat(o.profitMargin) || 0;

                  return (
                    <tr key={o.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="py-3 px-4 table-sticky-first-col font-mono font-bold text-dark text-xs">
                        {o.orderNumber}
                      </td>
                      <td className="py-3 px-4 text-gray-500 font-medium whitespace-nowrap">
                        {o.orderDate}
                      </td>
                      <td className="py-3 px-4 font-bold text-dark">
                        <span className="capitalize">{o.marketplace}</span>
                      </td>
                      <td className="py-3 px-4 font-black text-primary tabular-nums">
                        {formatCurrency(gross)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-700 tabular-nums">
                        {formatCurrency(cogs)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-700 tabular-nums">
                        -{formatCurrency(comm)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-700 tabular-nums">
                        -{formatCurrency(ship)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-700 tabular-nums">
                        -{formatCurrency(srv)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-700 tabular-nums">
                        -{formatCurrency(stopaj)}
                      </td>
                      <td className={`py-3 px-4 font-black tabular-nums ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(profit)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Badge variant={margin >= 25 ? 'excellent' : margin >= 15 ? 'success' : margin >= 5 ? 'warning' : 'danger'}>
                          %{margin.toFixed(1)}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. PRODUCTS REPORT */}
        {activeReport === "products" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                  <th className="py-3 px-4 table-sticky-first-col bg-canvas">Barkod / SKU</th>
                  <th className="py-3 px-4">Ürün Adı</th>
                  <th className="py-3 px-4">Satış Fiyatı</th>
                  <th className="py-3 px-4">Maliyet</th>
                  <th className="py-3 px-4">Komisyon (%)</th>
                  <th className="py-3 px-4">Satılan Adet</th>
                  <th className="py-3 px-4">Toplam Ciro</th>
                  <th className="py-3 px-4 text-right">Toplam Kâr</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {reportData.map((p) => (
                  <tr key={p.id} className="hover:bg-canvas/50 transition-colors">
                    <td className="py-3 px-4 table-sticky-first-col font-mono font-bold text-dark text-xs">
                      {p.barcode || p.sku}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800">
                      {p.title}
                    </td>
                    <td className="py-3 px-4 font-black text-primary tabular-nums">
                      {formatCurrency(parseFloat(p.salePrice))}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-700 tabular-nums">
                      {formatCurrency(parseFloat(p.costPrice))}
                    </td>
                    <td className="py-3 px-4 font-bold tabular-nums">
                      %{p.commissionRate}
                    </td>
                    <td className="py-3 px-4 font-bold tabular-nums">
                      {p.unitsSold} Adet
                    </td>
                    <td className="py-3 px-4 font-black text-dark tabular-nums">
                      {formatCurrency(parseFloat(p.totalRevenue))}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-600 tabular-nums">
                      {formatCurrency(parseFloat(p.totalProfit))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. CATEGORIES REPORT */}
        {activeReport === "categories" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                  <th className="py-3 px-4 table-sticky-first-col bg-canvas">Kategori Adı</th>
                  <th className="py-3 px-4">Satılan Adet</th>
                  <th className="py-3 px-4">Ort. Komisyon</th>
                  <th className="py-3 px-4">Toplam Ciro</th>
                  <th className="py-3 px-4">Toplam Net Kâr</th>
                  <th className="py-3 px-4 text-right">Net Kâr Marjı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {reportData.map((c, i) => (
                  <tr key={i} className="hover:bg-canvas/50 transition-colors">
                    <td className="py-3 px-4 table-sticky-first-col font-bold text-dark">
                      {c.categoryName}
                    </td>
                    <td className="py-3 px-4 font-bold tabular-nums">{c.unitsSold} Adet</td>
                    <td className="py-3 px-4 font-semibold tabular-nums">%{c.commissionRate}</td>
                    <td className="py-3 px-4 font-black text-primary tabular-nums">{formatCurrency(c.totalSales)}</td>
                    <td className="py-3 px-4 font-black text-emerald-600 tabular-nums">{formatCurrency(c.totalProfit)}</td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant="excellent">%{c.margin}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. RETURNS REPORT */}
        {activeReport === "returns" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                  <th className="py-3 px-4 table-sticky-first-col bg-canvas">Sipariş No</th>
                  <th className="py-3 px-4">Ürün</th>
                  <th className="py-3 px-4">İade Nedeni</th>
                  <th className="py-3 px-4">Kargo Kaybı</th>
                  <th className="py-3 px-4">Hurda / Hasar</th>
                  <th className="py-3 px-4">Toplam Zarar</th>
                  <th className="py-3 px-4 text-right">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {reportData.map((r, i) => (
                  <tr key={i} className="hover:bg-canvas/50 transition-colors">
                    <td className="py-3 px-4 table-sticky-first-col font-mono font-bold text-dark">{r.orderNumber}</td>
                    <td className="py-3 px-4 font-semibold text-gray-800">{r.productTitle}</td>
                    <td className="py-3 px-4 text-gray-600">{r.returnReason}</td>
                    <td className="py-3 px-4 font-bold text-red-600 tabular-nums">-{formatCurrency(r.returnCargoCost)}</td>
                    <td className="py-3 px-4 font-bold text-red-600 tabular-nums">-{formatCurrency(r.brokenDamagedCost)}</td>
                    <td className="py-3 px-4 font-black text-red-600 tabular-nums">-{formatCurrency(r.totalLoss)}</td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant={r.brokenDamagedCost > 0 ? "danger" : "warning"}>{r.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. MARKETING REPORT */}
        {activeReport === "marketing" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                  <th className="py-3 px-4 table-sticky-first-col bg-canvas">Fatura No</th>
                  <th className="py-3 px-4">Tarih</th>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4">KDV Hariç Tutar</th>
                  <th className="py-3 px-4">KDV Tutarı (%20)</th>
                  <th className="py-3 px-4 text-right">Fatura Toplamı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {reportData.map((m) => (
                  <tr key={m.id} className="hover:bg-canvas/50 transition-colors">
                    <td className="py-3 px-4 table-sticky-first-col font-mono font-bold text-dark">{m.invoiceNumber}</td>
                    <td className="py-3 px-4 text-gray-500 font-medium">{m.invoiceDate}</td>
                    <td className="py-3 px-4 font-bold text-dark">{m.platform}</td>
                    <td className="py-3 px-4 font-semibold tabular-nums">{formatCurrency(parseFloat(m.amountExVat))}</td>
                    <td className="py-3 px-4 font-semibold tabular-nums">{formatCurrency(parseFloat(m.vatAmount))}</td>
                    <td className="py-3 px-4 text-right font-black text-primary tabular-nums">{formatCurrency(parseFloat(m.totalAmount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. MARKETPLACES REPORT */}
        {activeReport === "marketplaces" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                  <th className="py-3 px-4 table-sticky-first-col bg-canvas">Pazaryeri</th>
                  <th className="py-3 px-4">Mağaza Sayısı</th>
                  <th className="py-3 px-4">Toplam Ciro</th>
                  <th className="py-3 px-4">Toplam Net Kâr</th>
                  <th className="py-3 px-4">Ortalama Marj</th>
                  <th className="py-3 px-4">İade Oranı</th>
                  <th className="py-3 px-4 text-right">Reklam Harcaması</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {reportData.map((mp, i) => (
                  <tr key={i} className="hover:bg-canvas/50 transition-colors">
                    <td className="py-3 px-4 table-sticky-first-col font-black text-dark text-sm">{mp.marketplace}</td>
                    <td className="py-3 px-4 font-bold tabular-nums">{mp.storeCount} Mağaza</td>
                    <td className="py-3 px-4 font-black text-primary tabular-nums">{formatCurrency(mp.totalRevenue)}</td>
                    <td className="py-3 px-4 font-black text-emerald-600 tabular-nums">{formatCurrency(mp.totalProfit)}</td>
                    <td className="py-3 px-4 font-bold tabular-nums">%{mp.avgMargin}</td>
                    <td className="py-3 px-4 font-bold text-amber-600 tabular-nums">%{mp.returnRate}</td>
                    <td className="py-3 px-4 text-right font-black text-red-600 tabular-nums">{formatCurrency(mp.adSpend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
