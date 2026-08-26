"use client";
import React, { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TablePagination } from "@/components/common/TablePagination";
import { 
  FileCheck2, AlertTriangle, ShieldCheck, RefreshCw, Eye, 
  Layers, Truck, ArrowRight, DollarSign, Download, Check
} from "lucide-react";
import { OrderDetailModal } from "@/components/orders/OrderDetailModal";

export default function SettlementDesiAuditPage() {
  const [activeTab, setActiveTab] = useState<'audits' | 'settlements'>('audits');
  const [audits, setAudits] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(10);
  const [settlePage, setSettlePage] = useState(1);
  const [settlePageSize, setSettlePageSize] = useState(10);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settlement-desi-audit');
      const data = await res.json();
      setAudits(data.audits || []);
      setSettlements(data.settlements || []);
      setSummary(data.summary || {});
    } catch (e) {
      toast.error("Denetim verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  const handleExportDisputeExcel = () => {
    const disputeItems = audits.filter(a => parseFloat(a.overchargeAmount) > 0);
    if (disputeItems.length === 0) {
      toast.error("İtiraz edilecek desi aşımı bulunamadı.");
      return;
    }

    const headers = ["Siparis Numarasi", "Paket Numarasi", "Kargo Firmasi", "Musteri", "Sehir", "Satici Desisi", "Kargodan Kesilen Desi", "Desi Farki", "Faturalanan Kargo Tutari", "Fazla Kesinti Tutari", "Itiraz Notu", "Tarih"];
    const rows = disputeItems.map(d => [
      `"${d.orderNumber}"`,
      `"${d.packageNumber}"`,
      `"${d.carrierName}"`,
      `"${d.customerName}"`,
      `"${d.city}"`,
      d.declaredDesi,
      d.billedDesi,
      d.desiDiff,
      d.billedCost,
      d.overchargeAmount,
      `"Desi asimi itirazi - Olculen ${d.declaredDesi} Desi"`,
      d.invoiceDate
    ].join(","));

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Trendyol_Desi_Asim_Itiraz_Listesi_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${disputeItems.length} sipariş için Trendyol Desi İtiraz Dosyası Excel formatında indirildi!`);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-dark">Hakediş & Kargo Desi Aşım Kontrol Merkezi</h3>
            <Badge variant="excellent">2.366 Sipariş Denetimi</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kargo faturalarından kesilen desi tutarları ile satıcı ölçümleri arasındaki farkları denetleyin ve tek tıkla itiraz edin
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={handleExportDisputeExcel}
            className="text-xs h-8 sm:h-9 gap-1.5 font-bold shadow-xs bg-primary hover:bg-primary-hover text-white"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Trendyol İtiraz Exceli İndir</span>
          </Button>

          <Button size="sm" variant="outline" onClick={fetchAuditData} className="h-8 sm:h-9 text-xs gap-1.5 font-bold">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">Denetlenen Sipariş</span>
          <div className="text-2xl font-black text-dark tabular-nums mt-1">{audits.length || 0} Adet</div>
          <span className="text-[11px] text-gray-500 font-semibold mt-1 block">Son 100 Sipariş</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">Desi Aşımı Tespit Edilen</span>
          <div className="text-2xl font-black text-amber-700 tabular-nums mt-1">{summary.overchargedCount || 0} Sipariş</div>
          <span className="text-[11px] text-amber-700 font-bold mt-1 block">Kargo Fazla Kesinti</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">Kurtarılabilir Fazla Kesinti</span>
          <div className="text-2xl font-black text-primary tabular-nums mt-1">{formatCurrency(summary.totalOvercharge || 0)}</div>
          <span className="text-[11px] text-gray-500 font-semibold mt-1 block">İtiraz Edilebilir Tutar</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">4 Aylık Net Hakediş</span>
          <div className="text-2xl font-black text-emerald-700 tabular-nums mt-1">
            {formatCurrency(settlements.reduce((sum, s) => sum + parseFloat(s.netPayout || 0), 0))}
          </div>
          <span className="text-[11px] text-emerald-700 font-bold mt-1 block">Banka Hesabına Yatan</span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center bg-canvas p-1 rounded-2xl border border-border w-fit">
        <button
          onClick={() => setActiveTab('audits')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'audits' ? 'bg-primary text-white shadow-xs' : 'text-dark hover:bg-white'
          }`}
        >
          📦 Kargo Desi Farkları Listesi
        </button>
        <button
          onClick={() => setActiveTab('settlements')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'settlements' ? 'bg-primary text-white shadow-xs' : 'text-dark hover:bg-white'
          }`}
        >
          💳 Aylık Hakediş & Kesinti Tabloları
        </button>
      </div>

      {/* Table Content */}
      {activeTab === 'audits' ? (
        <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
                    <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                    <th className="py-3 px-4 table-sticky-first-col bg-canvas">Sipariş & Paket No</th>
                    <th className="py-3 px-4">Tarih</th>
                    <th className="py-3 px-4">Kargo Firması</th>
                    <th className="py-3 px-4 text-center">Hesaplanan Desi</th>
                    <th className="py-3 px-4 text-center font-bold text-primary">Kargodan Alınan Desi</th>
                    <th className="py-3 px-4 font-black text-dark">Faturalanan Kargo</th>
                    <th className="py-3 px-4 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {audits.slice((auditPage - 1) * auditPageSize, auditPage * auditPageSize).map((a) => (
                    <tr 
                      key={a.id} 
                      onClick={() => setSelectedOrderId(a.id)}
                      className="hover:bg-primary-tint-50/30 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 table-sticky-first-col font-bold text-dark font-mono">
                        <div>{a.orderNumber}</div>
                        <span className="text-[10px] text-gray-400">Paket: {a.packageNumber}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 tabular-nums text-[11px]">{a.invoiceDate}</td>
                      <td className="py-3 px-4 font-semibold text-dark truncate max-w-[140px]">{a.carrierName}</td>
                      <td className="py-3 px-4 text-center tabular-nums text-gray-600">{a.declaredDesi} Desi</td>
                      <td className="py-3 px-4 text-center font-black text-primary tabular-nums">
                        {a.billedDesi} Desi
                      </td>
                      <td className="py-3 px-4 font-black text-dark tabular-nums">
                        ₺{parseFloat(a.billedCost || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrderId(a.id);
                          }}
                          className="h-7 text-[11px] font-bold px-2 text-primary hover:bg-primary-tint-100"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          <span>İncele</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch-Friendly Card View */}
            <div className="block md:hidden divide-y divide-border/60">
              {audits.slice((auditPage - 1) * auditPageSize, auditPage * auditPageSize).map((a) => (
                <div 
                  key={a.id} 
                  onClick={() => setSelectedOrderId(a.id)}
                  className="p-3.5 space-y-2.5 bg-white hover:bg-canvas/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-xs text-dark font-mono block">{a.orderNumber}</span>
                      <span className="text-[10px] text-gray-400">Paket: {a.packageNumber} • {a.invoiceDate}</span>
                    </div>
                    <Badge variant="warning" className="text-[10px] font-bold">
                      Desi Farkı
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-canvas/60 p-2.5 rounded-2xl border border-border/80 text-[11px]">
                    <div>
                      <span className="text-[10px] text-gray-400 block font-semibold">Paket Desi</span>
                      <span className="font-bold text-gray-700">{a.declaredDesi} D</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-semibold">Kesilen Desi</span>
                      <span className="font-black text-primary">{a.billedDesi} D</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block font-semibold">Kargo Gideri</span>
                      <span className="font-black text-dark tabular-nums">₺{parseFloat(a.billedCost || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                    <span>{a.carrierName}</span>
                    <span className="font-bold text-primary flex items-center gap-1 text-xs">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Desi İtirazını İncele ➔</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
          <TablePagination currentPage={auditPage} totalPages={Math.ceil(audits.length / auditPageSize) || 1} pageSize={auditPageSize} totalItems={audits.length} onPageChange={setAuditPage} onPageSizeChange={setAuditPageSize} />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                  <th className="py-3 px-4">Dönem</th>
                  <th className="py-3 px-4 text-primary font-bold">Brüt Ciro (₺)</th>
                  <th className="py-3 px-4">Komisyon Kesintisi (₺)</th>
                  <th className="py-3 px-4">Kargo Kesintisi (₺)</th>
                  <th className="py-3 px-4">Hizmet Bedeli (₺)</th>
                  <th className="py-3 px-4 text-emerald-700 font-bold">Net Hakediş (₺)</th>
                  <th className="py-3 px-4 text-right">Hakediş Tarihi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {settlements.slice((settlePage - 1) * settlePageSize, settlePage * settlePageSize).map((s, idx) => (
                  <tr key={idx} className="hover:bg-canvas/50">
                    <td className="py-3 px-4 font-black text-dark">{s.periodName}</td>
                    <td className="py-3 px-4 font-black text-primary tabular-nums">{formatCurrency(parseFloat(s.grossSales || 0))}</td>
                    <td className="py-3 px-4 font-bold text-gray-700 tabular-nums">₺{parseFloat(s.commissionFee || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 font-bold text-gray-700 tabular-nums">₺{parseFloat(s.shippingFee || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 font-bold text-gray-700 tabular-nums">₺{parseFloat(s.serviceFee || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 font-black text-emerald-700 tabular-nums">{formatCurrency(parseFloat(s.netPayout || 0))}</td>
                    <td className="py-3 px-4 text-right text-gray-500 tabular-nums">{s.settlementDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination currentPage={settlePage} totalPages={Math.ceil(settlements.length / settlePageSize) || 1} pageSize={settlePageSize} totalItems={settlements.length} onPageChange={setSettlePage} onPageSizeChange={setSettlePageSize} />
        </div>
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
}
