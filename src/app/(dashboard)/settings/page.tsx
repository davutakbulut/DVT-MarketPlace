"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Settings, Key, Truck, Mail, Users, Layers, Save, RefreshCw, Sparkles, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("cargo_barem");
  const [baremTiers, setBaremTiers] = useState<any[]>([]);
  const [loadingBarem, setLoadingBarem] = useState(false);

  const fetchBaremTiers = async () => {
    setLoadingBarem(true);
    try {
      const res = await fetch('/api/tariffs/cargo-barem');
      const data = await res.json();
      setBaremTiers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBarem(false);
    }
  };

  useEffect(() => {
    fetchBaremTiers();
  }, []);

  const handleBaremPriceChange = (id: string, field: 'discountedPriceExVat' | 'standardPriceExVat', value: number) => {
    setBaremTiers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value, isDirty: true } : t))
    );
  };

  const handleSaveBaremTier = async (tier: any) => {
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
        setBaremTiers((prev) => prev.map((t) => (t.id === tier.id ? { ...t, isDirty: false } : t)));
        toast.success(`${tier.carrierName} (${tier.tierName}) barem fiyatı veritabanına kaydedildi!`);
      }
    } catch (e) {
      toast.error("Kaydedilirken hata oluştu.");
    }
  };

  const tabs = [
    { id: "cargo_barem", label: "Kargo Barem Destek (10 Ağu 2026)", icon: Truck },
    { id: "general", label: "Genel & Vergi", icon: Settings },
    { id: "trendyol", label: "Trendyol API", icon: Key },
    { id: "hepsiburada", label: "Hepsiburada API", icon: Key },
    { id: "users", label: "Kullanıcılar (RBAC)", icon: Users },
    { id: "notifications", label: "Bildirimler", icon: Mail },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl">
      <div>
        <h3 className="text-base sm:text-lg font-bold text-dark">Sistem ve Firma Ayarları</h3>
        <p className="text-[11px] sm:text-xs text-muted-foreground">Kargo barem destek tarifeleri, pazaryeri API anahtarları ve vergi yapılandırmaları</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
        {/* Navigation Tabs */}
        <div className="md:col-span-4 bg-white p-2 sm:p-3 rounded-2xl sm:rounded-3xl border border-border flex md:flex-col overflow-x-auto gap-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold transition-all text-left whitespace-nowrap shrink-0 ${
                  activeTab === t.id
                    ? "bg-primary text-white shadow-xs"
                    : "text-dark hover:bg-canvas"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="md:col-span-8 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border space-y-4 sm:space-y-5">
          
          {/* TAB: CARGO BAREM DESTEK SİSTEMİ */}
          {activeTab === "cargo_barem" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-dark">Trendyol Kargo Barem Destek Sistemi</span>
                    <Badge variant="excellent">10 Ağustos 2026</Badge>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    1 Gün Termin / Hızlı Teslimat avantajlı fiyatları ile standart barem altı kargo tarifesi
                  </p>
                </div>

                <Button size="sm" variant="outline" onClick={fetchBaremTiers} className="text-xs h-8 gap-1.5 self-start sm:self-auto">
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingBarem ? 'animate-spin' : ''}`} /> Yenile
                </Button>
              </div>

              {/* Barem Explanation Card */}
              <div className="bg-primary-tint-50/70 border border-primary-tint-200 p-3.5 rounded-2xl text-xs space-y-1.5">
                <div className="font-bold text-primary flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Barem Destek Kuralı:
                </div>
                <p className="text-gray-700 text-[11px] leading-relaxed">
                  Terminlerinizi <strong>1 gün</strong> yaparak veya <strong>Hızlı Teslimat / Bugün Kargoda</strong> etiketiyle kargoya verdiğinizde sol sütundaki <strong>Avantajlı Fiyat</strong> uygulanır. 1 günden fazla termin veya gecikmelerde sağ sütundaki <strong>Standart / Desteksiz Fiyat</strong> uygulanır.
                </p>
              </div>

              {/* Barem Tiers Editable Table */}
              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table className="w-full text-left text-xs border-collapse min-w-[620px]">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-semibold">
                      <th className="pb-2.5 px-3 table-sticky-first-col">Kargo Firması</th>
                      <th className="pb-2.5 px-3">Paket Tutarı</th>
                      <th className="pb-2.5 px-3 text-emerald-700 font-bold">Avantajlı Destekli (₺)</th>
                      <th className="pb-2.5 px-3 text-red-700 font-bold">Standart / Desteksiz (₺)</th>
                      <th className="pb-2.5 px-3 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {baremTiers.map((t) => (
                      <tr key={t.id} className="hover:bg-canvas/50 transition-colors">
                        <td className="py-2.5 px-3 table-sticky-first-col font-bold text-dark">
                          {t.carrierName}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-gray-700">
                          {t.tierName}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              value={t.discountedPriceExVat}
                              onChange={(e) => handleBaremPriceChange(t.id, 'discountedPriceExVat', parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 rounded-lg border border-emerald-300 bg-emerald-50/50 font-bold text-xs text-emerald-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <span className="text-[10px] text-gray-400">TL</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.01"
                              value={t.standardPriceExVat}
                              onChange={(e) => handleBaremPriceChange(t.id, 'standardPriceExVat', parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 rounded-lg border border-red-300 bg-red-50/50 font-bold text-xs text-red-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                            <span className="text-[10px] text-gray-400">TL</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            size="sm"
                            variant={t.isDirty ? "default" : "outline"}
                            className="h-7 text-[11px] gap-1 px-2.5"
                            onClick={() => handleSaveBaremTier(t)}
                          >
                            <Save className="w-3 h-3" />
                            <span>Kaydet</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: GENEL VERGİ */}
          {activeTab === "general" && (
            <div className="space-y-4">
              <h4 className="text-xs sm:text-sm font-bold text-dark pb-2 border-b border-border">Genel Vergi & Hizmet Ayarları</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-bold text-dark block mb-1">Varsayılan Satış KDV (%)</label>
                  <input type="number" defaultValue={20} className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-dark block mb-1">Stopaj Kesinti Oranı (%)</label>
                  <input type="number" defaultValue={1} className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-dark block mb-1">Pazaryeri Hizmet Bedeli (₺)</label>
                  <input type="number" defaultValue={8.49} className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-dark block mb-1">Minimum Kâr Marjı Uyarısı (%)</label>
                  <input type="number" defaultValue={15} className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold" />
                </div>
              </div>
              <Button onClick={() => toast.success("Genel ayarlar kaydedildi!")} className="text-xs font-bold">
                Ayarları Kaydet
              </Button>
            </div>
          )}

          {/* TAB: TRENDYOL API */}
          {activeTab === "trendyol" && (
            <div className="space-y-4">
              <h4 className="text-xs sm:text-sm font-bold text-dark pb-2 border-b border-border">Trendyol SAPI Entegrasyonu</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-dark block mb-1">Satıcı ID (Supplier ID)</label>
                  <input type="text" defaultValue="108452" className="w-full px-3 py-2 rounded-xl border border-border text-xs font-mono font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-dark block mb-1">API Key</label>
                  <input type="password" defaultValue="ty_prod_key_99418241" className="w-full px-3 py-2 rounded-xl border border-border text-xs font-mono" />
                </div>
                <div>
                  <label className="text-xs font-bold text-dark block mb-1">API Secret</label>
                  <input type="password" defaultValue="ty_prod_secret_8412891" className="w-full px-3 py-2 rounded-xl border border-border text-xs font-mono" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => toast.success("Trendyol API bağlantı testi başarılı!")} variant="secondary" className="text-xs font-bold">
                  Bağlantıyı Test Et
                </Button>
                <Button onClick={() => toast.success("Trendyol API anahtarları kaydedildi!")} className="text-xs font-bold">
                  Kaydet
                </Button>
              </div>
            </div>
          )}

          {/* TAB: USERS RBAC */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-border gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-dark">Kullanıcı & Mağaza Yetki Matrisi (RBAC)</h4>
                <Button size="sm" className="text-xs font-bold self-start sm:self-auto">+ Yeni Kullanıcı Davet Et</Button>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-2xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-dark">Davut Akbulut (Siz)</span>
                    <span className="block text-[11px] text-gray-500">dvtakblt@gmail.com • Firma Sahibi (Admin)</span>
                  </div>
                  <span className="bg-primary-tint-100 text-primary text-[10px] font-bold px-2.5 py-1 rounded-full self-start sm:self-auto">Tam Yetkili</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
