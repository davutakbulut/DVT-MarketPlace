"use client";
import React, { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Truck, RefreshCw, Save, Download, Filter, Search, 
  CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, 
  Sparkles, Layers, DollarSign, ExternalLink, HelpCircle
} from "lucide-react";

export default function CargoBaremPage() {
  const [baremTiers, setBaremTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState("all");
  const [search, setSearch] = useState("");

  const fetchTiers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tariffs/cargo-barem');
      const data = await res.json();
      const tiers = Array.isArray(data) ? data : (data.tiers || []);
      setBaremTiers(tiers);
    } catch (e) {
      console.error(e);
      toast.error("Kargo barem verileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTiers();
  }, []);

  const handlePriceChange = (id: string, field: 'discountedPriceExVat' | 'standardPriceExVat', value: number) => {
    setBaremTiers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value, isEdited: true } : t))
    );
  };

  const handleSaveTier = async (tier: any) => {
    setSavingId(tier.id);
    try {
      const res = await fetch('/api/tariffs/cargo-barem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tier.id,
          discountedPriceExVat: tier.discountedPriceExVat,
          standardPriceExVat: tier.standardPriceExVat,
        }),
      });

      if (res.ok) {
        setBaremTiers((prev) =>
          prev.map((t) => (t.id === tier.id ? { ...t, isEdited: false } : t))
        );
        toast.success(`${tier.carrierName} - ${tier.tierName} barem fiyatı veritabanına kaydedildi!`);
      } else {
        toast.error("Kaydedilirken hata oluştu.");
      }
    } catch (e) {
      toast.error("Sunucu bağlantı hatası.");
    } finally {
      setSavingId(null);
    }
  };

  const handleExportCSV = () => {
    if (baremTiers.length === 0) {
      toast.error("İndirilecek barem verisi yok.");
      return;
    }

    const headers = "Kargo Firmasi,Kademe Adi,Min Tutar (TL),Max Tutar (TL),Avantajli Fiyat (KDV Haric),Avantajli Fiyat (KDV Dahil),Standart Fiyat (KDV Haric),Standart Fiyat (KDV Dahil)";
    const rows = baremTiers.map((t) => {
      const discEx = parseFloat(t.discountedPriceExVat || 0);
      const stdEx = parseFloat(t.standardPriceExVat || 0);
      return `"${t.carrierName}","${t.tierName}",${t.minAmount},${t.maxAmount},${discEx.toFixed(2)},${(discEx * 1.20).toFixed(2)},${stdEx.toFixed(2)},${(stdEx * 1.20).toFixed(2)}`;
    });

    const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Trendyol_Kargo_Barem_Destek_Tarifesi_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Kargo barem tarifesi başarıyla indirildi!");
  };

  const carriersList = Array.from(new Set(baremTiers.map((t) => t.carrierName))).filter(Boolean);

  const filteredTiers = baremTiers.filter((t) => {
    const matchesCarrier = selectedCarrier === "all" || t.carrierName === selectedCarrier;
    const matchesSearch = !search || 
      t.carrierName.toLowerCase().includes(search.toLowerCase()) ||
      t.tierName.toLowerCase().includes(search.toLowerCase());
    return matchesCarrier && matchesSearch;
  });

  const getCarrierBadgeColor = (carrier: string) => {
    switch (carrier?.toUpperCase()) {
      case 'TEX':
      case 'TRENDYOL EXPRESS':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'ARAS':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'SURAT':
      case 'SÜRAT':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'MNG':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'YK':
      case 'YURTİÇİ':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'PTT':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      default:
        return 'bg-canvas text-dark border-border';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-black text-dark flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              <span>Trendyol Kargo Barem Destek Sistemi</span>
            </h3>
            <Badge variant="excellent" className="text-[10px] sm:text-xs">
              {baremTiers.length} Kademe Aktif
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Sipariş sepet tutarına göre uygulanan resmi avantajlı ve standart kargo barem fiyatları listesi (KDV %20)
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <Button 
            size="sm" 
            onClick={handleExportCSV} 
            className="h-8 sm:h-9 px-3 rounded-2xl text-xs gap-1.5 font-bold shadow-xs bg-primary hover:bg-primary-hover text-white cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel İndir</span>
          </Button>

          <Button 
            size="sm" 
            variant="outline" 
            onClick={fetchTiers} 
            className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-2xl text-xs gap-1.5 font-bold bg-white hover:bg-canvas text-dark border-border shadow-xs cursor-pointer"
            title="Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Yenile</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Kayıtlı Kargo Barem</span>
          <div className="text-xl sm:text-2xl font-black text-dark tabular-nums">{baremTiers.length} Kademe</div>
          <span className="text-[11px] text-gray-400 font-medium block">Tüm Kargo Partnerleri</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">En Uygun Barem (1. Kademe)</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 tabular-nums">₺38,50 <span className="text-xs font-bold text-gray-400">+KDV</span></div>
          <span className="text-[11px] text-emerald-700 font-bold block">₺46,20 KDV Dahil (TEX)</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">2. Kademe Avantajı</span>
          <div className="text-xl sm:text-2xl font-black text-primary tabular-nums">₺46,50 <span className="text-xs font-bold text-gray-400">+KDV</span></div>
          <span className="text-[11px] text-primary font-bold block">₺55,80 KDV Dahil (TEX)</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Barem KDV Oranı</span>
          <div className="text-xl sm:text-2xl font-black text-dark tabular-nums">%20</div>
          <span className="text-[11px] text-gray-500 font-medium block">Resmi Kargo KDV Oranı</span>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-white p-3 sm:p-4 rounded-3xl border border-border shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* CARRIER TABS */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            <button
              onClick={() => setSelectedCarrier('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedCarrier === 'all' ? 'bg-primary text-white shadow-xs' : 'bg-canvas text-gray-600 hover:text-dark'
              }`}
            >
              Tüm Kargolar ({baremTiers.length})
            </button>
            {carriersList.map((carrier) => (
              <button
                key={carrier}
                onClick={() => setSelectedCarrier(carrier)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCarrier === carrier 
                    ? 'bg-primary text-white shadow-xs' 
                    : 'bg-canvas text-gray-600 hover:text-dark'
                }`}
              >
                <span>{carrier}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${selectedCarrier === carrier ? 'bg-white/20 text-white' : 'bg-white text-gray-500 border border-border'}`}>
                  {baremTiers.filter(t => t.carrierName === carrier).length}
                </span>
              </button>
            ))}
          </div>

          {/* SEARCH INPUT */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Kademe veya kargo ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border text-xs font-bold text-dark bg-white focus:ring-2 focus:ring-primary shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* TABLE / CARD CONTAINER */}
      <div data-tour="barem-matrix" className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-xs text-gray-500 font-bold">Kargo barem kademeleri yükleniyor...</p>
          </div>
        ) : filteredTiers.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Truck className="w-10 h-10 text-gray-300 mx-auto" />
            <h4 className="text-sm font-bold text-dark">Kriterlere Uygun Kargo Barem Kademesi Bulunamadı</h4>
            <p className="text-xs text-gray-400">Arama veya filtre kriterlerinizi değiştirin.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (hidden on small mobile, visible on sm+) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-canvas/40 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Kargo Firması</th>
                    <th className="py-3.5 px-4">Satış Tutarı Kademesi</th>
                    <th className="py-3.5 px-4 text-emerald-800">Avantajlı Fiyat (KDV Hariç / Dahil)</th>
                    <th className="py-3.5 px-4 text-rose-800">Standart Fiyat (KDV Hariç / Dahil)</th>
                    <th className="py-3.5 px-4 text-center">Fiyat Avantajı</th>
                    <th className="py-3.5 px-4 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredTiers.map((tier) => {
                    const discEx = parseFloat(tier.discountedPriceExVat || 0);
                    const discInc = discEx * 1.20;
                    const stdEx = parseFloat(tier.standardPriceExVat || 0);
                    const stdInc = stdEx * 1.20;
                    const savings = stdInc - discInc;

                    return (
                      <tr key={tier.id} className={`hover:bg-canvas/50 transition-colors ${tier.isEdited ? 'bg-primary-tint-50/20' : ''}`}>
                        {/* Carrier Badge */}
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${getCarrierBadgeColor(tier.carrierName)}`}>
                            {tier.carrierName}
                          </span>
                        </td>

                        {/* Tier Name */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-dark text-xs block">{tier.tierName}</span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {formatCurrency(parseFloat(tier.minAmount || 0))} - {parseFloat(tier.maxAmount) > 9999 ? 've üzeri' : formatCurrency(parseFloat(tier.maxAmount || 0))}
                          </span>
                        </td>

                        {/* Discounted Price Input */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="relative w-28">
                              <span className="absolute left-2.5 top-2 text-xs font-bold text-emerald-700">₺</span>
                              <input
                                type="number"
                                step="0.01"
                                value={tier.discountedPriceExVat}
                                onChange={(e) => handlePriceChange(tier.id, 'discountedPriceExVat', parseFloat(e.target.value) || 0)}
                                className="w-full pl-6 pr-2 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50/40 text-xs font-black text-emerald-900 focus:ring-2 focus:ring-emerald-500 tabular-nums shadow-xs"
                              />
                            </div>
                            <span className="text-[11px] font-bold text-emerald-700 tabular-nums">
                              ({formatCurrency(discInc)} Dahil)
                            </span>
                          </div>
                        </td>

                        {/* Standard Price Input */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="relative w-28">
                              <span className="absolute left-2.5 top-2 text-xs font-bold text-rose-700">₺</span>
                              <input
                                type="number"
                                step="0.01"
                                value={tier.standardPriceExVat}
                                onChange={(e) => handlePriceChange(tier.id, 'standardPriceExVat', parseFloat(e.target.value) || 0)}
                                className="w-full pl-6 pr-2 py-1.5 rounded-xl border border-rose-300 bg-rose-50/40 text-xs font-black text-rose-900 focus:ring-2 focus:ring-rose-500 tabular-nums shadow-xs"
                              />
                            </div>
                            <span className="text-[11px] font-bold text-rose-700 tabular-nums">
                              ({formatCurrency(stdInc)} Dahil)
                            </span>
                          </div>
                        </td>

                        {/* Savings Badge */}
                        <td className="py-3.5 px-4 text-center">
                          {savings > 0 ? (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 tabular-nums">
                              +{formatCurrency(savings)} Kazanç
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>

                        {/* Save Action */}
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            size="sm"
                            disabled={savingId === tier.id}
                            onClick={() => handleSaveTier(tier)}
                            className={`h-8 text-xs font-bold rounded-xl px-3 cursor-pointer shadow-xs transition-all ${
                              tier.isEdited 
                                ? 'bg-primary text-white hover:bg-primary-hover ring-2 ring-primary/20' 
                                : 'bg-canvas text-dark hover:bg-border/60 border border-border'
                            }`}
                          >
                            <Save className={`w-3.5 h-3.5 ${savingId === tier.id ? 'animate-spin' : ''}`} />
                            <span>{savingId === tier.id ? "Kaydediliyor..." : tier.isEdited ? "Kaydet *" : "Kaydet"}</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Grid View (visible only on xs mobile < sm) */}
            <div className="sm:hidden divide-y divide-border/60 p-2 space-y-3">
              {filteredTiers.map((tier) => {
                const discEx = parseFloat(tier.discountedPriceExVat || 0);
                const discInc = discEx * 1.20;
                const stdEx = parseFloat(tier.standardPriceExVat || 0);
                const stdInc = stdEx * 1.20;
                const savings = stdInc - discInc;

                return (
                  <div key={tier.id} className="p-3 bg-white rounded-2xl border border-border shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-black border ${getCarrierBadgeColor(tier.carrierName)}`}>
                        {tier.carrierName}
                      </span>
                      <span className="font-bold text-dark text-xs">{tier.tierName}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Discounted Input */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-emerald-700 block">Avantajlı (KDV Hariç)</span>
                        <div className="relative">
                          <span className="absolute left-2 top-1.5 text-xs font-bold text-emerald-700">₺</span>
                          <input
                            type="number"
                            step="0.01"
                            value={tier.discountedPriceExVat}
                            onChange={(e) => handlePriceChange(tier.id, 'discountedPriceExVat', parseFloat(e.target.value) || 0)}
                            className="w-full pl-5 pr-2 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50/40 text-xs font-black text-emerald-900"
                          />
                        </div>
                        <span className="text-[10px] text-emerald-700 font-bold block">{formatCurrency(discInc)} KDV Dahil</span>
                      </div>

                      {/* Standard Input */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-rose-700 block">Standart (KDV Hariç)</span>
                        <div className="relative">
                          <span className="absolute left-2 top-1.5 text-xs font-bold text-rose-700">₺</span>
                          <input
                            type="number"
                            step="0.01"
                            value={tier.standardPriceExVat}
                            onChange={(e) => handlePriceChange(tier.id, 'standardPriceExVat', parseFloat(e.target.value) || 0)}
                            className="w-full pl-5 pr-2 py-1.5 rounded-xl border border-rose-300 bg-rose-50/40 text-xs font-black text-rose-900"
                          />
                        </div>
                        <span className="text-[10px] text-rose-700 font-bold block">{formatCurrency(stdInc)} KDV Dahil</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {savings > 0 ? (
                        <span className="text-[10px] font-bold text-emerald-700">
                          Fark: +{formatCurrency(savings)}
                        </span>
                      ) : <span />}

                      <Button
                        size="sm"
                        disabled={savingId === tier.id}
                        onClick={() => handleSaveTier(tier)}
                        className={`h-7 text-xs font-bold rounded-xl px-3 ${
                          tier.isEdited ? 'bg-primary text-white' : 'bg-canvas text-dark border border-border'
                        }`}
                      >
                        <Save className="w-3 h-3" />
                        <span>{tier.isEdited ? "Kaydet *" : "Kaydet"}</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
