"use client";
import React, { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  AlertOctagon, AlertTriangle, AlertCircle, CheckCircle2, 
  ShieldAlert, RefreshCw, Filter, ArrowRight, Check, Sparkles 
} from "lucide-react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalAlerts: 0,
    criticalCount: 0,
    warningCount: 0,
    totalRiskAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      setAlerts(data.alerts || []);
      setSummary(data.summary || {});
    } catch (e) {
      console.error(e);
      toast.error("Uyarı listesi yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleResolveAlert = async (id: string) => {
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isResolved: true }),
      });
      if (res.ok) {
        toast.success("Uyarı çözüldü olarak işaretlendi!");
        setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isResolved: true } : a)));
      }
    } catch (e) {
      toast.error("İşlem başarısız.");
    }
  };

  const filterTabs = [
    { id: "all", label: "Tüm Aktif Uyarılar" },
    { id: "negative_profit", label: "Zararlı Siparişler" },
    { id: "desi_overcharge", label: "Kargo Desi Aşımları" },
    { id: "low_margin", label: "Düşük Marjlar" },
    { id: "missing_cost", label: "Eksik Maliyetler" },
    { id: "resolved", label: "Çözülenler" },
  ];

  const filteredAlerts = alerts.filter((a) => {
    if (activeFilter === "resolved") return a.isResolved;
    if (a.isResolved) return false;
    if (activeFilter === "all") return true;
    return a.alertType === activeFilter;
  });

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-dark">Akıllı Anomali & Risk Takip Merkezi</h3>
            <Badge variant="excellent">Adım 17: Anomali Motoru</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Zararına yapılan satışlar, düşük marj eşikleri, faturadaki desi aşımları ve eksik maliyetli ürünlerin anlık tespiti
          </p>
        </div>

        <Button size="sm" variant="ghost" onClick={fetchAlerts} className="h-8 sm:h-9 text-xs">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-red-50/70 border border-red-200 p-4 rounded-2xl shadow-xs">
          <span className="text-xs text-red-700 font-bold block mb-1">Kritik Anomaliler</span>
          <div className="text-xl sm:text-2xl font-black text-red-600 tabular-nums">
            {summary.criticalCount} Adet
          </div>
          <span className="text-[11px] text-red-600/80 font-medium">Acil müdahale gerektiren zararlı kalemler</span>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl shadow-xs">
          <span className="text-xs text-amber-700 font-bold block mb-1">Uyarı Kalemleri</span>
          <div className="text-xl sm:text-2xl font-black text-amber-600 tabular-nums">
            {summary.warningCount} Adet
          </div>
          <span className="text-[11px] text-amber-600/80 font-medium">Hedef marj altı veya eksik maliyetler</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
          <span className="text-xs text-gray-500 font-semibold block mb-1">Toplam Kâr Kaybı Riski</span>
          <div className="text-xl sm:text-2xl font-black text-dark tabular-nums">
            -{formatCurrency(summary.totalRiskAmount)}
          </div>
          <span className="text-[11px] text-gray-400 font-medium">Anomali kaynaklı potansiyel kâr erimesi</span>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl shadow-xs">
          <span className="text-xs text-emerald-700 font-bold block mb-1">Çözülen Bildirimler</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 tabular-nums">
            {alerts.filter((a) => a.isResolved).length} Adet
          </div>
          <span className="text-[11px] text-emerald-600/80 font-medium">Düzenlenip kapatılan kayıtlar</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white p-2.5 rounded-2xl border border-border shadow-xs">
        {filterTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveFilter(t.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeFilter === t.id
                ? "bg-primary text-white shadow-xs"
                : "bg-canvas text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-border text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <h5 className="text-sm font-bold text-dark">Harika! Bu kategoride açık bir uyarı bulunmuyor.</h5>
            <p className="text-xs text-muted-foreground mt-0.5">Tüm siparişler ve ürünler kârlılık kurallarına uygun görünüyor.</p>
          </div>
        ) : (
          filteredAlerts.map((a) => {
            const isCrit = a.severity === 'critical';
            const isWarn = a.severity === 'warning';

            return (
              <div
                key={a.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  a.isResolved
                    ? "bg-gray-50/70 border-gray-200 opacity-60"
                    : isCrit
                    ? "bg-red-50/50 border-red-200 hover:border-red-300"
                    : isWarn
                    ? "bg-amber-50/50 border-amber-200 hover:border-amber-300"
                    : "bg-blue-50/50 border-blue-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  {isCrit ? (
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  ) : isWarn ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="text-xs font-black text-dark">{a.title}</h5>
                      <Badge variant={isCrit ? "danger" : isWarn ? "warning" : "secondary"}>
                        {isCrit ? "Kritik" : isWarn ? "Uyarı" : "Bilgi"}
                      </Badge>
                      <span className="text-[10px] text-gray-400 font-medium">{a.createdAt}</span>
                    </div>
                    <p className="text-xs text-gray-700 mt-1 leading-relaxed">{a.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {parseFloat(a.lossAmount) > 0 && (
                    <span className="text-xs font-black text-red-600 tabular-nums mr-1">
                      -{formatCurrency(parseFloat(a.lossAmount))}
                    </span>
                  )}
                  {!a.isResolved && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] font-bold gap-1 px-2.5"
                      onClick={() => handleResolveAlert(a.id)}
                    >
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Kapat</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
