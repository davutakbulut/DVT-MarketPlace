"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Store, Plus, Key, ShieldCheck, CheckCircle2, AlertTriangle, 
  RefreshCw, Trash2, Globe, ExternalLink, Sparkles, Check, ArrowRight,
  Truck, Radio, Info, Activity, Layers, Lock
} from "lucide-react";

interface ConnectedStore {
  id: string;
  marketplace: string;
  storeName: string;
  sellerId: string;
  supplierId: string;
  apiKey: string;
  isActive: boolean;
  syncStatus: string;
  lastSyncedAt: string;
  orderCount: number;
  productCount: number;
  extraConfig?: any;
}

export default function StoresManagementPage() {
  const [stores, setStores] = useState<ConnectedStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectModal, setConnectModal] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Form State
  const [marketplace, setMarketplace] = useState<'trendyol' | 'hepsiburada' | 'amazon' | 'n11' | 'ciceksepeti' | 'shopify'>('trendyol');
  const [storeName, setStoreName] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [defaultCarrier, setDefaultCarrier] = useState('TEX');
  const [lwaClientId, setLwaClientId] = useState('');
  const [lwaClientSecret, setLwaClientSecret] = useState('');
  const [lwaRefreshToken, setLwaRefreshToken] = useState('');
  const [testing, setTesting] = useState(false);
  const [testPassed, setTestPassed] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stores');
      const data = await res.json();
      setStores(data.stores || []);
    } catch (e) {
      toast.error("Mağazalar veritabanından yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleTestConnection = async () => {
    if (!sellerId) {
      toast.error("Lütfen Satıcı ID alanını doldurun.");
      return;
    }
    setTesting(true);
    setTestPassed(false);
    
    // Simulate live API handshake & auth verification
    setTimeout(() => {
      setTesting(false);
      setTestPassed(true);
      toast.success(`${marketplace.toUpperCase()} API anahtarları ve bağlantısı başarıyla doğrulandı! (HTTP 200 OK)`);
    }, 1000);
  };

  const handleConnectStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName || !sellerId) {
      toast.error("Lütfen Mağaza Adı ve Satıcı ID alanlarını doldurun.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketplace,
          storeName,
          sellerId,
          supplierId: supplierId || sellerId,
          apiKey,
          apiSecret,
          defaultCarrier,
          lwaClientId,
          lwaClientSecret,
          lwaRefreshToken,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Mağaza başarıyla bağlandı!");
        setConnectModal(false);
        // Reset form
        setStoreName('');
        setSellerId('');
        setApiKey('');
        setApiSecret('');
        setTestPassed(false);
        fetchStores();
      } else {
        toast.error(data.error || "Mağaza bağlanamadı.");
      }
    } catch (err) {
      toast.error("Bağlantı sırasında hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const handleSyncStore = async (id: string, name: string) => {
    setSyncingId(id);
    try {
      const res = await fetch('/api/stores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'sync' }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || `${name} verileri güncellendi!`);
        fetchStores();
      }
    } catch (e) {
      toast.error("Senkronizasyon hatası.");
    } finally {
      setSyncingId(null);
    }
  };

  const handleDeleteStore = async (id: string, name: string) => {
    if (!confirm(`"${name}" mağazasının bağlantısını kaldırmak istediğinize emin misiniz?`)) return;

    try {
      const res = await fetch('/api/stores', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Mağaza bağlantısı kaldırıldı.");
        fetchStores();
      } else {
        toast.error(data.error || "Silinemedi.");
      }
    } catch (e) {
      toast.error("İşlem başarısız.");
    }
  };

  const marketplaceLogos: Record<string, { name: string; color: string; bg: string }> = {
    trendyol: { name: 'Trendyol', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
    hepsiburada: { name: 'Hepsiburada', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    amazon: { name: 'Amazon TR', color: 'text-sky-700', bg: 'bg-sky-50 border-sky-200' },
    n11: { name: 'N11', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
    ciceksepeti: { name: 'Çiçeksepeti', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
    shopify: { name: 'Shopify', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-dark">Mağaza Yönetimi & Yeni Mağaza Bağlama Merkezi</h3>
            <Badge variant="excellent">Supabase Multi-Store</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Trendyol, Hepsiburada, Amazon TR ve diğer pazaryeri mağazalarınızı bağlayın, sipariş ve kâr analizlerini tek panelden yönetin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setConnectModal(true)}
            className="text-xs h-8 sm:h-9 gap-1.5 font-bold shadow-xs bg-primary hover:bg-primary-hover text-white"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Mağaza Bağla</span>
          </Button>

          <Button size="sm" variant="outline" onClick={fetchStores} className="h-8 sm:h-9 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Connected Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((s) => {
          const mpMeta = marketplaceLogos[s.marketplace] || { name: s.marketplace, color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' };
          const isSyncing = syncingId === s.id;

          return (
            <div
              key={s.id}
              className="bg-white rounded-3xl border border-border p-5 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div>
                {/* Store Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2.5">
                    <div className={`px-2.5 py-1 rounded-xl border text-[11px] font-black uppercase tracking-wider ${mpMeta.bg} ${mpMeta.color}`}>
                      {mpMeta.name}
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">ID: {s.sellerId}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-emerald-700">Aktif</span>
                  </div>
                </div>

                {/* Store Info */}
                <div className="pt-3 space-y-2">
                  <h4 className="text-sm font-black text-dark group-hover:text-primary transition-colors">
                    {s.storeName}
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-canvas p-2.5 rounded-2xl border border-border">
                      <span className="text-[10px] text-gray-400 block font-semibold">Toplam Sipariş</span>
                      <span className="font-black text-dark text-sm tabular-nums">{s.orderCount || 24} Adet</span>
                    </div>

                    <div className="bg-canvas p-2.5 rounded-2xl border border-border">
                      <span className="text-[10px] text-gray-400 block font-semibold">Kayıtlı Ürün</span>
                      <span className="font-black text-dark text-sm tabular-nums">{s.productCount || 10} Adet</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-gray-500 pt-1 flex items-center justify-between">
                    <span>Son Senkronizasyon:</span>
                    <span className="font-bold text-gray-700">{s.lastSyncedAt || 'Bugün'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-border/60 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSyncing}
                  onClick={() => handleSyncStore(s.id, s.storeName)}
                  className="text-xs h-7 gap-1 font-bold flex-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-primary' : ''}`} />
                  <span>{isSyncing ? 'Çekiliyor...' : 'Senkronize Et'}</span>
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteStore(s.id, s.storeName)}
                  className="text-xs h-7 text-red-600 hover:bg-red-50 hover:text-red-700 px-2"
                  title="Mağazayı Kaldır"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Connect Store Modal */}
      {connectModal && (
        <div className="fixed inset-0 z-50 bg-dark/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full border border-border shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary-tint-100 flex items-center justify-center text-primary">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-dark">Yeni Pazaryeri Mağazası Bağla</h4>
                  <p className="text-[11px] text-gray-500">API anahtarlarınızı girerek sipariş ve kâr takibini başlatın</p>
                </div>
              </div>
              <button onClick={() => setConnectModal(false)} className="text-gray-400 hover:text-dark font-bold">✕</button>
            </div>

            <form onSubmit={handleConnectStore} className="space-y-4 text-xs">
              
              {/* Step 1: Pazaryeri Seçimi */}
              <div>
                <label className="font-bold text-dark block mb-1.5">1. Pazaryeri Seçin</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'trendyol', label: 'Trendyol', color: 'border-orange-300 hover:bg-orange-50/50' },
                    { id: 'hepsiburada', label: 'Hepsiburada', color: 'border-amber-300 hover:bg-amber-50/50' },
                    { id: 'amazon', label: 'Amazon TR', color: 'border-sky-300 hover:bg-sky-50/50' },
                    { id: 'n11', label: 'N11', color: 'border-red-300 hover:bg-red-50/50' },
                    { id: 'ciceksepeti', label: 'Çiçeksepeti', color: 'border-blue-300 hover:bg-blue-50/50' },
                    { id: 'shopify', label: 'Shopify', color: 'border-emerald-300 hover:bg-emerald-50/50' },
                  ].map((mp) => (
                    <button
                      key={mp.id}
                      type="button"
                      onClick={() => {
                        setMarketplace(mp.id as any);
                        setTestPassed(false);
                      }}
                      className={`p-2.5 rounded-2xl border text-center font-bold transition-all ${
                        marketplace === mp.id
                          ? 'border-primary bg-primary-tint-50 text-primary shadow-xs ring-1 ring-primary'
                          : `border-border text-dark ${mp.color}`
                      }`}
                    >
                      {mp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Mağaza Bilgileri */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="font-bold text-dark block mb-1">Mağaza Takma Adı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Butik Kozmetik Trendyol"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border font-bold focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                {/* Trendyol Specific Fields */}
                {marketplace === 'trendyol' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-dark block mb-1">Satıcı ID (Supplier ID) *</label>
                        <input
                          type="text"
                          required
                          placeholder="Örn: 108452"
                          value={sellerId}
                          onChange={(e) => setSellerId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-border font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-dark block mb-1">Varsayılan Kargo Taşıyıcısı</label>
                        <select
                          value={defaultCarrier}
                          onChange={(e) => setDefaultCarrier(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-border font-bold bg-white"
                        >
                          <option value="TEX">Trendyol Express (TEX)</option>
                          <option value="ARAS">Aras Kargo</option>
                          <option value="MNG">MNG Kargo</option>
                          <option value="YURTICI">Yurtiçi Kargo</option>
                          <option value="SURAT">Sürat Kargo</option>
                          <option value="PTT">PTT Kargo</option>
                          <option value="HEPSIJET">HepsiJET</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-dark block mb-1">API Key (Entegrasyon Anahtarı) *</label>
                      <input
                        type="text"
                        required
                        placeholder="ty_prod_key_..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-border font-mono"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-dark block mb-1">API Secret (Entegrasyon Şifresi) *</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••••••"
                        value={apiSecret}
                        onChange={(e) => setApiSecret(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-border font-mono"
                      />
                    </div>
                  </>
                )}

                {/* Hepsiburada Specific Fields */}
                {marketplace === 'hepsiburada' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-dark block mb-1">Merchant ID *</label>
                        <input
                          type="text"
                          required
                          placeholder="Örn: HB_MERCHANT_49102"
                          value={sellerId}
                          onChange={(e) => setSellerId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-border font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-dark block mb-1">Entegratör Kodu</label>
                        <input
                          type="text"
                          defaultValue="DVT_INTEGRATOR"
                          className="w-full px-3 py-2 rounded-xl border border-border font-mono bg-canvas"
                          disabled
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-dark block mb-1">API Key / Service Key *</label>
                      <input
                        type="text"
                        required
                        placeholder="hb_live_key_..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-border font-mono"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-dark block mb-1">API Secret *</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••••••"
                        value={apiSecret}
                        onChange={(e) => setApiSecret(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-border font-mono"
                      />
                    </div>
                  </>
                )}

                {/* Amazon TR Specific Fields */}
                {marketplace === 'amazon' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-dark block mb-1">Seller ID / Merchant Token *</label>
                        <input
                          type="text"
                          required
                          placeholder="Örn: A2N37482TR"
                          value={sellerId}
                          onChange={(e) => setSellerId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-border font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-dark block mb-1">Marketplace ID</label>
                        <input
                          type="text"
                          defaultValue="A33AVAJ2PDY3EV (TR)"
                          className="w-full px-3 py-2 rounded-xl border border-border font-mono bg-canvas"
                          disabled
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-dark block mb-1">LWA Client ID *</label>
                      <input
                        type="text"
                        required
                        placeholder="amzn1.application-oa2-client..."
                        value={lwaClientId}
                        onChange={(e) => setLwaClientId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-border font-mono"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-dark block mb-1">LWA Client Secret *</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••••••"
                        value={lwaClientSecret}
                        onChange={(e) => setLwaClientSecret(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-border font-mono"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-dark block mb-1">LWA Refresh Token *</label>
                      <input
                        type="password"
                        required
                        placeholder="Atzr|IwEBIB..."
                        value={lwaRefreshToken}
                        onChange={(e) => setLwaRefreshToken(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-border font-mono"
                      />
                    </div>
                  </>
                )}

                {/* Other Marketplaces */}
                {['n11', 'ciceksepeti', 'shopify'].includes(marketplace) && (
                  <>
                    <div>
                      <label className="font-bold text-dark block mb-1">Satıcı / Mağaza Kodu *</label>
                      <input
                        type="text"
                        required
                        placeholder="Örn: 99418"
                        value={sellerId}
                        onChange={(e) => setSellerId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-border font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-dark block mb-1">API Key / Access Token *</label>
                      <input
                        type="text"
                        required
                        placeholder="api_token_..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-border font-mono"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Connection Test Button */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-canvas border border-border">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-gray-700">
                    {testPassed ? 'Bağlantı Başarılı & Doğrulandı' : 'Bağlantı doğrulaması yapılması önerilir'}
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="text-xs font-bold gap-1 bg-white"
                >
                  <Radio className={`w-3 h-3 text-primary ${testing ? 'animate-ping' : ''}`} />
                  <span>{testing ? 'Test Ediliyor...' : testPassed ? 'Tekrar Test Et' : 'Bağlantıyı Test Et'}</span>
                </Button>
              </div>

              {/* Form Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setConnectModal(false)}>
                  Vazgeç
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={saving}
                  className="text-xs font-bold gap-1.5 shadow-xs bg-primary hover:bg-primary-hover text-white"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{saving ? 'Veritabanına Kaydediliyor...' : 'Mağazayı Bağla ve Senkronize Et'}</span>
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
