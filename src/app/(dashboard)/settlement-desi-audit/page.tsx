"use client";
import React, { useState, useEffect } from "react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  FileCheck2, AlertCircle, Search, RefreshCw, Copy, Check, 
  Upload, Download, ShieldAlert, Sparkles, Truck, FileText, ArrowUpDown 
} from "lucide-react";

export default function SettlementDesiAuditPage() {
  const [activeTab, setActiveTab] = useState<"desi" | "settlement">("desi");
  const [audits, setAudits] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalOvercharge: 0,
    overchargedCount: 0,
    pendingDisputeAmount: 0,
    avgDesiDiff: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("all");
  const [selectedDispute, setSelectedDispute] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settlement-desi-audit');
      const data = await res.json();
      setAudits(data.audits || []);
      setSettlements(data.settlements || []);
      setSummary(data.summary || {});
    } catch (e) {
      console.error(e);
      toast.error("Denetim verileri yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/settlement-desi-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, disputeStatus: newStatus }),
      });
      if (res.ok) {
        toast.success(`İtiraz durumu '${newStatus}' olarak güncellendi!`);
        fetchData();
        setSelectedDispute(null);
      }
    } catch (e) {
      toast.error("Güncellenemedi.");
    }
  };

  const copyDisputeLetter = (item: any) => {
    const text = `Sayın Trendyol Satıcı Destek Ekibi,

${item.orderNumber} numaralı siparişe ait ${item.packageNumber} takip nolu gönderimiz kataloğumuzda ${item.declaredDesi} Desi olarak kayıtlı olmasına rağmen kargo firması (${item.carrierName}) tarafından ${item.billedDesi} Desi olarak faturalandırılmış ve ₺${item.overchargeAmount} tutarında haksız desi aşım kesintisi yapılmıştır.

İlgili paket boyutlarının tekrar incelenerek tarafımıza yansıtılan ₺${item.overchargeAmount} fazla kesintinin bir sonraki hakedişimize iadesini arz ederiz.

Ürün: ${item.productTitle}
Fatura Tarihi: ${item.invoiceDate}`;
    navigator.clipboard.writeText(text);
    toast.success("İtiraz dilekçesi panoya kopyalandı! Trendyol Destek Talebi açabilirsiniz.");
  };

  const filteredAudits = audits.filter((a) => {
    if (carrierFilter !== "all" && a.carrierName.toLowerCase() !== carrierFilter.toLowerCase()) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return a.orderNumber.toLowerCase().includes(q) || a.packageNumber.toLowerCase().includes(q) || a.productTitle.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-dark">Hakediş & Desi Aşım Denetimi</h3>
            <Badge variant="excellent">Adım 15: Kesinti Motoru</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kargo faturalarındaki desi aşımlarını tespit edin, haksız kesintilere tek tıkla itiraz edin ve hakediş mutabakatınızı yönetin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-canvas p-1 rounded-2xl border border-border">
            <button
              onClick={() => setActiveTab("desi")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "desi" ? "bg-primary text-white shadow-xs" : "text-dark hover:bg-border/50"
              }`}
            >
              Desi Aşım Tespiti
            </button>
            <button
              onClick={() => setActiveTab("settlement")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "settlement" ? "bg-primary text-white shadow-xs" : "text-dark hover:bg-border/50"
              }`}
            >
              Hakediş Bordrosu
            </button>
          </div>

          <Button size="sm" variant="ghost" onClick={fetchData} className="h-8 sm:h-9 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
          <span className="text-xs text-gray-500 font-semibold block mb-1">Toplam Desi Aşım Zararı</span>
          <div className="text-xl sm:text-2xl font-black text-red-600 tabular-nums">
            -{formatCurrency(summary.totalOvercharge)}
          </div>
          <span className="text-[11px] text-gray-400 font-medium">Tespit edilen toplam haksız kesinti</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-primary-tint-200 bg-primary-tint-50/20 shadow-xs">
          <span className="text-xs text-primary font-bold block mb-1">İtiraz Edilebilir Tutar</span>
          <div className="text-xl sm:text-2xl font-black text-primary tabular-nums">
            {formatCurrency(summary.pendingDisputeAmount)}
          </div>
          <span className="text-[11px] text-gray-500 font-medium">Trendyol'dan geri talep edilecek tutar</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
          <span className="text-xs text-gray-500 font-semibold block mb-1">Hatalı Paket Sayısı</span>
          <div className="text-xl sm:text-2xl font-black text-dark tabular-nums">
            {summary.overchargedCount} Paket
          </div>
          <span className="text-[11px] text-gray-400 font-medium">Katalog desisinden yüksek kesilen</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
          <span className="text-xs text-gray-500 font-semibold block mb-1">Ortalama Desi Sapması</span>
          <div className="text-xl sm:text-2xl font-black text-amber-600 tabular-nums">
            +{summary.avgDesiDiff} Desi
          </div>
          <span className="text-[11px] text-gray-400 font-medium">Paket başına fazla yazılan desi</span>
        </div>
      </div>

      {/* TAB 1: DESI AŞIM DENETİM TABLOSU */}
      {activeTab === "desi" && (
        <div className="space-y-3">
          <div className="bg-white p-3.5 rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Sipariş No, Paket No veya Ürün Ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border text-xs font-bold text-dark focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <select
                value={carrierFilter}
                onChange={(e) => setCarrierFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-dark bg-white focus:outline-none"
              >
                <option value="all">Tüm Kargolar</option>
                <option value="TEX">TEX</option>
                <option value="Aras">Aras</option>
                <option value="Sürat">Sürat</option>
                <option value="PTT">PTT</option>
                <option value="Yurtiçi">Yurtiçi</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[860px]">
                <thead>
                  <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                    <th className="py-3 px-4 table-sticky-first-col bg-canvas">Sipariş / Paket No</th>
                    <th className="py-3 px-4">Ürün Adı</th>
                    <th className="py-3 px-4">Kargo</th>
                    <th className="py-3 px-4">Katalog Desisi</th>
                    <th className="py-3 px-4">Fatura Desisi</th>
                    <th className="py-3 px-4">Fatura Farkı</th>
                    <th className="py-3 px-4">Durum</th>
                    <th className="py-3 px-4 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredAudits.map((a) => {
                    const hasOvercharge = parseFloat(a.overchargeAmount) > 0;
                    return (
                      <tr key={a.id} className="hover:bg-canvas/50 transition-colors">
                        <td className="py-3 px-4 table-sticky-first-col font-mono font-bold text-dark">
                          <div>{a.orderNumber}</div>
                          <div className="text-[10px] text-gray-400 font-normal">{a.packageNumber}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-800 max-w-[220px] truncate">
                          {a.productTitle}
                        </td>
                        <td className="py-3 px-4 font-bold text-dark">
                          {a.carrierName}
                        </td>
                        <td className="py-3 px-4 font-bold tabular-nums">
                          {a.declaredDesi} Desi
                        </td>
                        <td className="py-3 px-4 font-black tabular-nums text-red-600">
                          {a.billedDesi} Desi
                        </td>
                        <td className="py-3 px-4 font-black tabular-nums">
                          {hasOvercharge ? (
                            <span className="text-red-600">-{formatCurrency(parseFloat(a.overchargeAmount))}</span>
                          ) : (
                            <span className="text-emerald-600">₺0.00</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={
                            a.disputeStatus === 'refunded' ? 'excellent' :
                            a.disputeStatus === 'submitted' ? 'success' :
                            a.disputeStatus === 'pending' ? 'danger' : 'secondary'
                          }>
                            {a.disputeStatus === 'refunded' ? 'İade Alındı' :
                             a.disputeStatus === 'submitted' ? 'İtiraz Açıldı' :
                             a.disputeStatus === 'pending' ? 'Aşım Var (İtiraz Bekliyor)' : 'Normal'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {hasOvercharge && (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] font-bold gap-1 px-2"
                                onClick={() => copyDisputeLetter(a)}
                                title="İtiraz Metnini Kopyala"
                              >
                                <Copy className="w-3 h-3" />
                                <span>İtiraz Kopyala</span>
                              </Button>
                              {a.disputeStatus === 'pending' && (
                                <Button
                                  size="sm"
                                  className="h-7 text-[11px] font-bold px-2 bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => handleUpdateStatus(a.id, 'submitted')}
                                >
                                  Açıldı
                                </Button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HAKEDİŞ KESİNTİ BORDROSU */}
      {activeTab === "settlement" && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[860px]">
                <thead>
                  <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                    <th className="py-3 px-4 table-sticky-first-col bg-canvas">Mutabakat Dönemi</th>
                    <th className="py-3 px-4">Toplam Satış (Brüt)</th>
                    <th className="py-3 px-4">Komisyon Kesintisi</th>
                    <th className="py-3 px-4">Kargo Kesintisi</th>
                    <th className="py-3 px-4">Hizmet Bedeli</th>
                    <th className="py-3 px-4">%1 Stopaj</th>
                    <th className="py-3 px-4">Ceza / Diğer</th>
                    <th className="py-3 px-4 text-right">Banka Net Hakediş</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {settlements.map((s) => (
                    <tr key={s.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="py-3 px-4 table-sticky-first-col font-bold text-dark">
                        {s.periodName}
                      </td>
                      <td className="py-3 px-4 font-black text-primary tabular-nums">
                        {formatCurrency(parseFloat(s.grossSales))}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-700 tabular-nums">
                        -{formatCurrency(parseFloat(s.commissionFee))}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-700 tabular-nums">
                        -{formatCurrency(parseFloat(s.shippingFee))}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-700 tabular-nums">
                        -{formatCurrency(parseFloat(s.serviceFee))}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-700 tabular-nums">
                        -{formatCurrency(parseFloat(s.withholdingTax))}
                      </td>
                      <td className="py-3 px-4 font-semibold text-red-600 tabular-nums">
                        {parseFloat(s.penaltyFee) > 0 ? `-${formatCurrency(parseFloat(s.penaltyFee))}` : '₺0.00'}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-700 tabular-nums text-sm">
                        {formatCurrency(parseFloat(s.netPayout))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
