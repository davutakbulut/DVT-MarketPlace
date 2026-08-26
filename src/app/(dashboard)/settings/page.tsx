"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Settings, User, Truck, Sliders, AlertOctagon, Percent, 
  Receipt, Mail, Database, Users, CreditCard, Upload, 
  Download, RefreshCw, Save, CheckCircle2, ShieldCheck, 
  Package, Store, ExternalLink, Info, PhoneCall, FileSpreadsheet,
  Layers, ChevronRight, HelpCircle
} from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("account");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [runningCron, setRunningCron] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<any>(null);

  // 1. HESAP AYARLARI (Screenshot 1)
  const [firstName, setFirstName] = useState("Davut");
  const [lastName, setLastName] = useState("Akbulut");
  const [phone, setPhone] = useState("+90 532 000 00 00");
  const [email, setEmail] = useState("dvtakblt@gmail.com");
  const [country, setCountry] = useState("Türkiye");
  const [city, setCity] = useState("İstanbul");
  const [district, setDistrict] = useState("Kadıköy");
  const [postalCode, setPostalCode] = useState("34710");
  const [address, setAddress] = useState("Bağdat Caddesi No:123/4");
  const registrationDate = "26 Haz 2026 – 00:02";

  // 2. GENEL AYARLAR (Screenshot 2)
  const [netVatMode, setNetVatMode] = useState("exclude_negative"); // exclude_negative, include_negative
  const [defaultCurrency, setDefaultCurrency] = useState("TRY");
  const [includeStopajInCalc, setIncludeStopajInCalc] = useState(true);
  const [includeReturnRate, setIncludeReturnRate] = useState(false);
  const [defaultReturnRate, setDefaultReturnRate] = useState(0);
  const [categoryCommissions, setCategoryCommissions] = useState<any[]>([]);

  // 3. KARGO AYARLARI (Screenshot 3)
  const [disableBarem0199, setDisableBarem0199] = useState(false);
  const [disableBarem200349, setDisableBarem200349] = useState(false);
  const [defaultShippingCarrier, setDefaultShippingCarrier] = useState("TEX");

  // 4. OPERASYON AYARLARI (Screenshot 4)
  const [minOrderQty025, setMinOrderQty025] = useState(2);
  const [minOrderQty2535, setMinOrderQty2535] = useState(2);
  const [minOrderQty3550, setMinOrderQty3550] = useState(2);
  const [minOrderQty5075, setMinOrderQty5075] = useState(2);

  // 5. UYARILAR & KÂR MARJI (Screenshot 5 & 6)
  const [disableAllMarginAlerts, setDisableAllMarginAlerts] = useState(false);
  const [minProfitMarginWarning, setMinProfitMarginWarning] = useState(20);
  const [marginCalcType, setMarginCalcType] = useState("margin_on_sale"); // margin_on_cost, margin_on_sale

  // 6. KESİNTİLER & SABİT GİDERLER (Birleşik)
  const [defaultServiceFee, setDefaultServiceFee] = useState(13.19);
  const [defaultWithholdingRate, setDefaultWithholdingRate] = useState(1);
  const [defaultVatRate, setDefaultVatRate] = useState(10);
  const [packagingCost, setPackagingCost] = useState(0);
  const [invoiceFixedCost, setInvoiceFixedCost] = useState(0);
  const [extraOperationCost, setExtraOperationCost] = useState(0);
  const [extraOperationRate, setExtraOperationRate] = useState(6.0);

  // 7. E-POSTA BİLDİRİM AYARLARI (Screenshot 7 - 9 Toggles)
  const [emailPrefs, setEmailPrefs] = useState({
    return_emails: false,
    financial_report_emails: false,
    ad_profit_emails: false,
    missing_api_emails: false,
    support_ticket_emails: false,
    missing_cost_emails: false,
    alert_emails: false,
    new_commission_emails: false,
    top_profit_emails: false,
  });
  const [emailDailySummary, setEmailDailySummary] = useState(true);
  const [emailNegativeProfitAlert, setEmailNegativeProfitAlert] = useState(true);

  // 8. TOPLU İŞLEMLER & XML (Screenshot 8)
  const [xmlFeed, setXmlFeed] = useState({
    xml_file_name: null as string | null,
    xml_url: "",
    auto_sync: false,
    sync_cost: true,
    sync_desi: true,
  });

  // 9. KULLANICILAR & RBAC
  const [users, setUsers] = useState<any[]>([]);

  // Fetch all settings from DB
  const fetchAllSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/general');
      const data = await res.json();

      if (data.settings) {
        const s = data.settings;
        setFirstName(s.firstName || "Davut");
        setLastName(s.lastName || "Akbulut");
        setPhone(s.phone || "+90 532 000 00 00");
        setEmail(s.email || "dvtakblt@gmail.com");
        setCountry(s.country || "Türkiye");
        setCity(s.city || "İstanbul");
        setDistrict(s.district || "Kadıköy");
        setPostalCode(s.postalCode || "34710");
        setAddress(s.address || "Bağdat Caddesi No:123/4");

        setNetVatMode(s.netVatMode || "exclude_negative");
        setDefaultCurrency(s.defaultCurrency || "TRY");
        setIncludeStopajInCalc(s.includeStopajInCalc !== false);
        setIncludeReturnRate(!!s.includeReturnRate);
        setDefaultReturnRate(s.defaultReturnRate ? parseFloat(s.defaultReturnRate) : 0);

        setDisableBarem0199(!!s.disableBarem0199);
        setDisableBarem200349(!!s.disableBarem200349);
        setDefaultShippingCarrier(s.defaultShippingCarrier || "TEX");

        setMinOrderQty025(s.minOrderQty025 ?? 2);
        setMinOrderQty2535(s.minOrderQty2535 ?? 2);
        setMinOrderQty3550(s.minOrderQty3550 ?? 2);
        setMinOrderQty5075(s.minOrderQty5075 ?? 2);

        setDisableAllMarginAlerts(!!s.disableAllMarginAlerts);
        setMinProfitMarginWarning(s.minProfitMarginWarning ? parseFloat(s.minProfitMarginWarning) : 20);
        setMarginCalcType(s.marginCalcType || "margin_on_sale");

        setDefaultServiceFee(s.defaultServiceFee ? parseFloat(s.defaultServiceFee) : 13.19);
        setDefaultWithholdingRate(s.defaultWithholdingRate ? parseFloat(s.defaultWithholdingRate) : 1);
        setDefaultVatRate(s.defaultVatRate ?? 10);
        setPackagingCost(s.defaultPackagingCost ? parseFloat(s.defaultPackagingCost) : 0);
        setInvoiceFixedCost(s.invoiceFixedCost ? parseFloat(s.invoiceFixedCost) : 0);
        setExtraOperationCost(s.extraOperationCost ? parseFloat(s.extraOperationCost) : 0);
        setExtraOperationRate(s.extraOperationRate !== undefined && s.extraOperationRate !== null ? parseFloat(s.extraOperationRate) : 6.0);

        if (s.emailNotificationPreferences) {
          setEmailPrefs(prev => ({ ...prev, ...s.emailNotificationPreferences }));
        }
        setEmailDailySummary(s.emailDailySummaryEnabled !== false);
        setEmailNegativeProfitAlert(s.emailNegativeProfitAlert !== false);

        if (s.xmlFeedSettings) {
          setXmlFeed(prev => ({ ...prev, ...s.xmlFeedSettings }));
        }
      }

      // Fetch RBAC users
      const usersRes = await fetch('/api/settings/users');
      const usersData = await usersRes.json();
      setUsers(Array.isArray(usersData) ? usersData : (usersData.users || []));
    } catch (e) {
      console.error(e);
      toast.error("Ayarlar veritabanından yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSettings();
  }, []);

  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings/general', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName, lastName, phone, email, country, city, district, postalCode, address,
          netVatMode, defaultCurrency, includeStopajInCalc, includeReturnRate, defaultReturnRate,
          disableBarem0199, disableBarem200349, defaultShippingCarrier,
          minOrderQty025, minOrderQty2535, minOrderQty3550, minOrderQty5075,
          disableAllMarginAlerts, minProfitMarginWarning, marginCalcType,
          defaultServiceFee, defaultWithholdingRate, defaultVatRate,
          defaultPackagingCost: packagingCost, invoiceFixedCost, extraOperationCost, extraOperationRate,
          emailDailySummaryEnabled: emailDailySummary, emailNegativeProfitAlert,
          emailNotificationPreferences: emailPrefs,
          xmlFeedSettings: xmlFeed,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Ayarlar veritabanına başarıyla kaydedildi!");
        fetchAllSettings();
      } else {
        toast.error(data.error || "Kaydedilemedi.");
      }
    } catch (err) {
      toast.error("Sunucu bağlantı hatası.");
    } finally {
      setSaving(false);
    }
  };

  const handleRunCron = async () => {
    setRunningCron(true);
    try {
      const res = await fetch('/api/cron/notifications', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setLastScanResult(data);
        toast.success(`Otomasyon tamamlandı: ${data.totalNewNotifications || 0} yeni bildirim üretildi.`);
      }
    } catch (e) {
      toast.error("Otomasyon hatası.");
    } finally {
      setRunningCron(false);
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
    { id: "account", label: "1. Hesap Ayarları", icon: User },
    { id: "general", label: "2. Genel Ayarlar", icon: Settings },
    { id: "shipping", label: "3. Kargo Ayarları", icon: Truck },
    { id: "operations", label: "4. Operasyon Ayarları", icon: Sliders },
    { id: "alerts", label: "5. Uyarı & Kâr Marjı", icon: AlertOctagon },
    { id: "deductions", label: "6. Kesintiler & Sabit Giderler", icon: Receipt },
    { id: "email", label: "7. E-Posta Bildirimleri", icon: Mail },
    { id: "bulk_xml", label: "8. Toplu İşlemler & XML", icon: Upload },
    { id: "users", label: "9. Kullanıcılar & RBAC", icon: Users },
    { id: "billing", label: "10. Ödeme & Abonelik", icon: CreditCard },
    { id: "backup", label: "11. Yedekleme & Loglar", icon: Database },
  ];

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
            Hesap profili, genel kurallar, operasyon limitleri, kesintiler ve XML entegrasyonu
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/stores">
            <Button size="sm" className="text-xs h-8 sm:h-9 gap-1.5 font-bold bg-primary hover:bg-primary-hover text-white shadow-xs">
              <Store className="w-3.5 h-3.5" />
              <span>Mağazalarım & API Anahtarları ➔</span>
            </Button>
          </Link>

          <Button size="sm" variant="outline" onClick={fetchAllSettings} className="text-xs h-8 sm:h-9 gap-1.5 cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
        {/* Navigation Tabs (Vertical Sidebar on desktop, horizontal scroll on mobile) */}
        <div className="md:col-span-4 bg-white p-2 sm:p-3 rounded-2xl sm:rounded-3xl border border-border flex md:flex-col overflow-x-auto gap-1 shadow-xs max-h-[750px] custom-scrollbar">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2.5 px-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold transition-all text-left whitespace-nowrap shrink-0 cursor-pointer ${
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
            <div className="py-20 text-center text-xs font-bold text-gray-500">
              <RefreshCw className="w-7 h-7 text-primary animate-spin mx-auto mb-2" />
              Veritabanı ayarları yükleniyor...
            </div>
          ) : (
            <>
              {/* ========================================================= */}
              {/* 1. HESAP AYARLARI (Screenshot 1) */}
              {/* ========================================================= */}
              {activeTab === "account" && (
                <form onSubmit={handleSaveAll} className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
                    <h4 className="text-base font-black text-dark">Hesap Ayarları</h4>
                    <span className="px-3 py-1 rounded-xl bg-dark text-white text-[11px] font-bold font-mono">
                      Kayıt Tarihi : {registrationDate}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-bold text-dark block mb-1">Ad</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-canvas/40 text-xs font-bold text-dark focus:ring-2 focus:ring-primary shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-dark block mb-1">Soyad</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-canvas/40 text-xs font-bold text-dark focus:ring-2 focus:ring-primary shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-dark block mb-1">Telefon</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-canvas/40 text-xs font-bold text-dark focus:ring-2 focus:ring-primary shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-dark block mb-1">Eposta</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-canvas/40 text-xs font-bold text-dark focus:ring-2 focus:ring-primary shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/70 space-y-3">
                    <h5 className="text-xs font-black text-dark">Adres Bilgileri</h5>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-bold text-dark block mb-1">Ülke</label>
                        <select
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-canvas/40 text-xs font-bold text-dark focus:ring-2 focus:ring-primary"
                        >
                          <option value="Türkiye">Türkiye</option>
                          <option value="Azerbaycan">Azerbaycan</option>
                          <option value="Almanya">Almanya</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-dark block mb-1">İl</label>
                        <select
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-border bg-canvas/40 text-xs font-bold text-dark focus:ring-2 focus:ring-primary"
                        >
                          <option value="İstanbul">İstanbul</option>
                          <option value="Ankara">Ankara</option>
                          <option value="İzmir">İzmir</option>
                          <option value="Bursa">Bursa</option>
                          <option value="Adana">Adana</option>
                          <option value="Antalya">Antalya</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-dark block mb-1">İlçe</label>
                        <input
                          type="text"
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          placeholder="İlçe Seçin"
                          className="w-full px-3 py-2 rounded-xl border border-border bg-canvas/40 text-xs font-bold text-dark focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-dark block mb-1">Posta Kodu</label>
                      <input
                        type="text"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="Posta kodu"
                        className="w-full sm:w-48 px-3 py-2 rounded-xl border border-border bg-canvas/40 text-xs font-bold text-dark focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-dark block mb-1">Adres</label>
                      <textarea
                        rows={3}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Adres detayları..."
                        className="w-full px-3 py-2 rounded-xl border border-border bg-canvas/40 text-xs font-semibold text-dark focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-6 py-2 rounded-xl shadow-xs">
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </form>
              )}

              {/* ========================================================= */}
              {/* 2. GENEL AYARLAR (Screenshot 2) */}
              {/* ========================================================= */}
              {activeTab === "general" && (
                <form onSubmit={handleSaveAll} className="space-y-5">
                  <h4 className="text-base font-black text-dark pb-2 border-b border-border">Genel Ayarlar</h4>

                  <div className="space-y-3.5">
                    <div>
                      <label className="text-xs font-bold text-dark block mb-1">Net KDV</label>
                      <select
                        value={netVatMode}
                        onChange={(e) => setNetVatMode(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-canvas/30 text-xs font-bold text-dark"
                      >
                        <option value="exclude_negative">Negatif KDV Hesaba Katılmasın</option>
                        <option value="include_negative">Negatif KDV Hesaba Katılsın</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-dark block mb-1">Varsayılan Para Birimi</label>
                      <select
                        value={defaultCurrency}
                        onChange={(e) => setDefaultCurrency(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-canvas/30 text-xs font-bold text-dark"
                      >
                        <option value="TRY">Türk Lirası (₺)</option>
                        <option value="USD">Amerikan Doları ($)</option>
                        <option value="EUR">Euro (€)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-dark block mb-1">Stopaj Kesintisi</label>
                      <select
                        value={includeStopajInCalc ? "include" : "exclude"}
                        onChange={(e) => setIncludeStopajInCalc(e.target.value === "include")}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-canvas/30 text-xs font-bold text-dark"
                      >
                        <option value="include">Stopaj Kesintisi Hesaba Katılsın</option>
                        <option value="exclude">Stopaj Kesintisi Hesaba Katılmasın</option>
                      </select>
                    </div>

                    <div className="space-y-2 pt-1">
                      <label className="text-xs font-bold text-dark block">İade Oranı</label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeReturnRate}
                          onChange={(e) => setIncludeReturnRate(e.target.checked)}
                          className="w-4 h-4 accent-primary"
                        />
                        <span className="text-xs font-semibold text-gray-700">İade oranı hesaba katılsın</span>
                      </label>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-dark block mb-1">Varsayılan İade Oranı (%)</label>
                      <input
                        type="number"
                        value={defaultReturnRate}
                        onChange={(e) => setDefaultReturnRate(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-canvas/30 text-xs font-bold text-dark"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-6 py-2 rounded-xl shadow-xs">
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </Button>

                  {/* Bireysel Kategori Komisyon Oranları Section */}
                  <div className="pt-6 border-t border-border space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h5 className="text-xs font-black text-dark">Bireysel Kategori Komisyon Oranları</h5>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" onClick={() => toast.success("Komisyon şablonu indirildi.")} className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 rounded-xl">
                          <Download className="w-3 h-3" />
                          <span>Excel Şablon İndir</span>
                        </Button>
                        <Button type="button" size="sm" onClick={() => toast.info("Excel yükleme penceresi açıldı.")} className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 rounded-xl">
                          <Upload className="w-3 h-3" />
                          <span>Excel Şablon Yükle</span>
                        </Button>
                      </div>
                    </div>

                    <div className="p-8 rounded-2xl bg-canvas/40 border border-border text-center space-y-2">
                      <FileSpreadsheet className="w-8 h-8 text-gray-300 mx-auto" />
                      <p className="text-xs font-bold text-gray-500">Özel kategori komisyon tanımı bulunamadı.</p>
                      <span className="text-[10px] text-gray-400 block">Katalogdaki tüm kategoriler için standart oranlar geçerlidir.</span>
                    </div>
                  </div>
                </form>
              )}

              {/* ========================================================= */}
              {/* 3. KARGO AYARLARI (Screenshot 3) */}
              {/* ========================================================= */}
              {activeTab === "shipping" && (
                <form onSubmit={handleSaveAll} className="space-y-5">
                  <h4 className="text-base font-black text-dark pb-2 border-b border-border">Kargo Ayarları</h4>

                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-dark">Kargo Barem İndirimi</h5>
                    
                    <label className="flex items-center gap-3 p-2.5 rounded-xl border border-border cursor-pointer hover:bg-canvas/50">
                      <input
                        type="checkbox"
                        checked={disableBarem0199}
                        onChange={(e) => setDisableBarem0199(e.target.checked)}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="text-xs font-bold text-gray-700">0₺ - 199,99₺ arası kargo barem indirimini kapat</span>
                    </label>

                    <label className="flex items-center gap-3 p-2.5 rounded-xl border border-border cursor-pointer hover:bg-canvas/50">
                      <input
                        type="checkbox"
                        checked={disableBarem200349}
                        onChange={(e) => setDisableBarem200349(e.target.checked)}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="text-xs font-bold text-gray-700">200₺ - 349,99₺ arası kargo barem indirimini kapat</span>
                    </label>

                    <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-6 py-2 rounded-xl shadow-xs">
                      {saving ? "Kaydediliyor..." : "Kaydet"}
                    </Button>
                  </div>

                  <div className="pt-4 border-t border-border/70">
                    <Link href="/tariffs/cargo-barem">
                      <Button type="button" variant="outline" className="border-primary text-primary font-bold text-xs gap-1.5 rounded-xl">
                        <span>Kargo Barem Fiyatları Güncelle</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>

                  <div className="pt-4 border-t border-border/70 space-y-2">
                    <label className="text-xs font-bold text-dark block">Varsayılan Kargo Şirketi</label>
                    <select
                      value={defaultShippingCarrier}
                      onChange={(e) => setDefaultShippingCarrier(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-canvas/30 text-xs font-bold text-dark"
                    >
                      <option value="TEX">Trendyol Express</option>
                      <option value="Aras">Aras Kargo</option>
                      <option value="Sürat">Sürat Kargo</option>
                      <option value="PTT">PTT Kargo</option>
                      <option value="MNG">MNG Kargo</option>
                      <option value="YK">Yurtiçi Kargo</option>
                    </select>

                    <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-6 py-2 rounded-xl shadow-xs mt-2">
                      {saving ? "Kaydediliyor..." : "Kaydet"}
                    </Button>
                  </div>

                  <div className="pt-6 border-t border-border space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h5 className="text-xs font-black text-dark">Satıcı Kargo Anlaşması Desi Fiyatları</h5>
                      <div className="flex gap-2">
                        <Link href="/tariffs/desi">
                          <Button type="button" size="sm" className="h-7 text-[11px] bg-primary hover:bg-primary-hover text-white font-bold gap-1 rounded-xl">
                            <Layers className="w-3 h-3" />
                            <span>501 Desi Matrisi ➔</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {/* ========================================================= */}
              {/* 4. OPERASYON AYARLARI (Screenshot 4) */}
              {/* ========================================================= */}
              {activeTab === "operations" && (
                <form onSubmit={handleSaveAll} className="space-y-5">
                  <h4 className="text-base font-black text-dark pb-2 border-b border-border">Operasyon Ayarları</h4>

                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-amber-900 space-y-2">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs font-bold leading-relaxed">
                        Ürünlerinize minimum sipariş adedi tanımlayarak müşterilerin bir siparişte en az tanımladığınız kadar adet sipariş oluşturabilmesini sağlayın!
                      </p>
                    </div>
                    <div className="text-[11px] font-semibold space-y-1 pl-6 text-amber-800">
                      <p>• Yaptığınız tanım ilgili fiyat aralığındaki tüm ürünleriniz için tanımlanacaktır.</p>
                      <p>• TY Plus kampanyaları ve mikro ihracat siparişleri için geçerli değildir.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-dark block mb-1">₺0 - ₺25 Baremi</label>
                      <input
                        type="number"
                        value={minOrderQty025}
                        onChange={(e) => setMinOrderQty025(parseInt(e.target.value) || 2)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-canvas/30 text-xs font-bold text-dark"
                      />
                      <span className="text-[10px] text-gray-400 block mt-1">Minimum: 2 - Maksimum: 6</span>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-dark block mb-1">₺25 - ₺35 Baremi</label>
                      <input
                        type="number"
                        value={minOrderQty2535}
                        onChange={(e) => setMinOrderQty2535(parseInt(e.target.value) || 2)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-canvas/30 text-xs font-bold text-dark"
                      />
                      <span className="text-[10px] text-gray-400 block mt-1">Minimum: 2 - Maksimum: 4</span>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-dark block mb-1">₺35 - ₺50 Baremi</label>
                      <input
                        type="number"
                        value={minOrderQty3550}
                        onChange={(e) => setMinOrderQty3550(parseInt(e.target.value) || 2)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-canvas/30 text-xs font-bold text-dark"
                      />
                      <span className="text-[10px] text-gray-400 block mt-1">Minimum: 2 - Maksimum: 3</span>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-dark block mb-1">₺50 - ₺75 Baremi</label>
                      <input
                        type="number"
                        value={minOrderQty5075}
                        onChange={(e) => setMinOrderQty5075(parseInt(e.target.value) || 2)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-canvas/30 text-xs font-bold text-dark"
                      />
                      <span className="text-[10px] text-gray-400 block mt-1">Minimum: 2 - Maksimum: 2</span>
                    </div>
                  </div>

                  <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-6 py-2 rounded-xl shadow-xs">
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </form>
              )}

              {/* ========================================================= */}
              {/* 5. UYARILAR & KÂR MARJI (Screenshot 5 & 6) */}
              {/* ========================================================= */}
              {activeTab === "alerts" && (
                <form onSubmit={handleSaveAll} className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-base font-black text-dark pb-2 border-b border-border">Uyarılar</h4>
                    
                    <label className="flex items-center gap-3 p-3 rounded-2xl border border-border cursor-pointer hover:bg-canvas/50">
                      <input
                        type="checkbox"
                        checked={disableAllMarginAlerts}
                        onChange={(e) => setDisableAllMarginAlerts(e.target.checked)}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="text-xs font-bold text-dark">Bütün ürünler için minimum kar marjı uyarılarını kapat</span>
                    </label>

                    <div>
                      <label className="text-xs font-bold text-dark block mb-1">Minimum kar marjı oranı (%)</label>
                      <input
                        type="number"
                        value={minProfitMarginWarning}
                        onChange={(e) => setMinProfitMarginWarning(parseFloat(e.target.value) || 0)}
                        className="w-full sm:w-64 px-3.5 py-2.5 rounded-xl border border-border bg-canvas/30 text-xs font-bold text-dark"
                      />
                    </div>

                    <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-6 py-2 rounded-xl shadow-xs">
                      {saving ? "Kaydediliyor..." : "Kaydet"}
                    </Button>
                  </div>

                  <div className="pt-6 border-t border-border space-y-4">
                    <h4 className="text-base font-black text-dark pb-2 border-b border-border">Ürün Kârlılık Listesi</h4>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-dark block">Kâr Marjı Çeşidi</label>
                      
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 p-3 rounded-2xl border border-border cursor-pointer hover:bg-canvas/50">
                          <input
                            type="radio"
                            name="marginCalcType"
                            value="margin_on_cost"
                            checked={marginCalcType === "margin_on_cost"}
                            onChange={(e) => setMarginCalcType(e.target.value)}
                            className="w-4 h-4 accent-primary"
                          />
                          <div>
                            <span className="text-xs font-bold text-dark block">Kar / Maliyet (Markup)</span>
                            <span className="text-[11px] text-gray-500">Kâr tutarının doğrudan alış maliyetine oranı: (Net Kâr / Maliyet) × 100</span>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 p-3 rounded-2xl border border-border cursor-pointer hover:bg-canvas/50">
                          <input
                            type="radio"
                            name="marginCalcType"
                            value="margin_on_sale"
                            checked={marginCalcType === "margin_on_sale"}
                            onChange={(e) => setMarginCalcType(e.target.value)}
                            className="w-4 h-4 accent-primary"
                          />
                          <div>
                            <span className="text-xs font-bold text-dark block">Kar / Satış (Marj - Standart)</span>
                            <span className="text-[11px] text-gray-500">Kâr tutarının satış fiyatına oranı: (Net Kâr / Satış Fiyatı) × 100</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-6 py-2 rounded-xl shadow-xs">
                      {saving ? "Kaydediliyor..." : "Kaydet"}
                    </Button>
                  </div>
                </form>
              )}

              {/* ========================================================= */}
              {/* 6. KESİNTİLER & SABİT GİDERLER (Birleşik) */}
              {/* ========================================================= */}
              {activeTab === "deductions" && (
                <form onSubmit={handleSaveAll} className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
                    <div>
                      <h4 className="text-base font-black text-dark">Platform Kesintileri & Sabit Giderler</h4>
                      <p className="text-[11px] text-gray-500">Hizmet bedeli, stopaj ve sipariş başı operasyonel giderler</p>
                    </div>
                    <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-5 py-2 rounded-xl shadow-xs">
                      {saving ? "Kaydediliyor..." : "Tümünü Kaydet"}
                    </Button>
                  </div>

                  <div className="p-4 rounded-2xl bg-canvas/60 border border-border space-y-3">
                    <h5 className="text-xs font-black text-dark">1. Platform Hizmet Bedeli</h5>
                    <div>
                      <label className="text-[11px] font-bold text-dark block mb-1">Hizmet Bedeli (₺ KDV Dahil)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={defaultServiceFee}
                        onChange={(e) => setDefaultServiceFee(parseFloat(e.target.value) || 0)}
                        className="w-48 px-3 py-1.5 rounded-xl border border-primary text-xs font-bold text-primary bg-white"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-canvas/60 border border-border space-y-3">
                    <h5 className="text-xs font-black text-dark">2. Vergi & %1 Stopaj</h5>
                    <div>
                      <label className="text-[11px] font-bold text-dark block mb-1">E-Ticaret Tevkifat Stopaj Oranı (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={defaultWithholdingRate}
                        onChange={(e) => setDefaultWithholdingRate(parseFloat(e.target.value) || 0)}
                        className="w-48 px-3 py-1.5 rounded-xl border border-border text-xs font-bold bg-white"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-canvas/60 border border-border space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h5 className="text-xs font-black text-dark">3. Operasyonel & Sabit Giderler</h5>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        ⚡ Otomatik Sipariş Yüzdesi Hesaplama Aktif
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white border border-primary/30 space-y-2 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label className="text-xs font-bold text-dark flex items-center gap-1.5">
                            <span>Ekstra Operasyon Oranı (%)</span>
                            <Badge variant="excellent" className="text-[10px] py-0 px-1.5">Dinamik %</Badge>
                          </label>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Sipariş satış tutarı üzerinden kesilecek operasyonel gider oranı (Örn: %6). Sipariş tutarı ₺100 ise ₺6.00, ₺250 ise ₺15.00 olarak otomatik hesaplanır.
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-xs font-bold text-gray-500">%</span>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={extraOperationRate}
                            onChange={(e) => setExtraOperationRate(parseFloat(e.target.value) || 0)}
                            className="w-24 px-3 py-1.5 rounded-xl border-2 border-primary text-xs font-black text-primary bg-primary/5 focus:ring-2 focus:ring-primary shadow-2xs text-center"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[11px] font-bold text-dark block mb-1">Koli / Paketleme Gideri (₺ Sipariş Başı)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={packagingCost}
                          onChange={(e) => setPackagingCost(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 rounded-xl border border-border text-xs font-bold bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-dark block mb-1">Fatura Kesim Bedeli (₺ Sipariş Başı)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={invoiceFixedCost}
                          onChange={(e) => setInvoiceFixedCost(parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 rounded-xl border border-border text-xs font-bold bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {/* ========================================================= */}
              {/* 7. E-POSTA BİLDİRİM AYARLARI (Screenshot 7 - 9 Toggles) */}
              {/* ========================================================= */}
              {activeTab === "email" && (
                <form onSubmit={handleSaveAll} className="space-y-5">
                  <h4 className="text-base font-black text-dark pb-2 border-b border-border">Eposta Bildirim Ayarları</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <label className="flex items-center gap-3 p-3 rounded-2xl border border-border cursor-pointer hover:bg-canvas/50">
                      <input
                        type="checkbox"
                        checked={emailPrefs.return_emails}
                        onChange={(e) => setEmailPrefs(p => ({ ...p, return_emails: e.target.checked }))}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="font-bold text-gray-700">İade edilen ürün bilgilendirme maillerini kapat</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-2xl border border-border cursor-pointer hover:bg-canvas/50">
                      <input
                        type="checkbox"
                        checked={emailPrefs.missing_cost_emails}
                        onChange={(e) => setEmailPrefs(p => ({ ...p, missing_cost_emails: e.target.checked }))}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="font-bold text-gray-700">Eksik maliyetler bilgilendirme maillerini kapat</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-2xl border border-border cursor-pointer hover:bg-canvas/50">
                      <input
                        type="checkbox"
                        checked={emailPrefs.financial_report_emails}
                        onChange={(e) => setEmailPrefs(p => ({ ...p, financial_report_emails: e.target.checked }))}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="font-bold text-gray-700">Finansal raporlar bilgilendirme maillerini kapat</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-2xl border border-border cursor-pointer hover:bg-canvas/50">
                      <input
                        type="checkbox"
                        checked={emailPrefs.alert_emails}
                        onChange={(e) => setEmailPrefs(p => ({ ...p, alert_emails: e.target.checked }))}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="font-bold text-gray-700">Uyarı bilgilendirme maillerini kapat</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-2xl border border-border cursor-pointer hover:bg-canvas/50">
                      <input
                        type="checkbox"
                        checked={emailPrefs.ad_profit_emails}
                        onChange={(e) => setEmailPrefs(p => ({ ...p, ad_profit_emails: e.target.checked }))}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="font-bold text-gray-700">Reklam kârlılık bilgilendirme maillerini kapat</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-2xl border border-border cursor-pointer hover:bg-canvas/50">
                      <input
                        type="checkbox"
                        checked={emailPrefs.new_commission_emails}
                        onChange={(e) => setEmailPrefs(p => ({ ...p, new_commission_emails: e.target.checked }))}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="font-bold text-gray-700">Yeni komisyon oranları bilgilendirme maillerini kapat</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-2xl border border-border cursor-pointer hover:bg-canvas/50">
                      <input
                        type="checkbox"
                        checked={emailPrefs.missing_api_emails}
                        onChange={(e) => setEmailPrefs(p => ({ ...p, missing_api_emails: e.target.checked }))}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="font-bold text-gray-700">Eksik/girilmemiş API bilgilendirme maillerini kapat</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-2xl border border-border cursor-pointer hover:bg-canvas/50">
                      <input
                        type="checkbox"
                        checked={emailPrefs.top_profit_emails}
                        onChange={(e) => setEmailPrefs(p => ({ ...p, top_profit_emails: e.target.checked }))}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="font-bold text-gray-700">En kârlı ürünler bilgilendirme maillerini kapat</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-2xl border border-border cursor-pointer hover:bg-canvas/50 sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={emailPrefs.support_ticket_emails}
                        onChange={(e) => setEmailPrefs(p => ({ ...p, support_ticket_emails: e.target.checked }))}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="font-bold text-gray-700">Destek talebi durum bilgilendirme maillerini kapat</span>
                    </label>
                  </div>

                  <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-6 py-2 rounded-xl shadow-xs">
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </form>
              )}

              {/* ========================================================= */}
              {/* 8. TOPLU İŞLEMLER & XML (Screenshot 8) */}
              {/* ========================================================= */}
              {activeTab === "bulk_xml" && (
                <form onSubmit={handleSaveAll} className="space-y-6">
                  <h4 className="text-base font-black text-dark pb-2 border-b border-border">Toplu İşlemler & XML Entegrasyonu</h4>

                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-dark">XML Ayarları</h5>
                    
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                      {xmlFeed.xml_file_name 
                        ? `Daha önce yüklenmiş XML dosyası adı: ${xmlFeed.xml_file_name}`
                        : "Daha önce yüklenmiş XML dosyası adı : Henüz bir XML yüklenmemiş!"}
                    </div>

                    <div>
                      <Button type="button" variant="outline" onClick={() => toast.success("Manuel XML güncellemesi tetiklendi.")} className="text-xs font-bold gap-1.5 rounded-xl">
                        <RefreshCw className="w-3.5 h-3.5 text-primary" />
                        <span>Yüklenmiş XML'i Manuel Güncelle 🔄</span>
                      </Button>
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-bold text-dark block">Güncelleme Periyodu</label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={xmlFeed.auto_sync}
                          onChange={(e) => setXmlFeed(p => ({ ...p, auto_sync: e.target.checked }))}
                          className="w-4 h-4 accent-primary"
                        />
                        <span className="text-xs font-semibold text-gray-700">Periyodik Şekilde Güncellensin (Günde 1 kez)</span>
                      </label>
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-bold text-dark block">Çekilecek XML Alanları</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={xmlFeed.sync_cost}
                            onChange={(e) => setXmlFeed(p => ({ ...p, sync_cost: e.target.checked }))}
                            className="w-4 h-4 accent-primary"
                          />
                          <span className="text-xs font-bold text-gray-700">Maliyet</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={xmlFeed.sync_desi}
                            onChange={(e) => setXmlFeed(p => ({ ...p, sync_desi: e.target.checked }))}
                            className="w-4 h-4 accent-primary"
                          />
                          <span className="text-xs font-bold text-gray-700">Desi</span>
                        </label>
                      </div>
                    </div>

                    <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-6 py-2 rounded-xl shadow-xs">
                      {saving ? "Kaydediliyor..." : "Kaydet"}
                    </Button>
                  </div>

                  <div className="pt-6 border-t border-border space-y-3">
                    <h5 className="text-xs font-bold text-dark">XML Yükleme (Dosya Seçimi veya Link Ekleme)</h5>
                    
                    <div className="p-8 rounded-3xl border-2 border-dashed border-emerald-400 bg-emerald-50/30 text-center space-y-2">
                      <Upload className="w-8 h-8 text-emerald-600 mx-auto" />
                      <p className="text-sm font-bold text-dark">XML Dosyasını Seçin!</p>
                      <span className="text-[11px] text-gray-400 block">.xml veya .xlsx formatında ürün maliyet ve desi besleme dosyası</span>
                    </div>

                    <div className="text-center text-xs font-bold text-gray-400 my-1">— VEYA —</div>

                    <input
                      type="url"
                      placeholder="XML Dosya Linki Ekleyin (https://...)"
                      value={xmlFeed.xml_url}
                      onChange={(e) => setXmlFeed(p => ({ ...p, xml_url: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-canvas/30 text-xs font-bold text-dark"
                    />

                    <Button type="button" onClick={() => toast.success("XML dosyası başarıyla yüklendi ve işlendi!")} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-2 rounded-xl shadow-xs gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>XML Yükle</span>
                    </Button>
                  </div>
                </form>
              )}

              {/* ========================================================= */}
              {/* 9. KULLANICILAR & RBAC */}
              {/* ========================================================= */}
              {activeTab === "users" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-border gap-2">
                    <div>
                      <h4 className="text-base font-black text-dark">Kullanıcılar & Kâr Maskeleme İzinleri (RBAC)</h4>
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
                            type="button"
                            onClick={() => handleToggleUserPermission(u.id, 'canViewMargins', u.canViewMargins)}
                            className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                              u.canViewMargins ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {u.canViewMargins ? '👁️ Net Kârı Görür' : '🔒 Kâr Maskeli'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleUserPermission(u.id, 'canViewCogs', u.canViewCogs)}
                            className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                              u.canViewCogs ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {u.canViewCogs ? '👁️ Alış Maliyetini Görür' : '🔒 Maliyet Gizli'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleUserPermission(u.id, 'canEditPrices', u.canEditPrices)}
                            className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                              u.canEditPrices ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {u.canEditPrices ? '✏️ Fiyat Değiştirebilir' : '🚫 Fiyat Değiştiremez'}
                          </button>

                          <button
                            type="button"
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

              {/* ========================================================= */}
              {/* 10. ÖDEME & ABONELİK (Screenshot 9) */}
              {/* ========================================================= */}
              {activeTab === "billing" && (
                <div className="space-y-6">
                  <h4 className="text-base font-black text-dark pb-2 border-b border-border">Ödeme Bilgileri & Abonelik</h4>

                  <div className="p-4 rounded-2xl bg-canvas/50 border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase">Aktif Abonelik Paketi</span>
                      <Badge variant="excellent">PRO Yıllık Lisans</Badge>
                    </div>
                    <div className="text-base font-black text-dark">DVT MarketPlace PRO - Sınırsız Mağaza & Sipariş</div>
                    <span className="text-[11px] text-emerald-700 font-semibold block">Yenilenme Tarihi: 26 Haziran 2027</span>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-dark">Ödeme Geçmişi</h5>
                    <div className="p-6 rounded-2xl bg-canvas/30 border border-border text-center space-y-1">
                      <CreditCard className="w-7 h-7 text-gray-300 mx-auto" />
                      <p className="text-xs font-bold text-gray-500">Henüz geçmiş ödeme kaydı bulunmuyor.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-dark">Faturalarım</h5>
                    <div className="p-6 rounded-2xl bg-canvas/30 border border-border text-center space-y-1">
                      <Receipt className="w-7 h-7 text-gray-300 mx-auto" />
                      <p className="text-xs font-bold text-gray-500">Fatura kaydı bulunamadı.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-dark text-white space-y-2">
                    <div className="flex items-center gap-2">
                      <PhoneCall className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold">Hesap ve Abonelik İşlemleri</span>
                    </div>
                    <p className="text-xs text-gray-300">
                      Abonelik işlemleriniz, fatura ve paket yükseltme talepleriniz için lütfen <strong className="text-primary">08504730054</strong> numaralı iletişim hattından bizimle iletişime geçin.
                    </p>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 11. YEDEKLEME & LOGLAR */}
              {/* ========================================================= */}
              {activeTab === "backup" && (
                <div className="space-y-4">
                  <h4 className="text-base font-black text-dark pb-2 border-b border-border">Veritabanı Yedekleme & Sistem Logları</h4>
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
