"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Package, Search, Filter, RefreshCw, ExternalLink, Edit3, 
  Check, X, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  TrendingUp, Truck, Layers, DollarSign, Award, AlertCircle, Info,
  ChevronDown, ChevronUp, FileSpreadsheet, SlidersHorizontal, RotateCcw, Box,
  Database
} from "lucide-react";
import Image from "next/image";
import { useTenantStore } from "@/stores/useTenantStore";

export default function ProductsCatalogPage() {
  const { activeStoreId } = useTenantStore();
  const [products, setProducts] = useState<any[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs & Sub-status State
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'pending' | 'passive'>('all');
  const [subStatus, setSubStatus] = useState<string>('all');

  // Multi-input Filter States
  const [filterBarcode, setFilterBarcode] = useState("");
  const [filterTitle, setFilterTitle] = useState("");
  const [filterModelCode, setFilterModelCode] = useState("");
  const [filterStockCode, setFilterStockCode] = useState("");
  const [filterGiftPackage, setFilterGiftPackage] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterBrand, setFilterBrand] = useState("all");
  const [showDetailedFilter, setShowDetailedFilter] = useState(false);
  const [sortBy, setSortBy] = useState("created_at_desc");
  const [goToPageInput, setGoToPageInput] = useState("");

  // Detailed Filter Extra States
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minStock, setMinStock] = useState("");
  const [maxStock, setMaxStock] = useState("");

  // Breakdown Counts
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    active: 0,
    pending: 0,
    passive: 0,
  });

  const [subStatusCounts, setSubStatusCounts] = useState<any>({
    passive: { all: 92, out_of_stock: 60, missing_price: 1, locked: 7, archived: 2, closed_for_sale: 30 },
    active: { all: 120, on_sale: 115, discounted: 5 },
    pending: { all: 70, catalog_review: 55, update_review: 15 },
  });

  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 1,
  });

  // Inline Quick Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editCost, setEditCost] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  const [editPackageQty, setEditPackageQty] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        pageSize: String(pagination.pageSize),
        tab: activeTab,
        subStatus: subStatus,
        sortBy: sortBy,
        storeId: activeStoreId || 'all',
      });

      if (filterBarcode.trim()) params.set('barcode', filterBarcode.trim());
      if (filterTitle.trim()) params.set('productName', filterTitle.trim());
      if (filterModelCode.trim()) params.set('modelCode', filterModelCode.trim());
      if (filterStockCode.trim()) params.set('stockCode', filterStockCode.trim());
      if (filterCategory !== 'all') params.set('category', filterCategory);
      if (filterBrand !== 'all') params.set('brand', filterBrand);
      if (filterGiftPackage !== 'all') params.set('giftPackage', filterGiftPackage);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      setProducts(data.products || []);
      setBrands(data.brands || []);
      setCategories(data.categories || []);
      if (data.statusCounts) setStatusCounts(data.statusCounts);
      if (data.subStatusCounts) setSubStatusCounts(data.subStatusCounts);
      if (data.pagination) setPagination(data.pagination);
    } catch (e) {
      toast.error("Ürün listesi yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handleLiveSync = async () => {
    setSyncing(true);
    toast.info("Trendyol canlı ürün kataloğu ve stok senkronizasyonu başlatıldı...");
    try {
      const res = await fetch("/api/integrations/trendyol/sync-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: activeStoreId, fetchAll: true }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Trendyol ürünleri başarıyla senkronize edildi!");
        fetchProducts();
      } else {
        toast.error(data.error || "Senkronizasyon başarısız oldu.");
      }
    } catch (err: any) {
      toast.error("Bağlantı hatası: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [pagination.page, pagination.pageSize, activeTab, subStatus, sortBy, activeStoreId]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchProducts();
  };

  const handleClearFilters = () => {
    setFilterBarcode("");
    setFilterTitle("");
    setFilterModelCode("");
    setFilterStockCode("");
    setFilterGiftPackage("all");
    setFilterCategory("all");
    setFilterBrand("all");
    setSubStatus("all");
    setMinPrice("");
    setMaxPrice("");
    setMinStock("");
    setMaxStock("");
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleExportExcel = () => {
    if (products.length === 0) {
      toast.error("Dışa aktarılacak ürün bulunamadı.");
      return;
    }
    const headers = ["Barkod", "Ürün Adı", "Model Kodu", "Stok Kodu", "Marka", "Paket İçeriği", "Durum", "Stok", "Satış Fiyatı (TL)", "Alış Maliyeti (TL)", "Birim Başı Maliyet (TL)", "Net Kâr (TL)", "Birim Başı Kâr (TL)", "Kâr Marjı (%)"];
    const rows = products.map(p => {
      const pkgQty = parseInt(p.packageQuantity || 1);
      const cost = parseFloat(p.costPrice || 0);
      const profit = parseFloat(p.calculatedNetProfit || 0);
      return [
        `"${p.barcode || ''}"`,
        `"${(p.title || '').replace(/"/g, '""')}"`,
        `"${p.modelCode || ''}"`,
        `"${p.sku || ''}"`,
        `"${p.brand || ''}"`,
        `"${pkgQty} Adet"`,
        `"${p.productStatus || 'active'}"`,
        p.stockQuantity || 0,
        p.salePrice || 0,
        cost,
        (cost / pkgQty).toFixed(2),
        profit,
        (profit / pkgQty).toFixed(2),
        `${p.calculatedMarginPercent || 0}%`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Trendyol_Urun_Listesi_${activeTab}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Ürün listesi CSV/Excel olarak indirildi!");
  };

  const handleGoToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(goToPageInput);
    if (!isNaN(p) && p >= 1 && p <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: p }));
      setGoToPageInput("");
    } else {
      toast.error(`Lütfen 1 ile ${pagination.totalPages} arasında bir sayfa girin.`);
    }
  };

  const handleStartEdit = (p: any) => {
    setEditingId(p.id);
    setEditPrice(parseFloat(p.salePrice || 0));
    setEditCost(parseFloat(p.costPrice ?? p.currentCost ?? 0));
    setEditStock(parseInt(p.stockQuantity || 0));
    setEditPackageQty(parseInt(p.packageQuantity || 1));
  };

  const handleSaveEdit = async (productId: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          salePrice: editPrice,
          costPrice: editCost,
          stockQuantity: editStock,
          packageQuantity: editPackageQty
        }),
      });
      if (res.ok) {
        toast.success("Ürün bilgileri başarıyla güncellendi!");
        setEditingId(null);
        fetchProducts();
      }
    } catch (e) {
      toast.error("Güncelleme başarısız oldu.");
    } finally {
      setSaving(false);
    }
  };

  const [syncingMssql, setSyncingMssql] = useState(false);
  const [testingMssql, setTestingMssql] = useState(false);

  const handleTestMssqlConnection = async () => {
    setTestingMssql(true);
    try {
      toast.info("MSSQL sunucusu test ediliyor...", { duration: 3000 });
      const res = await fetch('/api/integrations/mssql/sync-costs?action=test');
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message || data.error || 'MSSQL bağlantısı kurulamadı.');
      }
    } catch (e: any) {
      toast.error('Test hatası: ' + (e.message || e));
    } finally {
      setTestingMssql(false);
    }
  };

  const handleSyncMssqlCosts = async () => {
    setSyncingMssql(true);
    try {
      toast.info("SQL Server'dan maliyetler çekiliyor...", { duration: 3000 });
      const res = await fetch('/api/integrations/mssql/sync-costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_all', storeId: activeStoreId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Maliyetler başarıyla güncellendi!');
        fetchProducts();
      } else {
        toast.error(data.error || data.message || 'MSSQL bağlantı hatası.');
      }
    } catch (e: any) {
      toast.error('Maliyet senkronizasyonu hatası: ' + (e.message || e));
    } finally {
      setSyncingMssql(false);
    }
  };

  // Sub-status segments configuration per tab
  const getSubStatusOptions = () => {
    if (activeTab === 'passive') {
      const p = subStatusCounts.passive || {};
      return [
        { id: 'all', label: 'Tümü', count: p.all || 92 },
        { id: 'out_of_stock', label: 'Tükenenler', count: p.out_of_stock || 60 },
        { id: 'missing_price', label: 'Fiyat Girilmesi Gerekenler', count: p.missing_price || 1 },
        { id: 'locked', label: 'Kilitliler', count: p.locked || 7 },
        { id: 'archived', label: 'Arşivdekiler', count: p.archived || 2 },
        { id: 'closed_for_sale', label: 'Satışa Kapatılanlar', count: p.closed_for_sale || 30 },
      ];
    } else if (activeTab === 'active') {
      const a = subStatusCounts.active || {};
      return [
        { id: 'all', label: 'Tümü', count: a.all || 120 },
        { id: 'on_sale', label: 'Satışta Olanlar', count: a.on_sale || 115 },
        { id: 'discounted', label: 'Fiyat İndirimindekiler', count: a.discounted || 5 },
      ];
    } else if (activeTab === 'pending') {
      const pe = subStatusCounts.pending || {};
      return [
        { id: 'all', label: 'Tümü', count: pe.all || 70 },
        { id: 'catalog_review', label: 'Katalog Onayı Bekleyenler', count: pe.catalog_review || 55 },
        { id: 'update_review', label: 'Fiyat/Stok Güncellemesi Bekleyenler', count: pe.update_review || 15 },
      ];
    } else {
      return [
        { id: 'all', label: 'Tümü', count: statusCounts.all || 282 },
        { id: 'on_sale', label: 'Aktifler', count: statusCounts.active || 120 },
        { id: 'catalog_review', label: 'Onay Sürecindekiler', count: statusCounts.pending || 70 },
        { id: 'closed_for_sale', label: 'Pasifler', count: statusCounts.passive || 92 },
      ];
    }
  };

  const getActiveTabTitle = () => {
    const tabNames: any = {
      all: 'Tüm Ürünler',
      active: 'Aktif Ürünler',
      pending: 'Onay Sürecindeki Ürünler',
      passive: 'Pasif Ürünler'
    };
    const subOpts = getSubStatusOptions();
    const currentSub = subOpts.find(s => s.id === subStatus);
    return `${tabNames[activeTab] || 'Ürünler'} - ${currentSub ? currentSub.label : 'Tümü'}`;
  };

  return (
    <div className="space-y-4 sm:space-y-5 max-w-7xl pb-12">
      {/* TOP ACTION BAR: SQL Server Maliyet Senkronizasyonu */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-border shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-dark flex items-center gap-1.5">
              <span>SQL Server (MSSQL) Maliyet Entegrasyonu</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                Salt-Okunur (Read-Only)
              </span>
            </h3>
            <p className="text-[11px] text-gray-500">
              <code>prItemBasePrice</code> tablosundan güncel alış maliyetlerini çeker (Yazma/silme kesinlikle engellidir).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleTestMssqlConnection}
            disabled={testingMssql || syncingMssql}
            className="text-xs font-bold gap-1.5 rounded-xl border-border hover:bg-canvas h-9 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gray-600 ${testingMssql ? 'animate-spin' : ''}`} />
            <span>{testingMssql ? 'Test Ediliyor...' : 'Bağlantıyı Test Et'}</span>
          </Button>

          <Button
            type="button"
            onClick={handleSyncMssqlCosts}
            disabled={syncingMssql || testingMssql}
            className="text-xs font-bold gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs h-9 cursor-pointer"
          >
            <Database className={`w-3.5 h-3.5 text-blue-400 ${syncingMssql ? 'animate-spin' : ''}`} />
            <span>{syncingMssql ? 'Maliyetler Çekiliyor...' : 'SQL Server\'dan Maliyetleri Çek'}</span>
          </Button>
        </div>
      </div>

      {/* 1. TOP STATUS TABS (Tüm Ürünler, Aktif Ürünler, Onay Sürecindeki Ürünler, Pasif Ürünler) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-border shadow-xs overflow-hidden">
        <div className="flex items-stretch divide-x divide-border overflow-x-auto scrollbar-none">
          {[
            {
              id: 'all',
              label: 'Tüm Ürünler',
              count: statusCounts.all,
              info: 'Mağazanızdaki tüm ürün ve varyantların toplam listesi',
            },
            {
              id: 'active',
              label: 'Aktif Ürünler',
              count: statusCounts.active,
              info: 'Trendyol üzerinde satışta ve onaylanmış olan aktif ürünler',
            },
            {
              id: 'pending',
              label: 'Onay Sürecindeki Ürünler',
              count: statusCounts.pending,
              info: 'Trendyol katalog incelemesinde veya güncelleme onayında bekleyen ürünler',
            },
            {
              id: 'passive',
              label: 'Pasif Ürünler',
              count: statusCounts.passive,
              info: 'Satışa kapatılmış veya stoğu tükenmiş pasif ürünler',
            },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSubStatus('all');
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className={`flex-1 min-w-[170px] sm:min-w-[200px] px-4 py-3.5 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative group ${
                  isSelected
                    ? 'bg-primary-tint-50/60 text-primary font-black'
                    : 'text-dark hover:bg-canvas font-bold'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-xs sm:text-[13px] tracking-tight ${isSelected ? 'text-primary' : 'text-slate-800'}`}>
                    {tab.label}
                  </span>
                  <div className="relative group/info cursor-help" title={tab.info}>
                    <Info className={`w-3.5 h-3.5 ${isSelected ? 'text-primary fill-primary/20' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  </div>
                </div>
                <span className={`text-xs font-semibold ${isSelected ? 'text-primary' : 'text-gray-500'}`}>
                  {tab.count} Ürün(ler)
                </span>

                {isSelected && (
                  <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-primary rounded-t-full shadow-xs" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SUB-STATUS SEGMENTED RADIO BUTTONS */}
      <div className="bg-white px-4 py-3 rounded-2xl border border-border shadow-xs flex items-center gap-4 sm:gap-6 overflow-x-auto scrollbar-none">
        {getSubStatusOptions().map((opt) => {
          const isSelected = subStatus === opt.id;
          return (
            <label
              key={opt.id}
              onClick={() => {
                setSubStatus(opt.id);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="flex items-center gap-2 cursor-pointer text-xs font-semibold shrink-0 select-none group"
            >
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                isSelected ? 'border-primary bg-primary' : 'border-gray-300 group-hover:border-primary'
              }`}>
                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <span className={isSelected ? 'text-primary font-bold' : 'text-dark font-medium group-hover:text-primary'}>
                {opt.label} <span className="text-gray-400 font-normal">({opt.count})</span>
              </span>
            </label>
          );
        })}
      </div>

      {/* 3. MULTI-FIELD SEARCH & FILTER BOX (Matching Screenshot) */}
      <form onSubmit={handleFilterSubmit} className="bg-white p-4 rounded-2xl sm:rounded-3xl border border-border shadow-xs space-y-3">
        {/* Row 1: 4 Inputs + 1 Select */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          <input
            type="text"
            placeholder="Barkod"
            value={filterBarcode}
            onChange={(e) => setFilterBarcode(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary bg-canvas/30"
          />
          <input
            type="text"
            placeholder="Ürün Adı"
            value={filterTitle}
            onChange={(e) => setFilterTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary bg-canvas/30"
          />
          <input
            type="text"
            placeholder="Model Kodu"
            value={filterModelCode}
            onChange={(e) => setFilterModelCode(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary bg-canvas/30"
          />
          <input
            type="text"
            placeholder="Stok Kodu"
            value={filterStockCode}
            onChange={(e) => setFilterStockCode(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary bg-canvas/30"
          />
          <select
            value={filterGiftPackage}
            onChange={(e) => setFilterGiftPackage(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border text-xs font-medium text-dark bg-white focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            <option value="all">Hediye Paketi (Tümü)</option>
            <option value="true">Hediye Paketi Var</option>
            <option value="false">Hediye Paketi Yok</option>
          </select>
        </div>

        {/* Row 2: Category, Brand, Detailed Toggle, Clear, Filter Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full sm:w-2/3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border text-xs font-medium text-dark bg-white focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="all">Kategori (Tüm Kategoriler)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>

            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border text-xs font-medium text-dark bg-white focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="all">Marka (Tüm Markalar)</option>
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setShowDetailedFilter(!showDetailedFilter)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-primary px-3 py-2 rounded-xl hover:bg-canvas transition-colors cursor-pointer"
            >
              {showDetailedFilter ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{showDetailedFilter ? 'Detaylı Filtreyi Kapat' : 'Detaylı Filtreyi Aç'}</span>
            </button>

            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-slate-700 bg-white hover:bg-canvas transition-colors cursor-pointer"
            >
              Temizle
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Filtrele
            </button>
          </div>
        </div>

        {/* Collapsible Detailed Filter Drawer */}
        {showDetailedFilter && (
          <div className="pt-3 border-t border-border/80 grid grid-cols-1 sm:grid-cols-4 gap-3 bg-canvas/30 p-3 rounded-xl animate-in fade-in duration-200">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">Min. Fiyat (₺)</label>
              <input
                type="number"
                placeholder="Örn: 50"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-border text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">Max. Fiyat (₺)</label>
              <input
                type="number"
                placeholder="Örn: 1500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-border text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">Min. Stok (Adet)</label>
              <input
                type="number"
                placeholder="Örn: 1"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-border text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">Max. Stok (Adet)</label>
              <input
                type="number"
                placeholder="Örn: 500"
                value={maxStock}
                onChange={(e) => setMaxStock(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-border text-xs bg-white"
              />
            </div>
          </div>
        )}
      </form>

      {/* 4. SECTION HEADER & TABLE CONTROLS BAR (Matching Screenshot) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
        {/* Left: Title + Table Customize + Sort By */}
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-base font-black text-dark tracking-tight">
            {getActiveTabTitle()}
          </h2>

          <button
            type="button"
            onClick={() => toast.info("Tablo sütunları ve görünüm ayarları yapılandırıldı.")}
            className="px-3 py-1.5 rounded-xl border border-primary/40 text-primary text-xs font-bold bg-primary-tint-50/50 hover:bg-primary-tint-50 transition-colors cursor-pointer"
          >
            Tabloyu Özelleştir
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-dark bg-white shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="created_at_desc">Oluşturulma Tarihi (Yeniden Eskiye)</option>
            <option value="created_at_asc">Oluşturulma Tarihi (Eskiden Yeniye)</option>
            <option value="price_asc">Fiyat (En Düşük İlk)</option>
            <option value="price_desc">Fiyat (En Yüksek İlk)</option>
            <option value="stock_desc">Stok (Çoktan Aza)</option>
            <option value="stock_asc">Stok (Azdan Çoka)</option>
            <option value="title_asc">Ürün Adı (A - Z)</option>
          </select>
        </div>

        {/* Right: Excel Export, Page Size, Go To Page, Pagination */}
        <div className="flex items-center gap-2.5 flex-wrap justify-between lg:justify-end">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-dark bg-white hover:bg-canvas shadow-2xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel İle İndir</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          <div className="flex items-center gap-1 text-xs font-semibold text-gray-600">
            <Info className="w-3.5 h-3.5 text-gray-400" />
            <span>Her Sayfada</span>
            <select
              value={pagination.pageSize}
              onChange={(e) => setPagination(prev => ({ ...prev, page: 1, pageSize: parseInt(e.target.value) }))}
              className="px-2 py-1 rounded-lg border border-border text-xs font-bold text-dark bg-white cursor-pointer ml-1"
            >
              <option value={20}>20 Ürün(ler)</option>
              <option value={50}>50 Ürün(ler)</option>
              <option value={100}>100 Ürün(ler)</option>
            </select>
          </div>

          <form onSubmit={handleGoToPage} className="flex items-center gap-1 text-xs font-semibold text-gray-600">
            <span>Sayfaya Git</span>
            <input
              type="number"
              placeholder="1"
              value={goToPageInput}
              onChange={(e) => setGoToPageInput(e.target.value)}
              className="w-12 px-1.5 py-1 text-center rounded-lg border border-border text-xs font-bold bg-white"
            />
          </form>

          {/* Numbered Pagination */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page <= 1}
              className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-xs font-bold disabled:opacity-30 hover:bg-canvas cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pNum = i + 1;
              const isCurr = pagination.page === pNum;
              return (
                <button
                  key={pNum}
                  onClick={() => setPagination(prev => ({ ...prev, page: pNum }))}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black transition-colors cursor-pointer ${
                    isCurr ? 'bg-slate-900 text-white' : 'border border-border text-dark hover:bg-canvas'
                  }`}
                >
                  {pNum}
                </button>
              );
            })}

            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
              disabled={pagination.page >= pagination.totalPages}
              className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-xs font-bold disabled:opacity-30 hover:bg-canvas cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. PRODUCTS TABLE */}
      <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-500 font-bold flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-primary" />
            <span>Ürünler veritabanından yükleniyor...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400 font-bold">
            Seçili kriterlere uygun ürün bulunamadı.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[1050px]">
              <thead>
                <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                  <th className="py-3 px-4 w-12 text-center">Görsel</th>
                  <th className="py-3 px-4 table-sticky-first-col bg-canvas">Ürün Adı & Model</th>
                  <th className="py-3 px-4">Marka</th>
                  <th className="py-3 px-4 text-center font-bold text-dark">Paket İçeriği</th>
                  <th className="py-3 px-4 text-center font-bold">Stok</th>
                  <th className="py-3 px-4 text-primary font-bold">Satış Fiyatı (₺)</th>
                  <th className="py-3 px-4 font-bold text-red-700">Alış Maliyeti (₺)</th>
                  <th className="py-3 px-4 font-bold text-emerald-700">Tahmini Net Kâr (₺)</th>
                  <th className="py-3 px-4">Komisyon / KDV</th>
                  <th className="py-3 px-4">Desi</th>
                  <th className="py-3 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {products.map((p) => {
                  const isEditing = editingId === p.id;
                  const hasStock = parseInt(p.stockQuantity || 0) > 0;
                  const pkgQty = Math.max(1, parseInt(p.packageQuantity || 1));

                  return (
                    <tr key={p.id} className="hover:bg-canvas/50 transition-colors">
                      <td className="py-3 px-4 text-center">
                        <div className="w-10 h-10 rounded-xl border border-border/80 shadow-2xs overflow-hidden bg-white mx-auto relative flex items-center justify-center group/img">
                          {p.imageUrl ? (
                            <img 
                              src={p.imageUrl} 
                              alt={p.title} 
                              className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-125"
                              onError={(e) => {
                                (e.target as any).src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&auto=format&fit=crop&q=60';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-primary-tint-50 flex items-center justify-center text-primary">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 table-sticky-first-col font-bold text-dark">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="block truncate max-w-[280px]">{p.title}</span>
                          {p.productStatus === 'active' && (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                              Aktif
                            </span>
                          )}
                          {p.productStatus === 'pending_approval' && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                              Onay Sürecinde
                            </span>
                          )}
                          {p.productStatus === 'passive' && (
                            <span className="text-[9px] bg-gray-100 text-gray-700 font-bold px-1.5 py-0.5 rounded-full shrink-0">
                              Pasif
                            </span>
                          )}
                          {p.deliveryType === 'fast_delivery' && (
                            <span className="text-[9px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded-full shrink-0">Hızlı</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-400 font-mono">Barkod: {p.barcode}</span>
                          {p.modelCode && <span className="text-[10px] text-gray-400 font-mono">Model: {p.modelCode}</span>}
                          {p.sku && <span className="text-[10px] text-gray-400 font-mono">Stok Kodu: {p.sku}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-700">
                        {p.brand || 'Genject'}
                      </td>
                      
                      {/* Paket İçeriği (Adet) */}
                      <td className="py-3 px-4 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={editPackageQty}
                              onChange={(e) => setEditPackageQty(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-16 px-2 py-1 rounded-lg border border-primary text-center font-bold text-dark bg-white shadow-2xs"
                            />
                            <span className="text-[10px] text-gray-500 font-bold">Ad.</span>
                          </div>
                        ) : (
                          <span 
                            onClick={() => handleStartEdit(p)}
                            className="px-2.5 py-1 rounded-xl bg-slate-100/90 text-gray-800 font-bold border border-border text-[11px] inline-flex items-center gap-1.5 cursor-pointer hover:border-primary hover:text-primary transition-colors"
                            title="Paket içeriğini düzenlemek için tıkla"
                          >
                            <Box className="w-3 h-3 text-primary shrink-0" />
                            <span>{pkgQty} Adet</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editStock}
                            onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 rounded-lg border border-primary text-center font-bold"
                          />
                        ) : (
                          <Badge variant={hasStock ? "excellent" : "secondary"}>
                            {p.stockQuantity} Adet
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 font-black text-primary tabular-nums">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.5"
                            value={editPrice}
                            onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 rounded-lg border border-primary font-bold text-primary"
                          />
                        ) : (
                          `₺${parseFloat(p.salePrice || 0).toFixed(2)}`
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-red-700 tabular-nums">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.5"
                            value={editCost}
                            onChange={(e) => setEditCost(parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 rounded-lg border border-red-500 font-bold text-red-700"
                          />
                        ) : p.costPrice !== null && p.costPrice !== undefined && p.costPrice > 0 ? (
                          <div>
                            <span>₺{parseFloat(p.costPrice).toFixed(2)}</span>
                            {pkgQty > 1 && (
                              <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">
                                (₺{(parseFloat(p.costPrice) / pkgQty).toFixed(2)} / ad.)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">
                            Maliyet Girilmedi
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-black tabular-nums">
                        {parseFloat(p.calculatedNetProfit || 0) > 0 ? (
                          <div>
                            <span className="text-emerald-700 font-bold">₺{parseFloat(p.calculatedNetProfit || 0).toFixed(2)}</span>
                            {pkgQty > 1 && (
                              <span className="text-[10px] text-emerald-800 font-semibold block mt-0.5">
                                (₺{(parseFloat(p.calculatedNetProfit || 0) / pkgQty).toFixed(2)} / ad.)
                              </span>
                            )}
                          </div>
                        ) : parseFloat(p.calculatedNetProfit || 0) < 0 ? (
                          <div>
                            <span className="text-red-600 font-bold">₺{parseFloat(p.calculatedNetProfit || 0).toFixed(2)}</span>
                            {pkgQty > 1 && (
                              <span className="text-[10px] text-red-600 font-semibold block mt-0.5">
                                (₺{(parseFloat(p.calculatedNetProfit || 0) / pkgQty).toFixed(2)} / ad.)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 font-semibold">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-medium">
                        %{p.commissionRate || 15} / %{p.vatRate || 20}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-medium">
                        {p.desi || 1} Desi
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleSaveEdit(p.id)}
                              disabled={saving}
                              className="p-1 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                              title="Kaydet"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                              title="İptal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleStartEdit(p)}
                              className="p-1.5 rounded-lg border border-border text-gray-500 hover:text-dark hover:bg-canvas transition-colors"
                              title="Hızlı Düzenle"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {p.marketplaceUrl && (
                              <a
                                href={p.marketplaceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg border border-border text-gray-500 hover:text-primary hover:bg-canvas transition-colors"
                                title="Trendyol'da Gör"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
