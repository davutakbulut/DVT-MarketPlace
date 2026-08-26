"use client";
import React, { useState, useEffect } from "react";
import { formatCurrency, formatPercentage } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  X, Truck, User, MapPin, Phone, Mail, Building2, 
  Receipt, ShieldCheck, CheckCircle2, AlertTriangle, Calendar, 
  Clock, Package, ArrowDown, TrendingUp, DollarSign, RefreshCw, Edit3, Check
} from "lucide-react";

interface OrderDetailModalProps {
  orderId: string | null;
  onClose: () => void;
  onUpdated?: () => void;
}

export function OrderDetailModal({ orderId, onClose, onUpdated }: OrderDetailModalProps) {
  const [data, setData] = useState<{ order: any; items: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [tempCost, setTempCost] = useState<number>(0);
  const [savingCost, setSavingCost] = useState(false);

  const fetchOrderDetail = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        toast.error(json.error || "Sipariş detayları alınamadı.");
      }
    } catch (e) {
      toast.error("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  if (!orderId) return null;

  const handleSaveCost = async (itemId: string) => {
    setSavingCost(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, newCost: tempCost }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(json.message || "Maliyet güncellendi!");
        setEditingItemId(null);
        fetchOrderDetail();
        if (onUpdated) onUpdated();
      } else {
        toast.error(json.error || "Güncellenemedi.");
      }
    } catch (e) {
      toast.error("Hata oluştu.");
    } finally {
      setSavingCost(false);
    }
  };

  const o = data?.order;
  const items = data?.items || [];

  return (
    <div className="fixed inset-0 z-50 bg-dark/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-border shadow-2xl space-y-4 animate-in zoom-in-95 my-auto max-h-[92vh] overflow-y-auto p-4 sm:p-6">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-border gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-black text-dark">
                Sipariş #{o?.orderNumber || 'Yükleniyor...'}
              </span>
              <Badge variant="excellent">Paket: {o?.packageNumber || '-'}</Badge>
              <Badge variant={parseFloat(o?.netProfit || 0) > 0 ? "excellent" : "secondary"}>
                {o?.status || 'Teslim Edildi'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sipariş Tarihi: <strong className="text-dark">{o?.orderDate || '-'}</strong> • Mağaza: <strong className="text-primary">{o?.storeName || 'Trendyol'}</strong>
            </p>
          </div>

          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-canvas hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-dark transition-all shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span>Siparişin 50 parametresi ve finansal şelalesi yükleniyor...</span>
          </div>
        ) : o ? (
          <div className="space-y-4">
            
            {/* Top Financial Hero Card: Revenue -> Deductions -> Net Profit */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-primary-tint-50/30 p-4 rounded-2xl border border-primary-tint-100">
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Faturalanan Tutar</span>
                <span className="text-base sm:text-lg font-black text-dark tabular-nums">
                  {formatCurrency(parseFloat(o.paidAmount || 0))}
                </span>
                {parseFloat(o.platformDiscount || 0) > 0 && (
                  <span className="text-[10px] text-emerald-700 font-semibold block">
                    +₺{parseFloat(o.platformDiscount).toFixed(2)} TY Katkısı
                  </span>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Komisyon & Hizmet</span>
                <span className="text-base sm:text-lg font-bold text-primary tabular-nums">
                  ₺{(parseFloat(o.commission || 0) + parseFloat(o.serviceFee || 0)).toFixed(2)}
                </span>
                <span className="text-[10px] text-gray-500 block font-mono">
                  (₺{parseFloat(o.commission || 0).toFixed(2)} + ₺{parseFloat(o.serviceFee || 0).toFixed(2)})
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block">Kargo Bedeli ({o.billedDesi} Desi)</span>
                <span className="text-base sm:text-lg font-bold text-primary tabular-nums">
                  ₺{parseFloat(o.shippingCost || 0).toFixed(2)}
                </span>
                <span className="text-[10px] text-gray-500 block truncate">
                  {o.carrierName}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-border shadow-xs">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide block">Net Nakit Kâr</span>
                <span className={`text-base sm:text-lg font-black tabular-nums ${parseFloat(o.netProfit) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {formatCurrency(parseFloat(o.netProfit || 0))}
                </span>
                <span className="text-[10px] font-black text-emerald-800 block">
                  Net Marj: %{parseFloat(o.marginPercent || 0).toFixed(1)}
                </span>
              </div>
            </div>

            {/* Financial Waterfall Breakdown */}
            <div className="bg-canvas p-4 rounded-2xl border border-border space-y-2 text-xs">
              <span className="font-black text-dark text-xs block mb-1">Finansal Kesinti & Maliyet Şelalesi (Waterfall)</span>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="bg-white p-2 rounded-xl border border-border">
                  <span className="text-gray-500 block">Satış Tutarı</span>
                  <strong className="text-dark">₺{parseFloat(o.grossAmount || 0).toFixed(2)}</strong>
                </div>

                <div className="bg-white p-2 rounded-xl border border-border">
                  <span className="text-gray-500 block">Ürün Alış Maliyeti (COGS)</span>
                  <strong className="text-red-700">₺{parseFloat(o.cogs || 0).toFixed(2)}</strong>
                </div>

                <div className="bg-white p-2 rounded-xl border border-border">
                  <span className="text-gray-500 block">%1 Stopaj Kesintisi</span>
                  <strong className="text-gray-700">₺{parseFloat(o.withholdingTax || 0).toFixed(2)}</strong>
                </div>

                <div className="bg-white p-2 rounded-xl border border-border">
                  <span className="text-gray-500 block">Ödenecek Net KDV</span>
                  <strong className="text-gray-700">₺{parseFloat(o.netVat || 0).toFixed(2)}</strong>
                </div>
              </div>
            </div>

            {/* Customer & Shipping Details (Trendyol 50 Fields) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              
              {/* Customer Box */}
              <div className="p-3.5 rounded-2xl border border-border bg-white space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-dark border-b border-border pb-1.5">
                  <User className="w-3.5 h-3.5 text-primary" />
                  <span>Müşteri & Fatura Bilgileri</span>
                </div>
                
                <div className="space-y-1 text-gray-700 text-[11px]">
                  <div><strong>Alıcı:</strong> {o.customerName} {o.customerOrderCountLabel ? `(${o.customerOrderCountLabel})` : ''}</div>
                  <div><strong>Lokasyon:</strong> {o.city} / {o.district} - {o.country}</div>
                  {o.phone && <div><strong>Telefon:</strong> {o.phone}</div>}
                  {o.email && <div><strong>E-Posta:</strong> {o.email}</div>}
                  {o.deliveryAddress && <div><strong>Teslimat Adresi:</strong> {o.deliveryAddress}</div>}
                  
                  {o.isCorporate && (
                    <div className="mt-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-semibold">
                      <div>🏢 <strong>Kurumsal Şirket:</strong> {o.companyName}</div>
                      <div>VKN: {o.taxId} • Vergi Dairesi: {o.taxOffice}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping & Delivery Box */}
              <div className="p-3.5 rounded-2xl border border-border bg-white space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-dark border-b border-border pb-1.5">
                  <Truck className="w-3.5 h-3.5 text-primary" />
                  <span>Kargo & Desi Denetimi</span>
                </div>

                <div className="space-y-1 text-gray-700 text-[11px]">
                  <div><strong>Kargo Firması:</strong> {o.carrierName}</div>
                  <div><strong>Kargo Takip No:</strong> {o.trackingCode || '-'}</div>
                  <div><strong>Kargodan Alınan Desi:</strong> <strong className="text-primary">{o.billedDesi} Desi</strong></div>
                  <div><strong>Hesaplanan Desi:</strong> {o.calculatedDesi || o.billedDesi} Desi</div>
                  <div><strong>Termin Bitiş:</strong> {o.leadTimeDeadline || '-'}</div>
                  <div><strong>Kargoya Teslim:</strong> {o.dispatchedDate || '-'}</div>
                  <div><strong>Müşteriye Teslim:</strong> {o.deliveredDate || '-'}</div>
                </div>
              </div>

            </div>

            {/* Order Items Table with Instant Cost Editor */}
            <div className="border border-border rounded-2xl overflow-hidden bg-white">
              <div className="bg-canvas p-2.5 border-b border-border flex items-center justify-between">
                <span className="font-bold text-xs text-dark flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-primary" />
                  Siparişteki Ürün Kalemleri ({items.length} Kalem)
                </span>
                <span className="text-[10px] text-gray-500">Maliyetleri buradan anında düzenleyebilirsiniz</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-semibold text-[11px]">
                      <th className="py-2 px-3">Ürün & Barkod</th>
                      <th className="py-2 px-3">Marka & SKU</th>
                      <th className="py-2 px-3 text-center">Adet</th>
                      <th className="py-2 px-3 text-primary font-bold">Birim Fiyat</th>
                      <th className="py-2 px-3">Birim Maliyet (₺)</th>
                      <th className="py-2 px-3">Komisyon</th>
                      <th className="py-2 px-3 text-emerald-700 font-bold">Net Kâr</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {items.map((it) => (
                      <tr key={it.id} className="hover:bg-canvas/50">
                        <td className="py-2.5 px-3 font-semibold text-dark">
                          <span className="block truncate max-w-[200px]">{it.title}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{it.barcode}</span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-600">
                          <div>{it.brand || 'Genel'}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{it.sku}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">{it.quantity}</td>
                        <td className="py-2.5 px-3 font-bold text-primary tabular-nums">₺{parseFloat(it.unitSalePrice || 0).toFixed(2)}</td>
                        
                        {/* Inline Cost Editor */}
                        <td className="py-2.5 px-3">
                          {editingItemId === it.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="0.5"
                                value={tempCost}
                                onChange={(e) => setTempCost(parseFloat(e.target.value) || 0)}
                                className="w-16 px-1.5 py-0.5 rounded border border-primary font-bold text-xs focus:ring-1"
                              />
                              <button
                                onClick={() => handleSaveCost(it.id)}
                                disabled={savingCost}
                                className="p-1 rounded bg-primary text-white hover:bg-primary-hover"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-dark tabular-nums">₺{parseFloat(it.unitCostPrice || 0).toFixed(2)}</span>
                              <button
                                onClick={() => {
                                  setEditingItemId(it.id);
                                  setTempCost(parseFloat(it.unitCostPrice || 0));
                                }}
                                className="text-gray-400 hover:text-primary p-0.5"
                                title="Maliyeti Düzenle"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-gray-600 tabular-nums">
                          %{parseFloat(it.commissionRate || 0)} (₺{parseFloat(it.commissionAmount || 0).toFixed(2)})
                        </td>

                        <td className="py-2.5 px-3 font-bold text-emerald-700 tabular-nums">
                          ₺{parseFloat(it.netProfit || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={onClose} className="text-xs font-bold px-4">
                Kapat
              </Button>
            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
}
