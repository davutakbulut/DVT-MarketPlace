"use client";
import React, { useState, useEffect } from "react";
import { formatCurrency, formatCurrencyNoCents, formatPercentage } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TablePagination } from "@/components/common/TablePagination";
import { useDateStore } from "@/store/useDateStore";
import { useTenantStore } from "@/stores/useTenantStore";
import { 
  Megaphone, Plus, Calendar, RefreshCw, Trash2, Edit3, 
  TrendingDown, ShoppingCart, Percent, FileText, ArrowUpDown, CheckCircle2 
} from "lucide-react";

export default function AdsPage() {
  const { period, startDate, endDate, label } = useDateStore();
  const { activeStoreId } = useTenantStore();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalAdSpend: 0,
    invoiceCount: 0,
    totalOrders: 0,
    grossRevenue: 0,
    adSpendPerOrder: 0,
    tacosPercent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceType, setInvoiceType] = useState("Reklam Bedeli");
  const [country, setCountry] = useState("Türkiye");
  const [invoiceDate, setInvoiceDate] = useState("2026-08-26");
  const [amountIncVat, setAmountIncVat] = useState(2000);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let url = `/api/marketing/ad-invoices?period=${period}&storeId=${activeStoreId}`;
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setInvoices(data.invoices || []);
      setSummary(data.summary || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [period, startDate, endDate, activeStoreId]);

  const handleOpenAdd = () => {
    setEditingInvoice(null);
    setInvoiceNumber(`DDF20260${Math.floor(1000000 + Math.random() * 9000000)}`);
    setInvoiceType("Reklam Bedeli");
    setCountry("Türkiye");
    setInvoiceDate("2026-08-26");
    setAmountIncVat(2000);
    setModalOpen(true);
  };

  const handleOpenEdit = (inv: any) => {
    setEditingInvoice(inv);
    setInvoiceNumber(inv.invoiceNumber);
    setInvoiceType(inv.invoiceType || inv.campaignType || "Reklam Bedeli");
    setCountry(inv.country || "Türkiye");
    setInvoiceDate(inv.invoiceDate);
    setAmountIncVat(parseFloat(inv.amountIncVat ?? inv.amount ?? 2000));
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/marketing/ad-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingInvoice?.id,
          invoiceNumber,
          invoiceType,
          country,
          invoiceDate,
          amountIncVat: Math.abs(amountIncVat),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setModalOpen(false);
        fetchInvoices();
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Fatura kaydedilirken hata oluştu.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu reklam faturasını silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/marketing/ad-invoices?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Fatura veritabanından silindi.");
        fetchInvoices();
      }
    } catch (err) {
      toast.error("Silinemedi.");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-dark">Reklamlarım & Reklam Faturaları</h3>
            <Badge variant="excellent">Aylık Dağıtım Motoru</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pazaryeri reklam faturalarınızı yönetin; dönem içerisindeki tüm siparişlere otomatik paylaştırarak gerçek net kârınızı hesaplayın.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Global Header Date Range Indicator */}
          <div className="flex items-center gap-1.5 bg-canvas px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-dark">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span suppressHydrationWarning>Dönem: {label}</span>
          </div>

          <Button size="sm" onClick={handleOpenAdd} className="text-xs h-8 sm:h-9 gap-1.5 font-bold shadow-xs bg-primary hover:bg-primary-hover text-white">
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Fatura Ekle</span>
          </Button>

          <Button size="sm" variant="ghost" onClick={fetchInvoices} className="h-8 sm:h-9 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards: Reklam Dağıtım İstatistikleri */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Toplam Reklam Harcaması */}
        <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-1">
            <span>Dönem Toplam Reklam</span>
            <Megaphone className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-red-600 tabular-nums">
            -{formatCurrency(summary.totalAdSpend)}
          </div>
          <span className="text-[11px] text-gray-400 font-medium">{summary.invoiceCount} adet onaylı fatura</span>
        </div>

        {/* Sipariş Başına Düşen Reklam Maliyeti */}
        <div className="bg-white p-4 rounded-2xl border border-primary-tint-200 bg-primary-tint-50/20 shadow-xs">
          <div className="flex items-center justify-between text-xs text-primary font-bold mb-1">
            <span>Sipariş Başına Reklam</span>
            <ShoppingCart className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-primary tabular-nums">
            ₺{(summary.adSpendPerOrder || 0).toFixed(2)}
          </div>
          <span className="text-[11px] text-gray-500 font-medium">Toplam {(summary.totalOrders || 0).toLocaleString('tr-TR')} siparişe dağıtıldı</span>
        </div>

        {/* Reklam / Ciro Oranı (TACoS) */}
        <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-1">
            <span>Reklam / Ciro (TACoS)</span>
            <Percent className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 tabular-nums">
            %{(summary.tacosPercent || 0).toFixed(2)}
          </div>
          <span className="text-[11px] text-gray-400 font-medium">Toplam cironun reklam payı</span>
        </div>

        {/* Dağıtım Durumu */}
        <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-1">
            <span>Dağıtım Durumu</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-sm font-bold text-dark mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            Tüm Siparişlere İşlendi
          </div>
          <span className="text-[11px] text-gray-400 font-medium">Kârlılık hesaplarına otomatik yansır</span>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
        {invoices.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FileText className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs font-bold text-gray-500">Seçili dönemde kayıtlı reklam faturası bulunamadı.</p>
            <Button size="sm" onClick={handleOpenAdd} className="text-xs font-bold gap-1 mt-2">
              <Plus className="w-3.5 h-3.5" />
              <span>İlk Faturayı Ekle</span>
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                    <th className="py-3 px-4 table-sticky-first-col bg-canvas">Fatura No</th>
                    <th className="py-3 px-4">Tarih</th>
                    <th className="py-3 px-4">Kampanya Türü</th>
                    <th className="py-3 px-4 text-primary font-bold">Harcama Tutarı (₺)</th>
                    <th className="py-3 px-4">KDV (%20)</th>
                    <th className="py-3 px-4">Durum</th>
                    <th className="py-3 px-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {invoices.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((inv) => {
                    const amountVal = parseFloat(inv.amountIncVat ?? inv.amount ?? 0);
                    const vatVal = parseFloat(inv.vatAmount ?? (amountVal * 20 / 120));
                    return (
                      <tr key={inv.id} className="hover:bg-canvas/50 transition-colors">
                        <td className="py-3 px-4 table-sticky-first-col font-bold text-dark font-mono">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3 px-4 text-gray-500 tabular-nums">{inv.invoiceDate}</td>
                        <td className="py-3 px-4 font-semibold text-gray-700">{inv.invoiceType || inv.campaignType || "Reklam Bedeli"}</td>
                        <td className="py-3 px-4 font-black text-primary tabular-nums">
                          ₺{amountVal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-gray-600 tabular-nums">
                          ₺{vatVal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 font-bold">
                          <Badge variant="excellent">İşlendi</Badge>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(inv)} className="h-7 w-7 p-0 text-gray-500 hover:text-dark">
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(inv.id)} className="h-7 w-7 p-0 text-red-500 hover:text-red-700">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch-Friendly Card View */}
            <div className="block md:hidden divide-y divide-border/60">
              {invoices.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((inv) => {
                const amountVal = parseFloat(inv.amountIncVat ?? inv.amount ?? 0);
                return (
                  <div key={inv.id} className="p-3.5 space-y-2.5 bg-white hover:bg-canvas/30 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-dark font-mono">{inv.invoiceNumber}</span>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="excellent" className="text-[10px]">İşlendi</Badge>
                        <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(inv)} className="h-6 w-6 p-0 text-gray-500">
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(inv.id)} className="h-6 w-6 p-0 text-red-500">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 bg-canvas/60 p-2.5 rounded-2xl border border-border/80 text-[11px]">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">Tarih</span>
                        <span className="font-bold text-dark">{inv.invoiceDate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">Tür</span>
                        <span className="font-bold text-gray-700 truncate block">{inv.invoiceType || inv.campaignType || "Reklam Bedeli"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">Tutar</span>
                        <span className="font-black text-primary tabular-nums">₺{amountVal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        <TablePagination currentPage={currentPage} totalPages={Math.ceil(invoices.length / pageSize) || 1} pageSize={pageSize} totalItems={invoices.length} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
      </div>

      {/* Add / Edit Invoice Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-dark/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-border shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h4 className="text-sm font-black text-dark">
                {editingInvoice ? 'Reklam Faturasını Düzenle' : 'Yeni Reklam Faturası Ekle'}
              </h4>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-dark text-xs font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Fatura Numarası</label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border font-mono text-dark bg-canvas"
                  placeholder="DDF2026..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Fatura Tarihi</label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border text-dark"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Harcama Tutarı (₺)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amountIncVat}
                    onChange={(e) => setAmountIncVat(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-border text-dark font-bold text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Kampanya / Fatura Türü</label>
                <select
                  value={invoiceType}
                  onChange={(e) => setInvoiceType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border text-dark"
                >
                  <option value="Reklam Bedeli">Trendyol Reklam Bedeli</option>
                  <option value="Arama Reklamı">Arama / Kelime Reklamı</option>
                  <option value="Görüntülü Reklam">Görüntülü Banner Reklam</option>
                  <option value="Sosyal Medya">Sosyal Medya / Fenomen İşbirliği</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="text-xs">
                  Vazgeç
                </Button>
                <Button type="submit" className="text-xs font-bold bg-primary hover:bg-primary-hover text-white">
                  {editingInvoice ? 'Güncelle' : 'Kaydet'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
