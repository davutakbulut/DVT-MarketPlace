"use client";
import React, { useState, useEffect } from 'react';
import {
  Building2,
  Store,
  Users,
  Search,
  RefreshCw,
  MapPin,
  FileText,
  DollarSign,
  TrendingUp,
  Package,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';

export default function SuperAdminCompaniesPage() {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/super-admin/companies');
      const json = await res.json();
      if (json.success) {
        setCompanies(json.companies || []);
      } else {
        toast.error(json.error || 'Firmalar yüklenemedi');
      }
    } catch (e: any) {
      toast.error('Firma verileri alınırken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter((c) =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.taxNumber || '').includes(search) ||
    (c.city || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Tüm Kayıtlı Şirketler & Mağazalar
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Platformda hesap açmış tüm kurumsal müşterileri, vergi kimliklerini ve bağlı pazaryeri mağazalarını inceleyin.
          </p>
        </div>

        <Button
          onClick={fetchCompanies}
          disabled={loading}
          variant="outline"
          size="sm"
          className="h-10 px-4 rounded-xl border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white text-xs font-bold gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Yenile</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Firma adı, vergi no veya şehir ara..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Toplam <strong className="text-white">{filteredCompanies.length}</strong> Firma
        </div>
      </div>

      {/* Company Cards Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCompanies.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono bg-slate-900/60 border border-slate-800 rounded-3xl">
            Eşleşen firma bulunamadı.
          </div>
        ) : (
          filteredCompanies.map((comp) => (
            <div
              key={comp.id}
              className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-4"
            >
              {/* Card Top: Name & Quick Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black text-lg shrink-0">
                    {comp.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">{comp.name}</h3>
                    <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400 font-mono mt-0.5">
                      <span>VKN: <strong className="text-slate-200">{comp.taxNumber || 'Belirtilmedi'}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                        {comp.city || 'İstanbul'}, {comp.country || 'Türkiye'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Toplam Ciro</span>
                    <span className="text-sm font-black text-white tabular-nums">
                      {formatCurrency(comp.totalGMV)}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-slate-800" />
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Net Kâr</span>
                    <span className="text-sm font-black text-emerald-400 tabular-nums">
                      +{formatCurrency(comp.totalProfit)}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-slate-800" />
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Sipariş</span>
                    <span className="text-sm font-black text-indigo-300 tabular-nums">
                      {comp.totalOrders} Adet
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Bottom: Stores & Authorized Users */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Stores Sub-list */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-orange-400" />
                    <span>Bağlı Pazaryeri Mağazaları ({comp.stores?.length || 0})</span>
                  </div>

                  <div className="space-y-1.5">
                    {comp.stores?.length === 0 ? (
                      <div className="text-[11px] text-slate-500 font-mono">Henüz mağaza bağlanmadı.</div>
                    ) : (
                      comp.stores.map((st: any) => (
                        <div
                          key={st.id}
                          className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/60 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Badge className={`text-[10px] font-bold uppercase ${
                              st.marketplace?.toLowerCase() === 'trendyol'
                                ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            }`}>
                              {st.marketplace}
                            </Badge>
                            <span className="font-bold text-white">{st.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">Seller ID: {st.sellerId || '-'}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Users Sub-list */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Firma Yetkilileri ({comp.users?.length || 0})</span>
                  </div>

                  <div className="space-y-1.5">
                    {comp.users?.length === 0 ? (
                      <div className="text-[11px] text-slate-500 font-mono">Kayıtlı yetkili yok.</div>
                    ) : (
                      comp.users.map((usr: any) => (
                        <div
                          key={usr.id}
                          className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/60 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{usr.fullName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({usr.email})</span>
                          </div>
                          <Badge className="bg-slate-800 text-slate-300 text-[10px]">
                            {usr.role || 'Admin'}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
