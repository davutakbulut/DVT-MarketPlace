"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Crown,
  DollarSign,
  TrendingUp,
  Package,
  Building2,
  Store,
  Users,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  ArrowRight,
  RefreshCw,
  Clock,
  Sparkles,
  Search,
  ChevronRight,
  AlertTriangle,
  Receipt,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { toast } from 'sonner';

export default function SuperAdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/super-admin/stats');
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        toast.error(json.error || 'İstatistikler yüklenemedi');
      }
    } catch (e: any) {
      toast.error('İstatistikler alınırken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const totals = data?.totals || {
    totalGMV: 0,
    totalNetProfit: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    totalCompanies: 0,
    totalStores: 0,
    totalUsers: 0,
    activeCrashes: 0,
    platformProfitMargin: 0
  };

  const companies = data?.companies || [];
  const recentOrders = data?.recentOrders || [];

  return (
    <div className="space-y-6">
      {/* 1. Page Header with Master Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-[#10172A] to-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Crown className="w-6 h-6 text-amber-400" />
              Süper Admin Global Komuta Merkezi
            </span>
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs px-2.5 py-0.5">
              Tüm Firmalar & Veriler
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            Platformdaki tüm şirketlerin, mağazaların, siparişlerin ve sistem telemetrisinin anlık küresel özeti.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={fetchStats}
            disabled={loading}
            variant="outline"
            size="sm"
            className="h-10 px-4 rounded-xl border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white text-xs font-bold gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Verileri Yenile</span>
          </Button>

          <Link href="/super-admin/users">
            <Button size="sm" className="h-10 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Kullanıcıları Yönet</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Global Top-Level KPI Grid (8 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total GMV */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Toplam Platform Cirosu</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-white tabular-nums">
            {formatCurrency(totals.totalGMV)}
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
            <span>Tüm pazaryerleri brüt hacmi</span>
          </div>
        </div>

        {/* Total Net Profit */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Toplam Net Kâr</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-400 tabular-nums">
            {formatCurrency(totals.totalNetProfit)}
          </div>
          <div className="text-[10px] text-emerald-400/80 flex items-center gap-1 font-mono">
            <span>Ortalama Kâr Marjı: %{totals.platformProfitMargin.toFixed(1)}</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Toplam Sipariş Hacmi</span>
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-white tabular-nums">
            {totals.totalOrders.toLocaleString('tr-TR')} Adet
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
            <span>Ort. Sepet: {formatCurrency(totals.avgOrderValue)}</span>
          </div>
        </div>

        {/* Companies & Stores */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Kayıtlı Firmalar</span>
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-white tabular-nums">
            {totals.totalCompanies} Firma
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
            <span>{totals.totalStores} Aktif Mağaza / {totals.totalUsers} Kullanıcı</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Company Performance Leaderboard & Global Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Company Performance Ranking */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                Firma Kârlılık & Ciro Lider Tablosu
              </h3>
              <p className="text-xs text-slate-400">En yüksek işlem hacmine sahip kayıtlı şirketler</p>
            </div>
            <Link href="/super-admin/companies">
              <Button variant="ghost" size="sm" className="text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40 p-2">
                Tümünü Gör ➔
              </Button>
            </Link>
          </div>

          <div className="space-y-2.5">
            {companies.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs font-mono">
                Henüz kayıtlı firma bulunmuyor.
              </div>
            ) : (
              companies.map((comp: any, idx: number) => (
                <div
                  key={comp.id}
                  className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                      idx === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      idx === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{comp.name}</h4>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                        <span>VN: {comp.tax_number || 'Belirtilmedi'}</span>
                        <span>•</span>
                        <span>{comp.store_count} Mağaza</span>
                        <span>•</span>
                        <span>{comp.order_count} Sipariş</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-white tabular-nums">
                      {formatCurrency(comp.gmv)}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-400 tabular-nums">
                      +{formatCurrency(comp.profit)} Net Kâr
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 5 Cols: Quick Navigation & Telemetry Health */}
        <div className="lg:col-span-5 space-y-4">
          {/* Quick Access Matrix */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Süper Admin Hızlı Eylemler
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Link href="/super-admin/users" className="block">
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-950/20 transition-all text-left">
                  <Users className="w-4 h-4 text-indigo-400 mb-1.5" />
                  <div className="text-xs font-bold text-white">Kullanıcı İzinleri</div>
                  <div className="text-[10px] text-slate-400">Rol ve Süper Admin atama</div>
                </div>
              </Link>

              <Link href="/super-admin/transactions" className="block">
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-950/20 transition-all text-left">
                  <Receipt className="w-4 h-4 text-emerald-400 mb-1.5" />
                  <div className="text-xs font-bold text-white">Küresel Siparişler</div>
                  <div className="text-[10px] text-slate-400">Tüm mağaza akışı</div>
                </div>
              </Link>

              <Link href="/super-admin/analytics" className="block">
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-950/20 transition-all text-left">
                  <Activity className="w-4 h-4 text-sky-400 mb-1.5" />
                  <div className="text-xs font-bold text-white">Sayfa Isı Haritası</div>
                  <div className="text-[10px] text-slate-400">Kullanıcı telemetrisi</div>
                </div>
              </Link>

              <Link href="/super-admin/crashes" className="block">
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-950/20 transition-all text-left">
                  <ShieldAlert className="w-4 h-4 text-rose-400 mb-1.5" />
                  <div className="text-xs font-bold text-white">Çökme & Hatalar</div>
                  <div className="text-[10px] text-slate-400">{totals.activeCrashes} aktif hata</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Real-time Telemetry Health Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-3">
            <h3 className="text-sm font-black text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Altyapı & Veritabanı Durumu
              </span>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                Çevrimiçi
              </Badge>
            </h3>

            <div className="space-y-2 text-xs font-mono text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">PostgreSQL Sunucusu:</span>
                <span className="text-white font-bold">Supabase Dedicated Pool</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Ortalama API Yanıtı:</span>
                <span className="text-emerald-400 font-bold">14 ms</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">2026 Barem Kuralları:</span>
                <span className="text-indigo-300 font-bold">Aktif & Senkron</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Geliştirici / Sahip:</span>
                <span className="text-amber-400 font-bold">Davut Akbulut</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Cross-Tenant Recent Live Orders Feed */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              Küresel Canlı Sipariş Akışı (Tüm Mağazalar)
            </h3>
            <p className="text-xs text-slate-400">Farklı şirket ve pazaryerlerinden anlık düşen son işlemler</p>
          </div>
          <Link href="/super-admin/transactions">
            <Button variant="ghost" size="sm" className="text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40 p-2">
              Tüm Siparişleri Filtrele ➔
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase font-mono text-[10px]">
                <th className="pb-3 font-semibold">Sipariş No</th>
                <th className="pb-3 font-semibold">Firma & Mağaza</th>
                <th className="pb-3 font-semibold">Pazaryeri</th>
                <th className="pb-3 font-semibold">Şehir</th>
                <th className="pb-3 font-semibold text-right">Brüt Tutar</th>
                <th className="pb-3 font-semibold text-right">Net Kâr</th>
                <th className="pb-3 font-semibold text-center">Durum</th>
                <th className="pb-3 font-semibold text-right">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500 font-mono">
                    Kayıtlı sipariş bulunamadı.
                  </td>
                </tr>
              ) : (
                recentOrders.map((ord: any) => (
                  <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-mono font-bold text-white">
                      #{ord.order_number}
                    </td>
                    <td className="py-3">
                      <div className="font-bold text-slate-200">{ord.company_name}</div>
                      <div className="text-[10px] text-slate-500">{ord.store_name}</div>
                    </td>
                    <td className="py-3">
                      <Badge className={`text-[10px] font-bold uppercase ${
                        ord.marketplace?.toLowerCase() === 'trendyol'
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}>
                        {ord.marketplace}
                      </Badge>
                    </td>
                    <td className="py-3 text-slate-400">
                      {ord.customer_city || '-'}
                    </td>
                    <td className="py-3 text-right font-bold text-white tabular-nums">
                      {formatCurrency(ord.gross_amount)}
                    </td>
                    <td className="py-3 text-right font-bold text-emerald-400 tabular-nums">
                      +{formatCurrency(ord.net_profit)}
                    </td>
                    <td className="py-3 text-center">
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                        {ord.status || 'Tamamlandı'}
                      </Badge>
                    </td>
                    <td className="py-3 text-right text-slate-500 font-mono text-[11px]">
                      {new Date(ord.order_date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
