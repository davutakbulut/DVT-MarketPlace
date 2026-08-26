"use client";
import React, { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Truck, Download, Upload, Search, RefreshCw, Save, CheckCircle2, 
  Sparkles, Layers, FileSpreadsheet, ArrowUpDown 
} from "lucide-react";

export default function DesiTariffsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedCarrierFilter, setSelectedCarrierFilter] = useState("all");
  const [importModal, setImportModal] = useState(false);

  const fetchDesiRates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tariffs/carrier-desi?minDesi=0&maxDesi=500');
      const data = await res.json();
      setRows(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesiRates();
  }, []);

  const handlePriceChange = (desi: number, carrierCol: string, newVal: number) => {
    setRows((prev) =>
      prev.map((r) => (r.desi === desi ? { ...r, [carrierCol]: newVal, isEdited: true } : r))
    );
  };

  const handleSaveCell = async (desi: number, carrierName: string, price: number) => {
    try {
      const res = await fetch('/api/tariffs/carrier-desi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrierName, desi, priceExVat: price }),
      });
      if (res.ok) {
        toast.success(`${carrierName} ${desi} Desi fiyatı Supabase veritabanına kaydedildi!`);
      }
    } catch (e) {
      toast.error("Kaydedilirken hata oluştu.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/tariffs/carrier-desi/import', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Excel/CSV başarıyla içe aktarıldı!");
        setImportModal(false);
        fetchDesiRates();
      } else {
        toast.error(data.error || "İçe aktarılamadı.");
      }
    } catch (err) {
      toast.error("Dosya yüklenirken hata oluştu.");
    } finally {
      setUploading(false);
    }
  };

  const filteredRows = rows.filter((r) => {
    if (!searchTerm) return true;
    return r.desi.toString() === searchTerm.trim() || r.desi.toString().startsWith(searchTerm.trim());
  });

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-dark">10 Ağustos 2026 Kargo Desi Fiyat Tarifeleri (0 - 500 Desi)</h3>
            <Badge variant="excellent">Supabase PostgreSQL</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            10 kargo ve lojistik firmasının 501 adet desi fiyat matrisi. Tüm hesaplamalar doğrudan bu tablodan çekilir.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a href="/api/tariffs/carrier-desi/export" download>
            <Button size="sm" variant="outline" className="text-xs h-8 sm:h-9 gap-1.5 font-bold">
              <Download className="w-3.5 h-3.5" />
              <span>Excel/CSV İndir</span>
            </Button>
          </a>

          <Button
            size="sm"
            onClick={() => setImportModal(true)}
            className="text-xs h-8 sm:h-9 gap-1.5 font-bold shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Excel ile Güncelle</span>
          </Button>

          <Button size="sm" variant="ghost" onClick={fetchDesiRates} className="h-8 sm:h-9 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Info & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Desi Ara (Örn: 5, 50, 100)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border text-xs font-bold text-dark focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          </div>
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="text-xs font-bold text-primary hover:underline">
              Temizle
            </button>
          )}
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Toplam <strong>501 Desi Kademesi</strong> • <strong>4.200+ Fiyat Noktası</strong> (KDV Hariç)
        </div>
      </div>

      {/* 501 Desi Table with Horizontal Swipe & Sticky First Column */}
      <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[680px]">
          <table className="w-full text-left text-xs border-collapse min-w-[980px]">
            <thead className="sticky top-0 z-30 bg-canvas/95 backdrop-blur-md border-b border-border shadow-xs">
              <tr className="text-muted-foreground font-semibold text-[11px]">
                <th className="py-3 px-3 table-sticky-first-col bg-canvas">Desi/KG</th>
                <th className="py-3 px-3">TEX</th>
                <th className="py-3 px-3">PTT</th>
                <th className="py-3 px-3">Aras</th>
                <th className="py-3 px-3">Sürat</th>
                <th className="py-3 px-3">Kolay Gelsin</th>
                <th className="py-3 px-3">DHL eCom</th>
                <th className="py-3 px-3">Yurtiçi</th>
                <th className="py-3 px-3">CEVA Ted.</th>
                <th className="py-3 px-3">CEVA</th>
                <th className="py-3 px-3">Horoz</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredRows.map((r) => (
                <tr key={r.desi} className="hover:bg-canvas/60 transition-colors group">
                  <td className="py-2 px-3 table-sticky-first-col font-black text-dark text-xs">
                    {r.desi} Desi
                  </td>
                  
                  {/* TEX */}
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      step="0.01"
                      value={r.tex || ""}
                      onChange={(e) => handlePriceChange(r.desi, 'tex', parseFloat(e.target.value) || 0)}
                      onBlur={() => handleSaveCell(r.desi, 'TEX', r.tex)}
                      className="w-16 px-1.5 py-0.5 rounded border border-border/80 text-xs font-semibold tabular-nums focus:bg-primary-tint-50 focus:border-primary"
                    />
                  </td>

                  {/* PTT */}
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      step="0.01"
                      value={r.ptt || ""}
                      onChange={(e) => handlePriceChange(r.desi, 'ptt', parseFloat(e.target.value) || 0)}
                      onBlur={() => handleSaveCell(r.desi, 'PTT', r.ptt)}
                      className="w-16 px-1.5 py-0.5 rounded border border-border/80 text-xs font-semibold tabular-nums focus:bg-primary-tint-50 focus:border-primary"
                    />
                  </td>

                  {/* Aras */}
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      step="0.01"
                      value={r.aras || ""}
                      onChange={(e) => handlePriceChange(r.desi, 'aras', parseFloat(e.target.value) || 0)}
                      onBlur={() => handleSaveCell(r.desi, 'Aras', r.aras)}
                      className="w-16 px-1.5 py-0.5 rounded border border-border/80 text-xs font-semibold tabular-nums focus:bg-primary-tint-50 focus:border-primary"
                    />
                  </td>

                  {/* Sürat */}
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      step="0.01"
                      value={r.surat || ""}
                      onChange={(e) => handlePriceChange(r.desi, 'surat', parseFloat(e.target.value) || 0)}
                      onBlur={() => handleSaveCell(r.desi, 'Sürat', r.surat)}
                      className="w-16 px-1.5 py-0.5 rounded border border-border/80 text-xs font-semibold tabular-nums focus:bg-primary-tint-50 focus:border-primary"
                    />
                  </td>

                  {/* Kolay Gelsin */}
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      step="0.01"
                      value={r.kolayGelsin || ""}
                      onChange={(e) => handlePriceChange(r.desi, 'kolayGelsin', parseFloat(e.target.value) || 0)}
                      onBlur={() => handleSaveCell(r.desi, 'Kolay Gelsin', r.kolayGelsin)}
                      className="w-16 px-1.5 py-0.5 rounded border border-border/80 text-xs font-semibold tabular-nums focus:bg-primary-tint-50 focus:border-primary"
                    />
                  </td>

                  {/* DHL eCommerce */}
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      step="0.01"
                      value={r.dhl || ""}
                      onChange={(e) => handlePriceChange(r.desi, 'dhl', parseFloat(e.target.value) || 0)}
                      onBlur={() => handleSaveCell(r.desi, 'DHL eCommerce', r.dhl)}
                      className="w-16 px-1.5 py-0.5 rounded border border-border/80 text-xs font-semibold tabular-nums focus:bg-primary-tint-50 focus:border-primary"
                    />
                  </td>

                  {/* Yurtiçi */}
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      step="0.01"
                      value={r.yurtici || ""}
                      onChange={(e) => handlePriceChange(r.desi, 'yurtici', parseFloat(e.target.value) || 0)}
                      onBlur={() => handleSaveCell(r.desi, 'Yurtiçi', r.yurtici)}
                      className="w-16 px-1.5 py-0.5 rounded border border-border/80 text-xs font-semibold tabular-nums focus:bg-primary-tint-50 focus:border-primary"
                    />
                  </td>

                  {/* CEVA Tedarik */}
                  <td className="py-2 px-3 font-mono text-[11px] text-gray-700">
                    {r.cevaTedarik ? `₺${r.cevaTedarik}` : '-'}
                  </td>

                  {/* CEVA */}
                  <td className="py-2 px-3 font-mono text-[11px] text-gray-700">
                    {r.ceva ? `₺${r.ceva}` : '-'}
                  </td>

                  {/* Horoz */}
                  <td className="py-2 px-3 font-mono text-[11px] text-gray-700">
                    {r.horoz ? `₺${r.horoz}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Excel Upload Modal */}
      {importModal && (
        <div className="fixed inset-0 z-50 bg-dark/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-border shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h4 className="text-sm font-bold text-dark flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                Excel/CSV ile Desi Fiyatlarını Güncelle
              </h4>
              <button onClick={() => setImportModal(false)} className="text-gray-400 hover:text-dark">✕</button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Önce <strong>"Excel/CSV İndir"</strong> butonundan güncel şablonu indirin, dilediğiniz fiyatları değiştirin ve ardından güncellenmiş dosyanızı buraya yükleyin.
            </p>

            <div className="border-2 border-dashed border-border hover:border-primary p-6 rounded-2xl text-center cursor-pointer transition-colors bg-canvas/50">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                disabled={uploading}
                className="w-full text-xs cursor-pointer"
              />
              <div className="text-[11px] text-gray-500 mt-2">
                {uploading ? 'Veritabanına aktarılıyor...' : 'CSV veya Excel dosyanızı seçin'}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setImportModal(false)} className="text-xs">
                Vazgeç
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
