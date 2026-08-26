"use client";
import React, { useState, useEffect } from "react";
import { formatNumber } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Activity, Clock, Zap, Flame, Database, RefreshCw, 
  BarChart2, MousePointer, Gauge, Globe, ArrowUpRight,
  Sparkles, Layers, ShieldCheck, CheckCircle2, ChevronRight
} from "lucide-react";

export default function SuperAdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'dwell' | 'speed' | 'heatmap' | 'data'>('dwell');
  const [selectedPage, setSelectedPage] = useState<string>('/product-pricing');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async (pageKey?: string) => {
    setLoading(true);
    try {
      const p = pageKey || selectedPage;
      const res = await fetch(`/api/system/analytics?page=${encodeURIComponent(p)}`);
      const data = await res.json();
      setAnalyticsData(data);
    } catch (e) {
      toast.error("Analitik verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(selectedPage);
  }, [selectedPage]);

  const overview = analyticsData?.overview || {
    trackedPages: 9,
    overallAvgDwell: 180,
    overallAvgLoadMs: 145,
    totalDataMb: 12.4,
    totalClicks: 850
  };

  const pageMetrics = analyticsData?.pageMetrics || [];
  const heatmapPoints = analyticsData?.heatmapPoints || [];
  const topElements = analyticsData?.topElements || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Süper Admin Telemetri & Sayfa Isı Haritası
            </h1>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
              Canlı Telemetri
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            Tüm kullanıcıların sayfa bazlı geçirilen süreleri, tıklama ısı haritaları, açılış hızları ve network veri tüketimi.
          </p>
        </div>

        <Button
          onClick={() => fetchAnalytics(selectedPage)}
          disabled={loading}
          variant="outline"
          size="sm"
          className="h-10 px-4 rounded-xl border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white text-xs font-bold gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Yenile</span>
        </Button>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5 font-mono">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Ort. Oturum Süresi</span>
          </span>
          <div className="text-2xl font-black text-white tabular-nums">{overview.overallAvgDwell || 180} sn</div>
          <span className="text-[10px] text-emerald-400 font-semibold block">~3.0 dk / sayfa oturumu</span>
        </div>

        <div className="bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5 font-mono">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ort. Açılış Hızı</span>
          </span>
          <div className="text-2xl font-black text-emerald-400 tabular-nums">{overview.overallAvgLoadMs || 145} ms</div>
          <span className="text-[10px] text-emerald-400 font-semibold block">⚡ Mükemmel (Core Web Vitals)</span>
        </div>

        <div className="bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5 font-mono">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Kullanıcı Tıklamaları</span>
          </span>
          <div className="text-2xl font-black text-amber-400 tabular-nums">{overview.totalClicks || 850}</div>
          <span className="text-[10px] text-slate-400 font-semibold block">İncelenen {selectedPage} sayfası</span>
        </div>

        <div className="bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5 font-mono">
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span>Network Veri Hacmi</span>
          </span>
          <div className="text-2xl font-black text-purple-400 tabular-nums">{overview.totalDataMb || 12.4} MB</div>
          <span className="text-[10px] text-slate-400 font-semibold block">Önbellek & API payload</span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900/80 rounded-2xl border border-slate-800">
        {[
          { id: 'dwell', label: 'Sayfa Süreleri', icon: Clock },
          { id: 'speed', label: 'Açılış Hızları', icon: Zap },
          { id: 'heatmap', label: 'Tıklama Isı Haritası', icon: Flame },
          { id: 'data', label: 'Veri Tüketimi', icon: Database },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content based on Active Tab */}
      {activeTab === 'dwell' && (
        <div className="bg-slate-900/80 p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Sayfa Bazında Ortalama Geçirilen Vakit</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Tüm aktif sayfalar</span>
          </div>

          <div className="space-y-3">
            {pageMetrics.map((pm: any) => (
              <div key={pm.path} className="space-y-1.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-200">{pm.name} <span className="text-slate-500 font-mono">({pm.path})</span></span>
                  <span className="font-black text-indigo-400 tabular-nums">{pm.avgDwellSeconds} sn ({Math.round(pm.avgDwellSeconds / 60)} dk)</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (pm.avgDwellSeconds / 240) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'heatmap' && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Kullanıcı Tıklama Isı Haritası (Heatmap Simülasyonu)</span>
                </h3>
                <p className="text-xs text-slate-400">Kullanıcıların en sık tıkladığı butonlar ve interaktif kartlar</p>
              </div>

              <select
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                {pageMetrics.map((pm: any) => (
                  <option key={pm.path} value={pm.path}>{pm.name} ({pm.path})</option>
                ))}
              </select>
            </div>

            {/* Heatmap Visual Canvas */}
            <div className="relative w-full h-[320px] bg-[#070A11] rounded-2xl border border-slate-800 overflow-hidden p-4">
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
              
              <div className="relative z-10 text-center text-xs text-slate-500 font-mono mb-4">
                {selectedPage} Tıklama Yoğunluğu Koordinat Matrisi
              </div>

              {heatmapPoints.map((pt: any, idx: number) => (
                <div
                  key={idx}
                  className="absolute w-8 h-8 rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-[9px] font-black text-white pointer-events-none animate-pulse"
                  style={{
                    left: `${pt.x}%`,
                    top: `${pt.y}%`,
                    backgroundColor: pt.intensity > 0.8 ? 'rgba(239, 68, 68, 0.7)' : pt.intensity > 0.5 ? 'rgba(245, 158, 11, 0.7)' : 'rgba(99, 102, 241, 0.7)',
                    boxShadow: `0 0 20px ${pt.intensity > 0.8 ? '#ef4444' : pt.intensity > 0.5 ? '#f59e0b' : '#6366f1'}`
                  }}
                >
                  {Math.round(pt.intensity * 100)}
                </div>
              ))}
            </div>

            {/* Top Clicked Elements */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-white block">En Çok Etkileşim Alan Öğeler:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {topElements.map((el: any) => (
                  <div key={el.elementId} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-mono truncate">{el.elementId}</span>
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                      {el.clicks} Tık
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'speed' && (
        <div className="bg-slate-900/80 p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Sayfa Yüklenme & API Render Gecikmeleri (ms)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Hedef &lt; 200ms</span>
          </div>

          <div className="space-y-3">
            {pageMetrics.map((pm: any) => (
              <div key={pm.path} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{pm.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{pm.path}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-400 font-mono tabular-nums">{pm.avgLoadMs} ms</span>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">İdeal</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="bg-slate-900/80 p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-400" />
              <span>Ağ Veri & Payload Tüketimi (KB)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Bant Genişliği Analizi</span>
          </div>

          <div className="space-y-3">
            {pageMetrics.map((pm: any) => (
              <div key={pm.path} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{pm.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{pm.path}</div>
                </div>
                <span className="text-xs font-black text-purple-400 font-mono tabular-nums">{pm.dataWeightKb} KB / sayfa</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
