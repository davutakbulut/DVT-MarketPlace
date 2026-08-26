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
  Award, PackageCheck, Truck, ChevronRight, X
} from "lucide-react";
import { OrderDetailModal } from "@/components/orders/OrderDetailModal";

interface Customer {
  name: string;
  city: string;
  district: string;
  email: string;
  phone: string;
  totalOrdersCount: number;
  totalSpendAmount: number;
  totalNetProfit: number;
  averageOrderValue: number;
  firstOrderDate: string;
  lastOrderDate: string;
  customerTier: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [selectedCity, setSelectedCity] = useState("all");

  // Drawer / Modal for Customer Orders
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data.customers || []);
      setSummary(data.summary || {});
    } catch (e) {
      toast.error("Müşteri listesi yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenCustomerOrders = async (cust: Customer) => {
    setSelectedCustomer(cust);
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/customers?name=${encodeURIComponent(cust.name)}`);
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

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-dark">Müşteri Listesi & Sipariş Geçmişi</h3>
            <Badge variant="excellent">2.366 Canlı Sipariş Veritabanı</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Siparişlerinizdeki müşterilerin toplam harcamaları, bıraktıkları net kâr ve geçmiş sipariş dökümleri
          </p>
        </div>

        <Button size="sm" variant="outline" onClick={fetchCustomers} className="h-8 sm:h-9 text-xs gap-1.5 self-start sm:self-auto font-bold">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Yenile</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">Toplam Tekil Müşteri</span>
          <div className="text-2xl font-black text-dark tabular-nums mt-1">{summary.totalCustomers || 0} Kişi</div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">4 Aylık Trendyol Verisi</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">Toplam Müşteri Cirosu</span>
          <div className="text-2xl font-black text-primary tabular-nums mt-1">{formatCurrency(summary.totalRevenue || 0)}</div>
          <span className="text-[11px] text-gray-500 font-semibold mt-1 block">Faturalanan Tutar</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">Bırakılan Net Kâr</span>
          <div className="text-2xl font-black text-emerald-700 tabular-nums mt-1">{formatCurrency(summary.totalProfit || 0)}</div>
          <span className="text-[11px] text-emerald-700 font-bold mt-1 block">Tüm Kesintiler Sonrası</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-border shadow-xs">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">Tekrarlayan Sadık Müşteri</span>
          <div className="text-2xl font-black text-dark tabular-nums mt-1">{summary.vipCustomersCount || 0} Müşteri</div>
          <span className="text-[11px] text-primary font-bold mt-1 block">2+ Sipariş Verenler</span>
        </div>
      </div>

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
            className="px-3 py-2 rounded-xl border border-border text-xs font-bold text-dark bg-white focus:ring-2 focus:ring-primary"
          >
            <option value="all">Tüm Şehirler</option>
            {uniqueCities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[860px]">
            <thead>
              <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                <th className="py-3 px-4 table-sticky-first-col bg-canvas">Müşteri Adı</th>
                <th className="py-3 px-4">İletişim & Lokasyon</th>
                <th className="py-3 px-4">Segment</th>
                <th className="py-3 px-4 text-center">Sipariş Sayısı</th>
                <th className="py-3 px-4 text-primary font-bold">Toplam Ciro (₺)</th>
                <th className="py-3 px-4 text-emerald-700 font-bold">Bıraktığı Kâr (₺)</th>
                <th className="py-3 px-4">Son Sipariş</th>
                <th className="py-3 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((c, idx) => (
                <tr key={idx} className="hover:bg-canvas/50 transition-colors">
                  <td className="py-3 px-4 table-sticky-first-col font-bold text-dark">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-tint-100 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {c.name ? c.name[0] : 'M'}
                      </div>
                      <span className="truncate max-w-[160px]">{c.name}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-gray-600">
                    <div className="flex items-center gap-1 font-semibold text-dark">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span>{c.city} {c.district !== '-' ? `(${c.district})` : ''}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">{c.email}</div>
                  </td>

                  <td className="py-3 px-4">
                    <Badge variant={c.customerTier.includes('VIP') ? 'excellent' : c.customerTier.includes('Tekrarlayan') ? 'default' : 'secondary'}>
                      {c.customerTier}
                    </Badge>
                  </td>

                  <td className="py-3 px-4 text-center font-bold tabular-nums">
                    <span className="px-2 py-0.5 rounded-full bg-canvas border border-border">
                      {c.totalOrdersCount} Sipariş
                    </span>
                  </td>

                  <td className="py-3 px-4 font-black text-primary tabular-nums">
                    {formatCurrency(c.totalSpendAmount)}
                  </td>

                  <td className="py-3 px-4 font-black text-emerald-700 tabular-nums">
                    {formatCurrency(c.totalNetProfit)}
                  </td>

                  <td className="py-3 px-4 text-gray-500 tabular-nums text-[11px]">
                    {c.lastOrderDate}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenCustomerOrders(c)}
                      className="h-7 text-[11px] font-bold gap-1 px-2.5 bg-white hover:bg-primary hover:text-white transition-all"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Siparişleri İncele</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination currentPage={currentPage} totalPages={Math.ceil(filteredCustomers.length / pageSize) || 1} pageSize={pageSize} totalItems={filteredCustomers.length} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
      </div>

      {/* Customer Orders Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-dark/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full border border-border shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-primary-tint-100 flex items-center justify-center text-primary font-bold text-sm">
                  {selectedCustomer.name ? selectedCustomer.name[0] : 'M'}
                </div>
                <div>
                  <h4 className="text-sm font-black text-dark">{selectedCustomer.name} - Sipariş Geçmişi</h4>
                  <p className="text-[11px] text-gray-500">
                    {selectedCustomer.city} • Toplam {customerOrders.length} Sipariş
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-dark font-bold">✕</button>
            </div>

            {/* Customer Lifetime Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-canvas p-3 rounded-2xl border border-border">
                <span className="text-[10px] text-gray-400 block font-semibold uppercase">Toplam Harcama</span>
                <span className="font-black text-primary text-base tabular-nums">{formatCurrency(selectedCustomer.totalSpendAmount)}</span>
              </div>

              <div className="bg-canvas p-3 rounded-2xl border border-border">
                <span className="text-[10px] text-gray-400 block font-semibold uppercase">Bırakılan Net Kâr</span>
                <span className="font-black text-emerald-700 text-base tabular-nums">{formatCurrency(selectedCustomer.totalNetProfit)}</span>
              </div>

              <div className="bg-canvas p-3 rounded-2xl border border-border">
                <span className="text-[10px] text-gray-400 block font-semibold uppercase">Ortalama Sepet</span>
                <span className="font-black text-dark text-base tabular-nums">{formatCurrency(selectedCustomer.averageOrderValue)}</span>
              </div>
            </div>

            {/* Orders Table */}
            <div className="border border-border rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-canvas border-b border-border text-muted-foreground font-semibold text-[11px]">
                    <th className="py-2.5 px-3">Sipariş No</th>
                    <th className="py-2.5 px-3">Tarih</th>
                    <th className="py-2.5 px-3">Tutar</th>
                    <th className="py-2.5 px-3">Komisyon</th>
                    <th className="py-2.5 px-3">Kargo</th>
                    <th className="py-2.5 px-3 text-emerald-700 font-bold">Net Kâr</th>
                    <th className="py-2.5 px-3 text-right">Detay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {customerOrders.map((o) => (
                    <tr key={o.id} onClick={() => setSelectedOrderId(o.id)} className="hover:bg-primary-tint-50/30 cursor-pointer">
                      <td className="py-2.5 px-3 font-bold text-dark font-mono">{o.orderNumber}</td>
                      <td className="py-2.5 px-3 text-gray-500 tabular-nums">{o.orderDate}</td>
                      <td className="py-2.5 px-3 font-bold text-primary tabular-nums">₺{parseFloat(o.paidAmount || 0).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-gray-600 tabular-nums">₺{parseFloat(o.commission || 0).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-gray-600 tabular-nums">₺{parseFloat(o.shippingCost || 0).toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-700 tabular-nums">₺{parseFloat(o.netProfit || 0).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right">
                        <Button size="sm" variant="ghost" className="h-6 text-[10px] font-bold text-primary">
                          <Eye className="w-3 h-3 mr-1" />
                          İncele
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setSelectedCustomer(null)} className="text-xs font-bold px-4">
                Kapat
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onUpdated={fetchCustomers}
      />
    </div>
  );
}
