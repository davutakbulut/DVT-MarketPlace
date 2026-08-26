"use client";
import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Filter,
  RefreshCw,
  Store,
  Building2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { toast } from 'sonner';

export default function SuperAdminTransactionsPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [marketplace, setMarketplace] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pagination, setPagination] = useState<any>({ total: 0, totalPages: 1 });

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        marketplace,
        page: page.toString(),
        pageSize: pageSize.toString()
      });

      const res = await fetch(`/api/super-admin/transactions?${params}`);
      const json = await res.json();
      if (json.success) {
        setOrders(json.orders || []);
        setPagination(json.pagination || { total: 0, totalPages: 1 });
      } else {
        toast.error(json.error || 'İşlemler yüklenemedi');
      }
    } catch (e: any) {
      toast.error('İşlem verileri alınırken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, pageSize, marketplace]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Küresel Canlı İşlemler & Sipariş Akışı
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Tüm şirketlerin ve pazaryeri mağazalarının siparişlerini, komisyon, kargo ve net kâr dökümlerini tek ekranda inceleyin.
          </p>
        </div>

        <Button
          onClick={fetchTransactions}
          disabled={loading}
          variant="outline"
          size="sm"
          className="h-10 px-4 rounded-xl border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white text-xs font-bold gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Yenile</span>
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <form onSubmit={handleSearchSubmit} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sipariş no, firma, mağaza veya şehir..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            {['all', 'trendyol', 'hepsiburada'].map((mp) => (
              <button
                key={mp}
                type="button"
                onClick={() => { setMarketplace(mp); setPage(1); }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  marketplace === mp
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mp === 'all' ? 'Tümü' : mp.charAt(0).toUpperCase() + mp.slice(1)}
              </button>
            ))}
          </div>

          <Button type="submit" size="sm" className="h-10 px-4 rounded-xl bg-indigo-600 text-white font-bold text-xs">
            Ara
          </Button>
        </div>
      </form>

      {/* Orders Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase font-mono text-[10px] bg-slate-950/40">
                <th className="p-4 font-semibold">Sipariş No</th>
                <th className="p-4 font-semibold">Firma & Mağaza</th>
                <th className="p-4 font-semibold">Pazaryeri</th>
                <th className="p-4 font-semibold">Teslim Şehri</th>
                <th className="p-4 font-semibold text-right">Brüt Ciro</th>
                <th className="p-4 font-semibold text-right">Komisyon</th>
                <th className="p-4 font-semibold text-right">Kargo</th>
                <th className="p-4 font-semibold text-right">Net Kâr</th>
                <th className="p-4 font-semibold text-right">Kâr Marjı</th>
                <th className="p-4 font-semibold text-right">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500 font-mono">
                    Kayıtlı işlem bulunamadı.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-white">
                      #{ord.order_number}
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-slate-200">{ord.company_name}</div>
                      <div className="text-[10px] text-slate-500">{ord.store_name}</div>
                    </td>

                    <td className="p-4">
                      <Badge className={`text-[10px] font-bold uppercase ${
                        ord.marketplace?.toLowerCase() === 'trendyol'
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}>
                        {ord.marketplace}
                      </Badge>
                    </td>

                    <td className="p-4 text-slate-400">
                      {ord.customer_city || '-'}
                    </td>

                    <td className="p-4 text-right font-bold text-white tabular-nums">
                      {formatCurrency(ord.gross_amount)}
                    </td>

                    <td className="p-4 text-right text-slate-400 tabular-nums">
                      {formatCurrency(ord.commission_amount || 0)}
                    </td>

                    <td className="p-4 text-right text-slate-400 tabular-nums">
                      {formatCurrency(ord.shipping_cost || 0)}
                    </td>

                    <td className="p-4 text-right font-bold text-emerald-400 tabular-nums">
                      +{formatCurrency(ord.net_profit)}
                    </td>

                    <td className="p-4 text-right font-mono font-bold text-indigo-300 tabular-nums">
                      %{parseFloat(ord.profit_margin || '0').toFixed(1)}
                    </td>

                    <td className="p-4 text-right font-mono text-[11px] text-slate-500">
                      {new Date(ord.order_date).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-mono">
          <div>
            Toplam <strong>{pagination.total}</strong> işlem kaydı (Sayfa {page} / {pagination.totalPages || 1})
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="h-8 px-2.5 rounded-lg border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-white font-bold">
              {page}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="h-8 px-2.5 rounded-lg border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
