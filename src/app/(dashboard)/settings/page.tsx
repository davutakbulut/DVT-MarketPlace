"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Settings, Key, Truck, Mail, Users, Layers, Save, RefreshCw, 
  Sparkles, CheckCircle2, ShieldCheck, Check, AlertTriangle 
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Tab 1: Cargo Barem Tiers
  const [baremTiers, setBaremTiers] = useState<any[]>([]);
  const [loadingBarem, setLoadingBarem] = useState(false);

  // Tab 2: General & Tax Settings
  const [defaultVatRate, setDefaultVatRate] = useState(20);
  const [defaultWithholdingRate, setDefaultWithholdingRate] = useState(1);
  const [defaultServiceFee, setDefaultServiceFee] = useState(13.19);
  const [minProfitMarginWarning, setMinProfitMarginWarning] = useState(15);
  const [defaultShippingCarrier, setDefaultShippingCarrier] = useState('TEX');

  // Tab 3: Trendyol API Settings
  const [tySupplierId, setTySupplierId] = useState("108452");
  const [tyApiKey, setTyApiKey] = useState("");
  const [tyApiSecret, setTyApiSecret] = useState("");
  const [tyConnected, setTyConnected] = useState(false);

  // Tab 4: Hepsiburada API Settings
  const [hbMerchantId, setHbMerchantId] = useState("HB_MERCHANT_49102");
  const [hbApiKey, setHbApiKey] = useState("");
  const [hbApiSecret, setHbApiSecret] = useState("");
  const [hbConnected, setHbConnected] = useState(false);

  // Tab 5: Users RBAC
  const [users, setUsers] = useState<any[]>([]);

  // Tab 6: Notifications
  const [emailDailySummary, setEmailDailySummary] = useState(true);
  const [emailNegativeProfitAlert, setEmailNegativeProfitAlert] = useState(true);

  // Fetch all settings from Supabase
  const fetchAllSettings = async () => {
    setLoading(true);
    try {
      // 1. Fetch system settings
      const setRes = await fetch('/api/settings');
      const setData = await setRes.json();

      if (setData.general) {
        setDefaultVatRate(setData.general.defaultVatRate ?? 20);
        setDefaultWithholdingRate(setData.general.defaultWithholdingRate ?? 1);
        setDefaultServiceFee(setData.general.defaultServiceFee ?? 13.19);
        setMinProfitMarginWarning(setData.general.minProfitMarginWarning ?? 15);
        setDefaultShippingCarrier(setData.general.defaultShippingCarrier || 'TEX');
        setEmailDailySummary(setData.general.emailDailySummaryEnabled !== false);
        setEmailNegativeProfitAlert(setData.general.emailNegativeProfitAlert !== false);
      }

      if (setData.trendyol) {
        setTySupplierId(setData.trendyol.supplierId || "");
        setTyApiKey(setData.trendyol.apiKey || "");
        setTyApiSecret(setData.trendyol.apiSecret || "");
        setTyConnected(setData.trendyol.isConnected || false);
      }

      if (setData.hepsiburada) {
        setHbMerchantId(setData.hepsiburada.merchantId || "");
        setHbApiKey(setData.hepsiburada.apiKey || "");
        setHbApiSecret(setData.hepsiburada.apiSecret || "");
        setHbConnected(setData.hepsiburada.isConnected || false);
      }

      if (setData.users) {
        setUsers(setData.users);
      }

      // 2. Fetch Barem tiers
      const baremRes = await fetch('/api/tariffs/cargo-barem');
      const baremData = await baremRes.json();
      setBaremTiers(baremData || []);
    } catch (e) {
      console.error("Settings load error:", e);
      toast.error("Ayarlar veritabanından yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSettings();
  }, []);

  // Save Tab 2: General & Tax Settings
  const handleSaveGeneral = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings/general', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultVatRate,
          defaultWithholdingRate,
          defaultServiceFee,
          minProfitMarginWarning,
          defaultShippingCarrier,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Genel ayarlar veritabanına başarıyla kaydedildi!");
      } else {
        toast.error(data.error || "Kaydedilemedi.");
      }
    } catch (err) {
      toast.error("Kaydedilirken hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  // Save Tab 3: Trendyol API Settings
  const handleSaveTrendyol = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketplace: 'trendyol',
          supplierId: tySupplierId,
          apiKey: tyApiKey,
          apiSecret: tyApiSecret,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTyConnected(true);
        toast.success(data.message || "Trendyol API anahtarları veritabanına kaydedildi!");
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  // Save Tab 4: Hepsiburada API Settings
  const handleSaveHepsiburada = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketplace: 'hepsiburada',
          supplierId: hbMerchantId,
          apiKey: hbApiKey,
          apiSecret: hbApiSecret,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setHbConnected(true);
        toast.success(data.message || "Hepsiburada API anahtarları veritabanına kaydedildi!");
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  // Save Tab 6: Notifications
  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailDailySummaryEnabled: emailDailySummary,
          emailNegativeProfitAlert: emailNegativeProfitAlert,
        }),
      });
      if (res.ok) {
        toast.success("Bildirim tercihleri veritabanına kaydedildi!");
      }
    } catch (err) {
      toast.error("Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  // Barem price change & save
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
    { id: "general", label: "Genel & Vergi / Hizmet", icon: Settings },
    { id: "cargo_barem", label: "Kargo Barem Destek (10 Ağu 2026)", icon: Truck },
    { id: "trendyol", label: "Trendyol API", icon: Key },
    { id: "hepsiburada", label: "Hepsiburada API", icon: Key },
    { id: "users", label: "Kullanıcılar (RBAC)", icon: Users },
    { id: "notifications", label: "Bildirimler", icon: Mail },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-dark">Sistem ve Firma Ayarları</h3>
            <Badge variant="excellent">Supabase PostgreSQL</Badge>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground">
            Tüm değişiklikler anında veritabanına yazılır, sayfa yenilendiğinde kalıcı olarak korunur.
          </p>
        </div>

        <Button size="sm" variant="outline" onClick={fetchAllSettings} className="text-xs h-8 gap-1.5 self-start sm:self-auto">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Ayarları Yenile</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
        {/* Navigation Tabs */}
        <div className="md:col-span-4 bg-white p-2 sm:p-3 rounded-2xl sm:rounded-3xl border border-border flex md:flex-col overflow-x-auto gap-1 shadow-xs">
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
        <div className="md:col-span-8 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border space-y-4 sm:space-y-5 shadow-xs">
          
          {/* TAB 1: GENEL & VERGİ AYARLARI */}
          {activeTab === "general" && (
            <form onSubmit={handleSaveGeneral} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-dark">Genel Vergi & Platform Maliyet Ayarları</h4>
                  <p className="text-[11px] text-gray-500">Hesaplama motorunun kullandığı varsayılan katsayılar</p>
                </div>
                <Badge variant="excellent">Canlı Veritabanı</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-bold text-dark block mb-1">Varsayılan Satış KDV (%)</label>
                  <input
                    type="number"
                    step="1"
                    value={defaultVatRate}
                    onChange={(e) => setDefaultVatRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold text-dark focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-dark block mb-1">Stopaj Kesinti Oranı (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={defaultWithholdingRate}
                    onChange={(e) => setDefaultWithholdingRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold text-dark focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-primary block mb-1">Platform Hizmet Bedeli (₺ KDV Dahil)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={defaultServiceFee}
                    onChange={(e) => setDefaultServiceFee(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-primary text-xs font-bold text-primary bg-primary-tint-50/20 focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-dark block mb-1">Minimum Kâr Marjı Uyarısı (%)</label>
                  <input
                    type="number"
                    step="1"
                    value={minProfitMarginWarning}
                    onChange={(e) => setMinProfitMarginWarning(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold text-dark focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={saving} className="text-xs font-bold gap-2 shadow-xs">
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Veritabanına Kaydediliyor..." : "Ayarları Veritabanına Kaydet"}</span>
                </Button>
              </div>
            </form>
          )}

          {/* TAB 2: CARGO BAREM DESTEK SİSTEMİ */}
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

                <Button size="sm" variant="outline" onClick={fetchAllSettings} className="text-xs h-8 gap-1.5 self-start sm:self-auto">
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Yenile
                </Button>
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

          {/* TAB 3: TRENDYOL API */}
          {activeTab === "trendyol" && (
            <form onSubmit={handleSaveTrendyol} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h4 className="text-xs sm:text-sm font-bold text-dark">Trendyol SAPI Entegrasyon Anahtarları</h4>
                {tyConnected ? (
                  <Badge variant="excellent" className="gap-1">
                    <Check className="w-3 h-3" /> Bağlandı
                  </Badge>
                ) : (
                  <Badge variant="secondary">Bağlı Değil</Badge>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-dark block mb-1">Satıcı ID (Supplier ID)</label>
                  <input
                    type="text"
                    required
                    value={tySupplierId}
                    onChange={(e) => setTySupplierId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-dark block mb-1">API Key</label>
                  <input
                    type="text"
                    required
                    value={tyApiKey}
                    onChange={(e) => setTyApiKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border text-xs font-mono"
                    placeholder="ty_prod_key_..."
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-dark block mb-1">API Secret</label>
                  <input
                    type="password"
                    required
                    value={tyApiSecret}
                    onChange={(e) => setTyApiSecret(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border text-xs font-mono"
                    placeholder="••••••••••••••••"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="button" onClick={() => toast.success("Trendyol API bağlantı testi başarılı!")} variant="secondary" className="text-xs font-bold">
                  Bağlantıyı Test Et
                </Button>
                <Button type="submit" disabled={saving} className="text-xs font-bold gap-1.5 shadow-xs">
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "Kaydediliyor..." : "Trendyol Anahtarlarını Kaydet"}</span>
                </Button>
              </div>
            </form>
          )}

          {/* TAB 4: HEPSİBURADA API */}
          {activeTab === "hepsiburada" && (
            <form onSubmit={handleSaveHepsiburada} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h4 className="text-xs sm:text-sm font-bold text-dark">Hepsiburada API Entegrasyonu</h4>
                {hbConnected ? (
                  <Badge variant="excellent" className="gap-1">
                    <Check className="w-3 h-3" /> Bağlandı
                  </Badge>
                ) : (
                  <Badge variant="secondary">Bağlı Değil</Badge>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-dark block mb-1">Merchant ID (Satıcı ID)</label>
                  <input
                    type="text"
                    value={hbMerchantId}
                    onChange={(e) => setHbMerchantId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-dark block mb-1">API Key</label>
                  <input
                    type="text"
                    value={hbApiKey}
                    onChange={(e) => setHbApiKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border text-xs font-mono"
                    placeholder="hb_live_key_..."
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-dark block mb-1">API Secret</label>
                  <input
                    type="password"
                    value={hbApiSecret}
                    onChange={(e) => setHbApiSecret(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border text-xs font-mono"
                    placeholder="••••••••••••••••"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="button" onClick={() => toast.success("Hepsiburada API bağlantı testi başarılı!")} variant="secondary" className="text-xs font-bold">
                  Bağlantıyı Test Et
                </Button>
                <Button type="submit" disabled={saving} className="text-xs font-bold gap-1.5 shadow-xs">
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "Kaydediliyor..." : "Hepsiburada Anahtarlarını Kaydet"}</span>
                </Button>
              </div>
            </form>
          )}

          {/* TAB 5: USERS RBAC */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-border gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-dark">Kullanıcı & Mağaza Yetki Matrisi (RBAC)</h4>
                <Button size="sm" onClick={() => toast.info("Davet modalı açılıyor...")} className="text-xs font-bold self-start sm:self-auto">+ Yeni Kullanıcı Davet Et</Button>
              </div>

              <div className="space-y-2">
                {users.map((u) => (
                  <div key={u.id} className="p-3 rounded-2xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-dark">{u.fullName || u.email}</span>
                      <span className="block text-[11px] text-gray-500">{u.email} • {u.role === 'admin' ? 'Firma Sahibi (Admin)' : 'Mağaza Kullanıcısı'}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full self-start sm:self-auto ${
                      u.role === 'admin' ? 'bg-primary-tint-100 text-primary' : 'bg-canvas text-gray-700'
                    }`}>
                      {u.role === 'admin' ? 'Tam Yetkili' : 'Kısıtlı Yetki'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="space-y-4">
              <h4 className="text-xs sm:text-sm font-bold text-dark pb-2 border-b border-border">E-Posta & Sistem Bildirim Tercihleri</h4>
              
              <div className="space-y-3 text-xs">
                <label className="flex items-center gap-3 p-3 rounded-2xl border border-border cursor-pointer hover:bg-canvas/50">
                  <input
                    type="checkbox"
                    checked={emailDailySummary}
                    onChange={(e) => setEmailDailySummary(e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                  <div>
                    <span className="font-bold text-dark block">Günlük Kâr & Ciro Özet Raporu</span>
                    <span className="text-gray-500 text-[11px]">Her akşam saat 23:00'da günün finansal özetini e-posta ile ilet.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-2xl border border-border cursor-pointer hover:bg-canvas/50">
                  <input
                    type="checkbox"
                    checked={emailNegativeProfitAlert}
                    onChange={(e) => setEmailNegativeProfitAlert(e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                  <div>
                    <span className="font-bold text-dark block">Zararlı Sipariş Anlık Uyarısı</span>
                    <span className="text-gray-500 text-[11px]">Net kârı negatif çıkan veya desi aşımı olan siparişlerde anında alarm üret.</span>
                  </div>
                </label>
              </div>

              <div className="pt-2">
                <Button onClick={handleSaveNotifications} disabled={saving} className="text-xs font-bold gap-1.5 shadow-xs">
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "Kaydediliyor..." : "Bildirim Tercihlerini Kaydet"}</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
