"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";
import { TablePagination } from "@/components/common/TablePagination";
import { 
  Users, ShoppingBag, TrendingUp, Search, RefreshCw, Eye, 
  MapPin, Phone, Mail, Calendar, ArrowRight, ShieldCheck, 
  Award, PackageCheck, Truck, ChevronRight, X, Building2,
  BarChart3, Sparkles, Filter, CheckCircle2
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, Cell 
} from "recharts";
import { OrderDetailModal } from "@/components/orders/OrderDetailModal";
import { useTenantStore } from "@/stores/useTenantStore";

interface Customer {
  name: string;
  city: string;
  district: string;
  email: string;
  phone: string;
  totalOrdersCount: number;
  totalSpendAmount: number;
  totalNetProfit: number;
  avgOrderValue?: number;
  marginPercent?: number;
  lastOrderDate: string;
}

interface CityBreakdown {
  city: string;
  orderCount: number | string;
  customerCount: number | string;
  totalRevenue: number | string;
  totalProfit: number | string;
  avgOrderValue: number | string;
  marginPercent: number | string;
}

export default function CustomersPage() {
  const { activeStoreId } = useTenantStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cityBreakdown, setCityBreakdown] = useState<CityBreakdown[]>([]);
  const [summary, setSummary] = useState<any>({
    totalCustomers: 0,
    totalCustomersCount: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalLTV: 0,
    totalProfit: 0,
    avgOrderValue: 0,
    vipCustomersCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selectedCity, setSelectedCity] = useState("all");
  const [activeTab, setActiveTab] = useState<"customers" | "cities">("customers");

  // Drawer / Modal for Customer Orders
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers?storeId=${activeStoreId}`);
      const data = await res.json();
      setCustomers(data.customers || []);
      setSummary(data.summary || {});
      setCityBreakdown(data.cityBreakdown || []);
    } catch (e) {
      toast.error("Müşteri listesi yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [activeStoreId]);

  const handleOpenCustomerOrders = async (cust: Customer) => {
    setSelectedCustomer(cust);
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/customers?name=${encodeURIComponent(cust.name)}&storeId=${activeStoreId}`);
      const data = await res.json();
      setCustomerOrders(data.orders || []);
    } catch (e) {
      toast.error("Müşteri siparişleri alınamadı.");
    } finally {
      setLoadingOrders(false);
    }
  };

  // Filtered Customers
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.phone && c.phone.includes(searchQuery));

    const matchesCity = selectedCity === 'all' || c.city.toLowerCase() === selectedCity.toLowerCase();

    return matchesSearch && matchesCity;
  });

  const uniqueCities = Array.from(new Set(customers.map((c) => c.city))).filter(Boolean);

  // Top 10 Cities for Chart
  const top10CitiesChartData = cityBreakdown.slice(0, 10).map((c) => ({
    name: c.city,
    Ciro: parseFloat(String(c.totalRevenue || 0)),
    NetKar: parseFloat(String(c.totalProfit || 0)),
    AOV: parseFloat(String(c.avgOrderValue || 0)),
    Siparis: parseInt(String(c.orderCount || 0)),
  }));

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-dark">Müşteri Listesi, Şehir Analizi & Sipariş Geçmişi</h3>
            <Badge variant="excellent">{summary.totalOrders ? `${summary.totalOrders} Canlı Sipariş` : 'Canlı Sipariş Veritabanı'}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Siparişlerinizdeki müşterilerin toplam harcamaları, ortalama sepet tutarları (AOV), il bazlı kârlılık dökümleri ve geçmiş siparişleri
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={fetchCustomers} className="h-8 sm:h-9 text-xs gap-1.5 self-start sm:self-auto font-bold">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards (5 Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* 1. Toplam Tekil Müşteri */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">Toplam Tekil Müşteri</span>
          <div className="text-xl sm:text-2xl font-black text-dark tabular-nums mt-1">{summary.totalCustomers || summary.totalCustomersCount || 0} Kişi</div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Benzersiz Müşteri</span>
        </div>

        {/* 2. Toplam Ciro */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">Toplam Müşteri Cirosu</span>
          <div className="text-xl sm:text-2xl font-black text-primary tabular-nums mt-1">{formatCurrency(parseFloat(summary.totalRevenue || 0))}</div>
          <span className="text-[11px] text-gray-500 font-semibold mt-1 block">Faturalanan Tutar</span>
        </div>

        {/* 3. Bırakılan Net Kâr */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">Bırakılan Net Kâr</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 tabular-nums mt-1">{formatCurrency(parseFloat(summary.totalProfit || 0))}</div>
          <span className="text-[11px] text-emerald-700 font-bold mt-1 block">Tüm Kesintiler Sonrası</span>
        </div>

        {/* 4. Ortalama Sepet Tutarı (AOV) */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">Ortalama Sepet Tutarı</span>
          <div className="text-xl sm:text-2xl font-black text-indigo-700 tabular-nums mt-1">{formatCurrency(parseFloat(summary.avgOrderValue || 0))}</div>
          <span className="text-[11px] text-indigo-600 font-bold mt-1 block">Sipariş Başına (AOV)</span>
        </div>

        {/* 5. Tekrarlayan Sadık Müşteri */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">Sadık Müşteri (VIP)</span>
          <div className="text-xl sm:text-2xl font-black text-dark tabular-nums mt-1">{summary.vipCustomersCount || 0} Müşteri</div>
          <span className="text-[11px] text-primary font-bold mt-1 block">2+ Sipariş Verenler</span>
        </div>
      </div>

      {/* VIEW SELECTOR TABS */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 bg-canvas rounded-2xl border border-border">
          <button
            onClick={() => setActiveTab("customers")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "customers"
                ? "bg-primary text-white shadow-xs"
                : "text-dark hover:bg-white"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Müşteri Listesi ({customers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("cities")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "cities"
                ? "bg-primary text-white shadow-xs"
                : "text-dark hover:bg-white"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>İllere Göre Rapor & Grafikler ({cityBreakdown.length} İl)</span>
          </button>
        </div>

        {activeTab === "cities" && (
          <Badge variant="secondary" className="text-xs font-bold bg-primary-tint-50 text-primary border border-primary-tint-200">
            📊 Türkiye Genel Kârlılık Dağılımı
          </Badge>
        )}
      </div>

      {/* 1. CITIES ANALYTICS & CHARTS VIEW */}
      {activeTab === "cities" && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            
            {/* Chart 1: Top 10 Cities Revenue & Net Profit */}
            <div className="lg:col-span-7 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-black text-dark">En Çok Satış Yapılan İlk 10 İl (Ciro & Net Kâr)</h4>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold">Toplam Ciro (₺)</Badge>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top10CitiesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} />
                    <YAxis stroke="#6B7280" fontSize={11} tickLine={false} tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: any, name: any) => [
                        formatCurrency(parseFloat(value)), 
                        name === 'Ciro' ? 'Toplam Ciro' : 'Net Kâr'
                      ]}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="Ciro" name="Toplam Ciro" fill="#FF7855" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="NetKar" name="Net Kâr" fill="#047857" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Top 10 Cities Average Order Value (AOV) */}
            <div className="lg:col-span-5 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-sm font-black text-dark">İl Bazında Ortalama Sepet Tutarı (AOV)</h4>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold">₺ / Sipariş</Badge>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top10CitiesChartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                    <XAxis type="number" stroke="#6B7280" fontSize={11} tickLine={false} tickFormatter={(v) => `₺${v}`} />
                    <YAxis dataKey="name" type="category" stroke="#6B7280" fontSize={11} tickLine={false} />
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(parseFloat(value)), 'Ortalama Sepet (AOV)']}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="AOV" name="Ortalama Sepet" fill="#4F46E5" radius={[0, 6, 6, 0]}>
                      {top10CitiesChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#4338CA' : '#6366F1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* City Breakdown Table */}
          <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-sm font-black text-dark flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>İl Bazlı Detaylı Kârlılık ve Sepet Raporu</span>
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">Her ildeki toplam sipariş, müşteri sayısı, ciro, sepet ortalaması ve bırakılan net kâr dökümü</p>
              </div>
              <Badge variant="excellent">{cityBreakdown.length} İl Listelendi</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[850px]">
                <thead>
                  <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                    <th className="py-3 px-4 table-sticky-first-col bg-canvas">İl Adı</th>
                    <th className="py-3 px-4 text-center">Toplam Sipariş</th>
                    <th className="py-3 px-4 text-center">Tekil Müşteri</th>
                    <th className="py-3 px-4 font-bold text-primary">Toplam Ciro (₺)</th>
                    <th className="py-3 px-4 font-bold text-indigo-700">Ortalama Sepet (₺)</th>
                    <th className="py-3 px-4 font-bold text-emerald-700">Bırakılan Net Kâr (₺)</th>
                    <th className="py-3 px-4 text-center">Kâr Marjı (%)</th>
                    <th className="py-3 px-4 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {cityBreakdown.map((cityItem, idx) => {
                    const rev = parseFloat(String(cityItem.totalRevenue || 0));
                    const profit = parseFloat(String(cityItem.totalProfit || 0));
                    const aov = parseFloat(String(cityItem.avgOrderValue || 0));
                    const margin = parseFloat(String(cityItem.marginPercent || 0));

                    return (
                      <tr key={idx} className="hover:bg-canvas/50 transition-colors">
                        <td className="py-3 px-4 table-sticky-first-col font-bold text-dark">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary-tint-100 text-primary flex items-center justify-center font-bold text-[11px] shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-black">{cityItem.city}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-dark tabular-nums">
                          {cityItem.orderCount} Sipariş
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600 font-semibold tabular-nums">
                          {cityItem.customerCount} Kişi
                        </td>
                        <td className="py-3 px-4 font-black text-primary tabular-nums">
                          {formatCurrency(rev)}
                        </td>
                        <td className="py-3 px-4 font-black text-indigo-700 tabular-nums">
                          {formatCurrency(aov)}
                        </td>
                        <td className="py-3 px-4 font-black text-emerald-700 tabular-nums">
                          {formatCurrency(profit)}
                        </td>
                        <td className="py-3 px-4 text-center font-bold tabular-nums">
                          <Badge variant={profit >= 0 ? "excellent" : "secondary"}>
                            %{margin.toFixed(1)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCity(cityItem.city);
                              setActiveTab("customers");
                              setCurrentPage(1);
                            }}
                            className="h-7 text-[11px] font-bold gap-1 rounded-xl text-primary hover:bg-primary hover:text-white"
                          >
                            <span>Müşterileri Filtrele</span>
                            <ChevronRight className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. CUSTOMERS LIST VIEW */}
      {activeTab === "customers" && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl sm:rounded-3xl border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Müşteri adı, şehir veya e-posta ara..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedCity}
                onChange={(e) => { setSelectedCity(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 rounded-xl border border-border text-xs font-bold text-dark bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs cursor-pointer w-full sm:w-auto"
              >
                <option value="all">Tüm Şehirler ({uniqueCities.length})</option>
                {uniqueCities.sort().map((city, idx) => (
                  <option key={idx} value={city}>{city}</option>
                ))}
              </select>

              {selectedCity !== 'all' && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setSelectedCity('all')}
                  className="h-8 text-xs font-bold text-primary"
                >
                  Filtreyi Sıfırla
                </Button>
              )}
            </div>
          </div>

          {/* Customer Table */}
          <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs text-gray-500 font-bold flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                <span>Müşteri verileri yükleniyor...</span>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400 font-bold">
                Arama kriterlerine uygun müşteri bulunamadı.
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[950px]">
                    <thead>
                      <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                        <th className="py-3 px-4 table-sticky-first-col bg-canvas">Müşteri Adı</th>
                        <th className="py-3 px-4">İletişim & Lokasyon</th>
                        <th className="py-3 px-4 text-center">Segment</th>
                        <th className="py-3 px-4 text-center">Sipariş Sayısı</th>
                        <th className="py-3 px-4 text-indigo-700 font-bold">Ortalama Sepet (₺)</th>
                        <th className="py-3 px-4 text-primary font-bold">Toplam Ciro (₺)</th>
                        <th className="py-3 px-4 text-emerald-700 font-bold">Bırakılan Kâr (₺)</th>
                        <th className="py-3 px-4 text-center">Net Marj (%)</th>
                        <th className="py-3 px-4">Son Sipariş</th>
                        <th className="py-3 px-4 text-right">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((c, idx) => {
                        const totalSpend = parseFloat(String(c.totalSpendAmount || 0));
                        const totalOrders = parseInt(String(c.totalOrdersCount || 1));
                        const aov = c.avgOrderValue ? parseFloat(String(c.avgOrderValue)) : (totalOrders > 0 ? totalSpend / totalOrders : totalSpend);
                        const netProfit = parseFloat(String(c.totalNetProfit || 0));
                        const margin = c.marginPercent ? parseFloat(String(c.marginPercent)) : (totalSpend > 0 ? (netProfit / totalSpend) * 100 : 0);

                        return (
                          <tr key={idx} className="hover:bg-canvas/50 transition-colors">
                            <td className="py-3 px-4 table-sticky-first-col font-bold text-dark">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-primary-tint-100 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                  {c.name ? c.name[0] : 'M'}
                                </div>
                                <span className="truncate max-w-[160px]">{c.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-500">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                <span>{c.city}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant={totalOrders > 1 ? "excellent" : "secondary"}>
                                {totalOrders > 1 ? "Tekrarlayan VIP" : "Yeni Müşteri"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-dark tabular-nums">
                              {totalOrders} Sipariş
                            </td>
                            <td className="py-3 px-4 font-black text-indigo-700 tabular-nums">
                              {formatCurrency(aov)}
                            </td>
                            <td className="py-3 px-4 font-black text-primary tabular-nums">
                              {formatCurrency(totalSpend)}
                            </td>
                            <td className="py-3 px-4 font-black text-emerald-700 tabular-nums">
                              {formatCurrency(netProfit)}
                            </td>
                            <td className="py-3 px-4 text-center font-bold tabular-nums">
                              <Badge variant={netProfit >= 0 ? "excellent" : "secondary"}>
                                %{margin.toFixed(1)}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-gray-400 tabular-nums font-mono text-[11px]">
                              {c.lastOrderDate}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenCustomerOrders(c)}
                                className="h-7 text-xs font-bold text-primary gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Geçmiş</span>
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="block md:hidden divide-y divide-border">
                  {filteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((c, idx) => {
                    const totalSpend = parseFloat(String(c.totalSpendAmount || 0));
                    const totalOrders = parseInt(String(c.totalOrdersCount || 1));
                    const aov = c.avgOrderValue ? parseFloat(String(c.avgOrderValue)) : (totalOrders > 0 ? totalSpend / totalOrders : totalSpend);
                    const netProfit = parseFloat(String(c.totalNetProfit || 0));

                    return (
                      <div key={idx} className="p-4 space-y-3 bg-white">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary-tint-100 text-primary flex items-center justify-center font-bold text-xs">
                              {c.name ? c.name[0] : 'M'}
                            </div>
                            <div>
                              <span className="font-bold text-dark text-xs block">{c.name}</span>
                              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {c.city}
                              </span>
                            </div>
                          </div>

                          <Badge variant={totalOrders > 1 ? "excellent" : "secondary"}>
                            {totalOrders > 1 ? "VIP" : "Yeni"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-2 bg-canvas/60 p-2.5 rounded-2xl border border-border/80 text-[11px]">
                          <div>
                            <span className="text-[10px] text-gray-400 block font-semibold">Ort. Sepet</span>
                            <span className="font-black text-indigo-700 tabular-nums">{formatCurrency(aov)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 block font-semibold">Toplam Ciro</span>
                            <span className="font-black text-primary tabular-nums">{formatCurrency(totalSpend)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 block font-semibold">Bırakılan Kâr</span>
                            <span className="font-black text-emerald-700 tabular-nums">{formatCurrency(netProfit)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-gray-400">{c.lastOrderDate}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenCustomerOrders(c)}
                            className="h-7 text-xs font-bold text-primary gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Geçmiş Siparişler</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 border-t border-border">
                  <TablePagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredCustomers.length / pageSize)}
                    pageSize={pageSize}
                    totalItems={filteredCustomers.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(newSize) => { setPageSize(newSize); setCurrentPage(1); }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Customer Orders History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between gap-3 bg-canvas/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-base shadow-xs">
                  {selectedCustomer.name ? selectedCustomer.name[0] : 'M'}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-dark flex items-center gap-2">
                    <span>{selectedCustomer.name}</span>
                    <Badge variant={selectedCustomer.totalOrdersCount > 1 ? "excellent" : "secondary"}>
                      {selectedCustomer.totalOrdersCount} Sipariş
                    </Badge>
                  </h3>
                  <p className="text-xs text-gray-500 flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-primary" /> {selectedCustomer.city} {selectedCustomer.district !== '-' ? `• ${selectedCustomer.district}` : ''}</span>
                    {selectedCustomer.phone !== '-' && (
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-primary" /> {selectedCustomer.phone}</span>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 rounded-2xl hover:bg-canvas text-gray-400 hover:text-dark transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content: Orders List */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-canvas/60 p-3 rounded-2xl border border-border text-xs">
                  <span className="text-[10px] text-gray-500 font-bold block">Toplam Sipariş</span>
                  <span className="text-sm font-black text-dark">{selectedCustomer.totalOrdersCount} Adet</span>
                </div>
                <div className="bg-canvas/60 p-3 rounded-2xl border border-border text-xs">
                  <span className="text-[10px] text-gray-500 font-bold block">Ortalama Sepet</span>
                  <span className="text-sm font-black text-indigo-700">
                    {formatCurrency(parseFloat(String(selectedCustomer.totalSpendAmount || 0)) / (selectedCustomer.totalOrdersCount || 1))}
                  </span>
                </div>
                <div className="bg-canvas/60 p-3 rounded-2xl border border-border text-xs">
                  <span className="text-[10px] text-gray-500 font-bold block">Toplam Ciro</span>
                  <span className="text-sm font-black text-primary">{formatCurrency(parseFloat(String(selectedCustomer.totalSpendAmount || 0)))}</span>
                </div>
                <div className="bg-canvas/60 p-3 rounded-2xl border border-border text-xs">
                  <span className="text-[10px] text-gray-500 font-bold block">Bırakılan Net Kâr</span>
                  <span className="text-sm font-black text-emerald-700">{formatCurrency(parseFloat(String(selectedCustomer.totalNetProfit || 0)))}</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-border overflow-hidden">
                <div className="p-3 bg-canvas border-b border-border font-bold text-xs text-dark">
                  Müşterinin Sipariş Geçmişi
                </div>

                {loadingOrders ? (
                  <div className="p-8 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                    <span>Siparişler yükleniyor...</span>
                  </div>
                ) : customerOrders.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-400">Kayıtlı sipariş bulunamadı.</div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {customerOrders.map((ord) => (
                      <div key={ord.id} className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-canvas/40 transition-colors">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-dark font-mono">{ord.orderNumber}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {ord.marketplace?.toUpperCase()}
                            </Badge>
                          </div>
                          <span className="text-[11px] text-gray-400 block">{ord.orderDate}</span>
                        </div>

                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <span className="text-[10px] text-gray-400 block">Tutar</span>
                            <span className="font-black text-primary tabular-nums">{formatCurrency(parseFloat(ord.paidAmount || 0))}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 block">Net Kâr</span>
                            <span className="font-black text-emerald-700 tabular-nums">{formatCurrency(parseFloat(ord.netProfit || 0))}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedOrderId(ord.id)}
                            className="h-7 text-xs text-primary"
                          >
                            İncele ➔
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}
