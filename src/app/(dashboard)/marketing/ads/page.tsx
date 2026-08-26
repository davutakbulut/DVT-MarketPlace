"use client";
import React, { useState, useEffect } from "react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Megaphone, Plus, Calendar, RefreshCw, Trash2, Edit3, 
  TrendingDown, ShoppingCart, Percent, FileText, ArrowUpDown, CheckCircle2 
} from "lucide-react";

export default function AdsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("2026-08");
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
      const res = await fetch(`/api/marketing/ad-invoices?periodMonth=${selectedPeriod}`);
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
  }, [selectedPeriod]);

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
    setInvoiceType(inv.invoiceType);
    setCountry(inv.country);
    setInvoiceDate(inv.invoiceDate);
    setAmountIncVat(inv.amountIncVat);
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

  const months = [
    { value: "2026-08", label: "Ağustos 2026 (Güncel)" },
    { value: "2026-07", label: "Temmuz 2026" },
    { value: "2026-06", label: "Haziran 2026" },
    { value: "2026-05", label: "Mayıs 2026" },
  ];

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
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-canvas px-3 py-1.5 rounded-xl border border-border">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-xs font-bold text-dark focus:outline-none cursor-pointer"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <Button size="sm" onClick={handleOpenAdd} className="text-xs h-8 sm:h-9 gap-1.5 font-bold shadow-xs">
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
            <span>Aylık Toplam Reklam</span>
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
            ₺{summary.adSpendPerOrder.toFixed(2)}
          </div>
          <span className="text-[11px] text-gray-500 font-medium">Toplam {summary.totalOrders.toLocaleString('tr-TR')} siparişe dağıtıldı</span>
        </div>

        {/* Reklam / Ciro Oranı (TACoS) */}
        <div className="bg-white p-4 rounded-2xl border border-border shadow-xs">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-1">
            <span>Reklam / Ciro (TACoS)</span>
            <Percent className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 tabular-nums">
            %{summary.tacosPercent.toFixed(2)}
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

      {/* Invoice Table - Exact Replica of User's Design */}
      <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                <th className="py-3 px-4 table-sticky-first-col bg-canvas flex items-center gap-1">
                  <span>Fatura Numarası</span>
                  <ArrowUpDown className="w-3 h-3 text-gray-400" />
                </th>
                <th className="py-3 px-4">Fatura Tipi</th>
                <th className="py-3 px-4">Ülke</th>
                <th className="py-3 px-4">Fatura Tarihi</th>
                <th className="py-3 px-4 text-right">Tutar (KDV Dahil)</th>
                <th className="py-3 px-4 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-canvas/50 transition-colors">
                  <td className="py-3 px-4 table-sticky-first-col font-bold text-dark font-mono">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3 px-4 text-gray-700 font-medium">
                    {inv.invoiceType}
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {inv.country}
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-600">
                    {new Date(inv.invoiceDate).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-dark tabular-nums text-sm">
                    -{formatCurrency(parseFloat(inv.amountIncVat))}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(inv)}
                        className="p-1 text-gray-500 hover:text-primary rounded-lg hover:bg-canvas transition-colors"
                        title="Düzenle"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(inv.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">
                    Bu ay için henüz fatura girilmemiş. "Yeni Fatura Ekle" butonunu kullanarak ekleyebilirsiniz.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Invoice Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-dark/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-border shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h4 className="text-sm font-bold text-dark flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                {editingInvoice ? 'Reklam Faturasını Düzenle' : 'Yeni Reklam Faturası Ekle'}
              </h4>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-dark">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-dark block mb-1">Fatura Numarası</label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border text-xs font-mono font-bold"
                  placeholder="Örn: DDF2026019354227"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-dark block mb-1">Fatura Tipi</label>
                  <input
                    type="text"
                    value={invoiceType}
                    onChange={(e) => setInvoiceType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-dark block mb-1">Ülke</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-dark block mb-1">Fatura Tarihi</label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-dark block mb-1">Tutar (KDV Dahil ₺)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amountIncVat}
                    onChange={(e) => setAmountIncVat(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-primary text-xs font-bold text-primary bg-primary-tint-50/20"
                    placeholder="2000.00"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)} className="text-xs">
                  Vazgeç
                </Button>
                <Button type="submit" size="sm" className="text-xs font-bold shadow-xs">
                  Veritabanına Kaydet
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
