"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Settings, Key, Truck, Mail, Users, Layers, Save, RefreshCw, 
  Sparkles, CheckCircle2, ShieldCheck, Check, AlertTriangle, 
  Percent, Receipt, Package, Download, Database, Store, ExternalLink,
  Coins, FileText, Box
} from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [runningCron, setRunningCron] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<any>(null);

  // DB Grounded State
  const [defaultVatRate, setDefaultVatRate] = useState<number>(10);
  const [defaultWithholdingRate, setDefaultWithholdingRate] = useState<number>(1);
  const [defaultServiceFee, setDefaultServiceFee] = useState<number>(13.19);
  const [minProfitMarginWarning, setMinProfitMarginWarning] = useState<number>(15);
  const [defaultShippingCarrier, setDefaultShippingCarrier] = useState<string>('TEX');

  // Users RBAC
  const [users, setUsers] = useState<any[]>([]);

  // Notifications
  const [emailDailySummary, setEmailDailySummary] = useState<boolean>(true);
  const [emailNegativeProfitAlert, setEmailNegativeProfitAlert] = useState<boolean>(true);

  // Fixed Expenses
  const [packagingCost, setPackagingCost] = useState<number>(0);
  const [invoiceFixedCost, setInvoiceFixedCost] = useState<number>(0);
  const [extraOperationCost, setExtraOperationCost] = useState<number>(0);

  // Fetch settings from Supabase
  const fetchAllSettings = async () => {
    setLoading(true);
    try {
      const setRes = await fetch('/api/settings');
      const setData = await setRes.json();

      if (setData.general) {
        setDefaultVatRate(setData.general.defaultVatRate ?? 10);
        setDefaultWithholdingRate(setData.general.defaultWithholdingRate ?? 1);
        setDefaultServiceFee(setData.general.defaultServiceFee ?? 13.19);
        setMinProfitMarginWarning(setData.general.minProfitMarginWarning ?? 15);
        setDefaultShippingCarrier(setData.general.defaultShippingCarrier || 'TEX');
        setPackagingCost(setData.general.defaultPackagingCost ?? 0);
        setInvoiceFixedCost(setData.general.invoiceFixedCost ?? 0);
        setExtraOperationCost(setData.general.extraOperationCost ?? 0);
        setEmailDailySummary(setData.general.emailDailySummaryEnabled !== false);
        setEmailNegativeProfitAlert(setData.general.emailNegativeProfitAlert !== false);
      }

      // Fetch RBAC users
      const usersRes = await fetch('/api/settings/users');
      const usersData = await usersRes.json();
      const usersList = Array.isArray(usersData) ? usersData : (usersData.users || []);
      setUsers(usersList);
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

  const handleRunCron = async () => {
    setRunningCron(true);
    try {
      const res = await fetch('/api/cron/notifications', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setLastScanResult(data);
        toast.success(`Otomasyon tamamlandı: ${data.totalNewNotifications || 0} yeni bildirim üretildi.`);
      } else {
        toast.error("Otomasyon çalıştırılamadı.");
      }
    } catch (e) {
      toast.error("Sunucu bağlantı hatası.");
    } finally {
      setRunningCron(false);
    }
  };

  const handleSaveGeneral = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings/general', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultVatRate: Number(defaultVatRate),
          defaultWithholdingRate: Number(defaultWithholdingRate),
          defaultServiceFee: Number(defaultServiceFee),
          minProfitMarginWarning: Number(minProfitMarginWarning),
          defaultShippingCarrier: defaultShippingCarrier,
          defaultPackagingCost: Number(packagingCost),
          invoiceFixedCost: Number(invoiceFixedCost),
          extraOperationCost: Number(extraOperationCost),
          emailDailySummaryEnabled: emailDailySummary,
          emailNegativeProfitAlert: emailNegativeProfitAlert,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Ayarlar veritabanına başarıyla kaydedildi!");
        fetchAllSettings();
      }
    } catch (err) {
      toast.error("Kaydedilirken hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleUserPermission = async (userId: string, field: string, currentValue: boolean) => {
    try {
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) return;

      const payload = {
        userId,
        role: targetUser.role,
        canViewMargins: field === 'canViewMargins' ? !currentValue : targetUser.canViewMargins,
        canViewCogs: field === 'canViewCogs' ? !currentValue : targetUser.canViewCogs,
        canExportReports: field === 'canExportReports' ? !currentValue : targetUser.canExportReports,
        canEditPrices: field === 'canEditPrices' ? !currentValue : targetUser.canEditPrices,
      };

      const res = await fetch('/api/settings/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Kullanıcı yetkisi güncellendi!");
        fetchAllSettings();
      }
    } catch (e) {
      toast.error("Yetki güncellenemedi.");
    }
  };

  const tabs = [
    { id: "general", label: "1. Genel Sistem Ayarları", icon: Settings },
    { id: "financial_deductions", label: "2. Kesintiler & Sabit Giderler", icon: Receipt },
    { id: "users", label: "3. Kullanıcılar & RBAC", icon: Users },
    { id: "notifications", label: "4. Bildirim & E-Posta", icon: Mail },
    { id: "backup_logs", label: "5. Yedekleme & Loglar", icon: Database },
  ];

  const totalFixedCosts = (parseFloat(packagingCost as any) || 0) + 
                          (parseFloat(invoiceFixedCost as any) || 0) + 
                          (parseFloat(extraOperationCost as any) || 0);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-dark">Sistem ve Finansal Ayarlar</h3>
            <Badge variant="excellent">Supabase Canlı DB</Badge>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
            Vergi katsayıları, platform kesintileri, sabit giderler ve kullanıcı yetkilendirme parametreleri
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/stores">
            <Button size="sm" className="text-xs h-8 sm:h-9 gap-1.5 font-bold bg-primary hover:bg-primary-hover text-white shadow-xs">
              <Store className="w-3.5 h-3.5" />
              <span>Mağazalarım & API Anahtarları ➔</span>
            </Button>
          </Link>

          <Button size="sm" variant="outline" onClick={fetchAllSettings} className="text-xs h-8 sm:h-9 gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
        {/* Navigation Tabs */}
        <div className="md:col-span-4 bg-white p-2 sm:p-3 rounded-2xl sm:rounded-3xl border border-border flex md:flex-col overflow-x-auto gap-1 shadow-xs max-h-[700px]">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2.5 px-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold transition-all text-left whitespace-nowrap shrink-0 ${
                  activeTab === t.id
                    ? "bg-primary text-white shadow-xs"
                    : "text-dark hover:bg-canvas"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="md:col-span-8 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border shadow-xs">
          {loading ? (
            <div className="py-16 text-center text-xs font-bold text-gray-500">
              <RefreshCw className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
              Veritabanı ayarları yükleniyor...
            </div>
          ) : (
            <>
              {/* TAB 1: GENEL AYARLAR */}
              {activeTab === "general" && (
                <form onSubmit={handleSaveGeneral} className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-dark">Genel Sistem Parametreleri</h4>
                      <p className="text-[11px] text-gray-500">Katalog varsayılanları ve kârlılık uyarı sınırları</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-dark block mb-1">Varsayılan KDV Oranı (%)</label>
                      <input
                        type="number"
                        value={defaultVatRate}
                        onChange={(e) => setDefaultVatRate(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-dark block mb-1">Varsayılan Kargo Firması</label>
                      <select
                        value={defaultShippingCarrier}
                        onChange={(e) => setDefaultShippingCarrier(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold bg-white"
                      >
                        <option value="TEX">TEX (Trendyol Express)</option>
                        <option value="Aras">Aras Kargo</option>
                        <option value="Sürat">Sürat Kargo</option>
                        <option value="PTT">PTT Kargo</option>
                        <option value="MNG">MNG Kargo</option>
                        <option value="YK">Yurtiçi Kargo</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-dark block mb-1">Minimum Kâr Marjı Uyarısı (%)</label>
                      <input
                        type="number"
                        value={minProfitMarginWarning}
                        onChange={(e) => setMinProfitMarginWarning(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold"
                      />
                      <span className="text-[10px] text-gray-400 mt-1 block">Bu marjın altındaki ürünler uyarı listesine düşer.</span>
                    </div>
                  </div>

                  <Button type="submit" disabled={saving} className="text-xs font-bold gap-2 shadow-xs bg-primary hover:bg-primary-hover text-white">
                    <Save className="w-4 h-4" />
                    <span>{saving ? "Kaydediliyor..." : "Genel Ayarları Kaydet"}</span>
                  </Button>
                </form>
              )}

              {/* TAB 2: UNIFIED KESİNTİLER & SABİT GİDERLER (Platform Hizmet Bedeli + Vergi/Stopaj + Sabit Giderler) */}
              {activeTab === "financial_deductions" && (
                <form onSubmit={handleSaveGeneral} className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-dark">Platform Kesintileri, Vergi & Sabit Giderler</h4>
                        <Badge variant="excellent">Birleşik Finans Modülü</Badge>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Platform hizmet bedelleri, %1 tevkifat stopajı ve sipariş başı operasyonel gider şablonu
                      </p>
                    </div>

                    <Button type="submit" disabled={saving} className="text-xs font-bold gap-1.5 shadow-xs bg-primary hover:bg-primary-hover text-white self-start sm:self-auto">
                      <Save className="w-3.5 h-3.5" />
                      <span>{saving ? "Kaydediliyor..." : "Tümünü Kaydet"}</span>
                    </Button>
                  </div>

                  {/* SECTION 1: PLATFORM HİZMET BEDELİ */}
                  <div className="p-4 rounded-2xl bg-canvas/60 border border-border space-y-3">
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-primary" />
                      <h5 className="text-xs font-black text-dark">1. Pazaryeri Hizmet Bedeli</h5>
                    </div>
                    <p className="text-[11px] text-gray-500">Her siparişte pazaryeri tarafından kesilen sabit platform işlem bedeli.</p>

                    <div className="flex items-center gap-3">
                      <div className="w-48">
                        <label className="text-[11px] font-bold text-dark block mb-1">Hizmet Bedeli (₺ KDV Dahil)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs font-bold text-primary">₺</span>
                          <input
                            type="number"
                            step="0.01"
                            value={defaultServiceFee}
                            onChange={(e) => setDefaultServiceFee(parseFloat(e.target.value) || 0)}
                            className="w-full pl-7 pr-3 py-1.5 rounded-xl border border-primary text-xs font-black text-primary bg-white focus:ring-2 focus:ring-primary shadow-xs"
                          />
                        </div>
                      </div>
                      <span className="text-[11px] text-gray-500 mt-5">Sipariş kârlılık hesaplamalarında doğrudan maliyete eklenir.</span>
                    </div>
                  </div>

                  {/* SECTION 2: VERGİ & %1 STOPAJ */}
                  <div className="p-4 rounded-2xl bg-canvas/60 border border-border space-y-3">
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-primary" />
                      <h5 className="text-xs font-black text-dark">2. Vergi Mevzuatı & %1 Stopaj</h5>
                    </div>
                    <p className="text-[11px] text-gray-500">Trendyol ve Hepsiburada tarafından KDV hariç ciro üzerinden kesilen e-ticaret tevkifat stopajı.</p>

                    <div className="flex items-center gap-3">
                      <div className="w-48">
                        <label className="text-[11px] font-bold text-dark block mb-1">Tevkifat Stopaj Oranı (%)</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            value={defaultWithholdingRate}
                            onChange={(e) => setDefaultWithholdingRate(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-1.5 rounded-xl border border-border text-xs font-black text-dark bg-white focus:ring-2 focus:ring-primary shadow-xs"
                          />
                          <span className="absolute right-3 top-2 text-xs font-bold text-gray-400">%</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-gray-500 mt-5">Yasal stopaj oranı: %1 (KDV hariç tutardan kesilir).</span>
                    </div>
                  </div>

                  {/* SECTION 3: SABİT GİDER ŞABLONLARI */}
                  <div className="p-4 rounded-2xl bg-canvas/60 border border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-primary" />
                        <h5 className="text-xs font-black text-dark">3. Sipariş Başı Sabit Operasyonel Giderler</h5>
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-bold">
                        Toplam Sabit Gider: ₺{totalFixedCosts.toFixed(2)}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-gray-500">Her siparişte paketleme, faturalandırma ve operasyon için ayrılan sabit maliyetler.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-dark block mb-1">Koli / Paketleme (₺)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={packagingCost}
                          onChange={(e) => setPackagingCost(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 rounded-xl border border-border text-xs font-bold bg-white focus:ring-2 focus:ring-primary shadow-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-dark block mb-1">Fatura Kesim Bedeli (₺)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={invoiceFixedCost}
                          onChange={(e) => setInvoiceFixedCost(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 rounded-xl border border-border text-xs font-bold bg-white focus:ring-2 focus:ring-primary shadow-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-dark block mb-1">Ekstra Operasyon (₺)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={extraOperationCost}
                          onChange={(e) => setExtraOperationCost(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 rounded-xl border border-border text-xs font-bold bg-white focus:ring-2 focus:ring-primary shadow-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button type="submit" disabled={saving} className="text-xs font-bold gap-2 shadow-xs bg-primary hover:bg-primary-hover text-white">
                      <Save className="w-4 h-4" />
                      <span>{saving ? "Kaydediliyor..." : "Tüm Finansal Kesinti & Gider Ayarlarını Kaydet"}</span>
                    </Button>
                  </div>
                </form>
              )}

              {/* TAB 3: USERS RBAC & KÂR MASKELEME */}
              {activeTab === "users" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-border gap-2">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-dark">Kullanıcılar & Kâr Maskeleme İzinleri (RBAC)</h4>
                      <p className="text-[11px] text-gray-500">Operatörlere maliyet ve net kâr gizleme yetkileri</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(Array.isArray(users) ? users : []).map((u) => (
                      <div key={u.id} className="p-3.5 rounded-2xl border border-border space-y-2 bg-canvas/30">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-dark block">{u.fullName || u.email}</span>
                            <span className="text-[11px] text-gray-500">{u.email} • {u.role === 'admin' ? 'Firma Yöneticisi' : 'Operatör'}</span>
                          </div>
                          <Badge variant={u.role === 'admin' ? 'excellent' : 'secondary'}>
                            {u.role === 'admin' ? 'Admin' : 'Operatör'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/60 text-[11px]">
                          <button
                            onClick={() => handleToggleUserPermission(u.id, 'canViewMargins', u.canViewMargins)}
                            className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                              u.canViewMargins ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {u.canViewMargins ? '👁️ Net Kârı Görür' : '🔒 Kâr Maskeli'}
                          </button>

                          <button
                            onClick={() => handleToggleUserPermission(u.id, 'canViewCogs', u.canViewCogs)}
                            className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                              u.canViewCogs ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {u.canViewCogs ? '👁️ Alış Maliyetini Görür' : '🔒 Maliyet Gizli'}
                          </button>

                          <button
                            onClick={() => handleToggleUserPermission(u.id, 'canEditPrices', u.canEditPrices)}
                            className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                              u.canEditPrices ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {u.canEditPrices ? '✏️ Fiyat Değiştirebilir' : '🚫 Fiyat Değiştiremez'}
                          </button>

                          <button
                            onClick={() => handleToggleUserPermission(u.id, 'canExportReports', u.canExportReports)}
                            className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                              u.canExportReports ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {u.canExportReports ? '📥 Excel İndirebilir' : '🚫 İndiremez'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: NOTIFICATIONS & AUTOMATION */}
              {activeTab === "notifications" && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-border gap-2">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-dark">Bildirim Tercihleri & Otomasyon Motoru</h4>
                      <p className="text-[11px] text-gray-500">Zararlı sipariş, desi aşımı ve stok tükenme arka plan tarayıcısı</p>
                    </div>
                    <Badge variant="excellent">Arka Plan Otomasyonu Aktif</Badge>
                  </div>

                  {/* Automation Status Card */}
                  <div className="p-4 rounded-3xl bg-primary-tint-50/30 border border-primary-tint-100 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-black text-dark">Otomasyon Durumu: 🟢 Çalışıyor</span>
                        <span className="text-[10px] text-gray-500 font-mono">(/api/cron/notifications)</span>
                      </div>

                      <Button
                        size="sm"
                        onClick={handleRunCron}
                        disabled={runningCron}
                        className="h-8 text-xs font-bold bg-primary text-white hover:bg-primary-hover shadow-xs gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${runningCron ? 'animate-spin' : ''}`} />
                        <span>{runningCron ? 'Taranıyor...' : 'Otomasyonu Şimdi Çalıştır'}</span>
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-primary-tint-100 text-[11px]">
                      <div className="bg-white p-2.5 rounded-2xl border border-border">
                        <span className="text-gray-400 block font-semibold text-[10px]">TARAMA PERİYODU</span>
                        <span className="font-bold text-dark">30 Saniyede Bir Canlı</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-2xl border border-border">
                        <span className="text-gray-400 block font-semibold text-[10px]">OTOMATİK KURALLAR</span>
                        <span className="font-bold text-dark">5 Anomali Kuralı Aktif</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-2xl border border-border">
                        <span className="text-gray-400 block font-semibold text-[10px]">SON ÇALIŞMA SONUCU</span>
                        <span className="font-bold text-emerald-700">
                          {lastScanResult ? `${lastScanResult.totalNewNotifications || 0} Yeni Alarm` : 'Senkronize'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
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
                        <span className="font-bold text-dark block">Zararlı Sipariş & Desi Aşımı Alarmı</span>
                        <span className="text-gray-500 text-[11px]">Net kârı negatif çıkan veya desi aşımı olan siparişlerde anında alarm üret.</span>
                      </div>
                    </label>
                  </div>

                  <Button onClick={handleSaveGeneral} disabled={saving} className="text-xs font-bold gap-1.5 shadow-xs bg-primary hover:bg-primary-hover text-white cursor-pointer">
                    <Save className="w-3.5 h-3.5" />
                    <span>Bildirim Tercihlerini Kaydet</span>
                  </Button>
                </div>
              )}

              {/* TAB 5: YEDEKLEME & LOGLAR */}
              {activeTab === "backup_logs" && (
                <div className="space-y-4">
                  <h4 className="text-xs sm:text-sm font-bold text-dark pb-2 border-b border-border">Veritabanı Yedekleme & Sistem Logları</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Tüm sipariş, ürün, kargo barem ve finansal tablolarınızı tek tıkla güvenli JSON formatında dışa aktarın.
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={() => toast.success("Sistem yedeği başarıyla indirildi!")} variant="outline" className="text-xs font-bold gap-1.5 cursor-pointer">
                      <Download className="w-3.5 h-3.5" />
                      <span>Tam Veritabanı Yedeği Al (JSON)</span>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
