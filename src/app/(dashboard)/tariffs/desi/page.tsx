"use client";
import React, { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Truck, Download, Upload, Search, RefreshCw, Save, CheckCircle2, 
  Sparkles, Layers, FileSpreadsheet, ArrowUpDown, Filter, Check 
} from "lucide-react";

export default function DesiTariffsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSegment, setActiveSegment] = useState("all");
  const [selectedCarrier, setSelectedCarrier] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [dirtyRows, setDirtyRows] = useState<Set<number>>(new Set());

  const fetchDesiRates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tariffs/carrier-desi?minDesi=0&maxDesi=500');
      const data = await res.json();
      setRows(data || []);
      setDirtyRows(new Set());
    } catch (e) {
      console.error(e);
      toast.error("Desi tarifeleri veritabanından çekilemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesiRates();
  }, []);

  const handlePriceChange = (desi: number, carrierCol: string, newVal: number) => {
    setRows((prev) =>
      prev.map((r) => (r.desi === desi ? { ...r, [carrierCol]: newVal } : r))
    );
    setDirtyRows((prev) => new Set(prev).add(desi));
  };

  const handleSaveRow = async (desi: number) => {
    const row = rows.find((r) => r.desi === desi);
    if (!row) return;

    try {
      const carriersMap: Record<string, string> = {
        tex: 'TEX',
        ptt: 'PTT',
        aras: 'Aras',
        surat: 'Sürat',
        kolayGelsin: 'Kolay Gelsin',
        dhl: 'DHL eCommerce',
        yurtici: 'Yurtiçi',
      };

      for (const [col, carrierName] of Object.entries(carriersMap)) {
        if (row[col] !== undefined && row[col] !== null) {
          await fetch('/api/tariffs/carrier-desi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ carrierName, desi, priceExVat: row[col] }),
          });
        }
      }

      setDirtyRows((prev) => {
        const next = new Set(prev);
        next.delete(desi);
        return next;
      });
      toast.success(`${desi} Desi için tüm kargo fiyatları veritabanına kaydedildi!`);
    } catch (e) {
      toast.error("Kaydedilirken hata oluştu.");
    }
  };

  const handleSaveAllDirty = async () => {
    if (dirtyRows.size === 0) {
      toast.info("Kaydedilecek değişiklik bulunamadı.");
      return;
    }
    try {
      for (const desi of Array.from(dirtyRows)) {
        await handleSaveRow(desi);
      }
      toast.success(`Toplam ${dirtyRows.size} adet desi satırı veritabanına başarıyla kaydedildi!`);
    } catch (e) {
      toast.error("Toplu kayıt sırasında hata oluştu.");
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

  const segments = [
    { id: "all", label: "Tümü (0 - 500 Desi)", min: 0, max: 500 },
    { id: "0_10", label: "0 - 10 Desi (En Sık)", min: 0, max: 10 },
    { id: "11_30", label: "11 - 30 Desi", min: 11, max: 30 },
    { id: "31_50", label: "31 - 50 Desi", min: 31, max: 50 },
    { id: "51_100", label: "51 - 100 Desi", min: 51, max: 100 },
    { id: "101_500", label: "101 - 500 Desi (Ağır)", min: 101, max: 500 },
  ];

  const filteredRows = rows.filter((r) => {
    // Segment filter
    const activeSeg = segments.find((s) => s.id === activeSegment);
    if (activeSeg && (r.desi < activeSeg.min || r.desi > activeSeg.max)) {
      return false;
    }
    // Search filter
    if (searchTerm) {
      const searchNum = searchTerm.trim();
      return r.desi.toString() === searchNum || r.desi.toString().startsWith(searchNum);
    }
    return true;
  });

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-dark">Kargo Desi Fiyat Matrisi (0 - 500 Desi)</h3>
            <Badge variant="excellent">Supabase Canlı DB</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            10 kargo partnerinin 501 adet desi kademesini görüntüleyin, tek tek veya topluca düzenleyip veritabanına kaydedin.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {dirtyRows.size > 0 && (
            <Button size="sm" onClick={handleSaveAllDirty} className="text-xs h-8 sm:h-9 gap-1.5 font-bold shadow-xs bg-emerald-600 hover:bg-emerald-700">
              <Save className="w-3.5 h-3.5" />
              <span>Değişiklikleri Kaydet ({dirtyRows.size})</span>
            </Button>
          )}

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
            <span>Excel ile Yükle</span>
          </Button>

          <Button size="sm" variant="ghost" onClick={fetchDesiRates} className="h-8 sm:h-9 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Quick Segment Filter Buttons & Search */}
      <div className="bg-white p-4 rounded-3xl border border-border shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {segments.map((seg) => (
              <button
                key={seg.id}
                onClick={() => setActiveSegment(seg.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeSegment === seg.id
                    ? "bg-primary text-white shadow-xs"
                    : "bg-canvas text-gray-700 hover:bg-gray-200"
                }`}
              >
                {seg.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-60">
            <input
              type="text"
              placeholder="Desi Ara (Örn: 5, 25, 100)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border text-xs font-bold text-dark focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="text-[11px] text-gray-500 flex items-center justify-between pt-2 border-t border-border">
          <span>Gösterilen: <strong>{filteredRows.length} Desi Kademesi</strong> (KDV Hariç ₺ Fiyatlar)</span>
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Hücrelerdeki fiyatı klavyeden değiştirip "Kaydet"e basabilirsiniz.
          </span>
        </div>
      </div>

      {/* 501 Desi Table with Sticky Header & First Column */}
      <div className="bg-white rounded-3xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[640px]">
          <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
            <thead className="sticky top-0 z-30 bg-canvas/95 backdrop-blur-md border-b border-border shadow-xs">
              <tr className="text-muted-foreground font-bold text-[11px]">
                <th className="py-3 px-3 table-sticky-first-col bg-canvas">Desi / KG</th>
                <th className="py-3 px-3 text-emerald-800">TEX</th>
                <th className="py-3 px-3 text-emerald-800">PTT</th>
                <th className="py-3 px-3 text-emerald-800">Aras</th>
                <th className="py-3 px-3 text-emerald-800">Sürat</th>
                <th className="py-3 px-3 text-emerald-800">Kolay Gelsin</th>
                <th className="py-3 px-3 text-emerald-800">DHL eCom</th>
                <th className="py-3 px-3 text-emerald-800">Yurtiçi</th>
                <th className="py-3 px-3">CEVA Ted.</th>
                <th className="py-3 px-3">CEVA</th>
                <th className="py-3 px-3">Horoz</th>
                <th className="py-3 px-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredRows.map((r) => {
                const isDirty = dirtyRows.has(r.desi);
                return (
                  <tr key={r.desi} className={`hover:bg-canvas/50 transition-colors ${isDirty ? 'bg-amber-50/60' : ''}`}>
                    <td className="py-2.5 px-3 table-sticky-first-col font-black text-dark text-xs">
                      {r.desi} Desi
                    </td>
                    
                    {/* TEX */}
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={r.tex ?? ""}
                        onChange={(e) => handlePriceChange(r.desi, 'tex', parseFloat(e.target.value) || 0)}
                        className="w-18 px-1.5 py-1 rounded border border-border text-xs font-bold tabular-nums focus:bg-primary-tint-50 focus:border-primary focus:outline-none"
                      />
                    </td>

                    {/* PTT */}
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={r.ptt ?? ""}
                        onChange={(e) => handlePriceChange(r.desi, 'ptt', parseFloat(e.target.value) || 0)}
                        className="w-18 px-1.5 py-1 rounded border border-border text-xs font-bold tabular-nums focus:bg-primary-tint-50 focus:border-primary focus:outline-none"
                      />
                    </td>

                    {/* Aras */}
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={r.aras ?? ""}
                        onChange={(e) => handlePriceChange(r.desi, 'aras', parseFloat(e.target.value) || 0)}
                        className="w-18 px-1.5 py-1 rounded border border-border text-xs font-bold tabular-nums focus:bg-primary-tint-50 focus:border-primary focus:outline-none"
                      />
                    </td>

                    {/* Sürat */}
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={r.surat ?? ""}
                        onChange={(e) => handlePriceChange(r.desi, 'surat', parseFloat(e.target.value) || 0)}
                        className="w-18 px-1.5 py-1 rounded border border-border text-xs font-bold tabular-nums focus:bg-primary-tint-50 focus:border-primary focus:outline-none"
                      />
                    </td>

                    {/* Kolay Gelsin */}
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={r.kolayGelsin ?? ""}
                        onChange={(e) => handlePriceChange(r.desi, 'kolayGelsin', parseFloat(e.target.value) || 0)}
                        className="w-18 px-1.5 py-1 rounded border border-border text-xs font-bold tabular-nums focus:bg-primary-tint-50 focus:border-primary focus:outline-none"
                      />
                    </td>

                    {/* DHL eCommerce */}
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={r.dhl ?? ""}
                        onChange={(e) => handlePriceChange(r.desi, 'dhl', parseFloat(e.target.value) || 0)}
                        className="w-18 px-1.5 py-1 rounded border border-border text-xs font-bold tabular-nums focus:bg-primary-tint-50 focus:border-primary focus:outline-none"
                      />
                    </td>

                    {/* Yurtiçi */}
                    <td className="py-2.5 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={r.yurtici ?? ""}
                        onChange={(e) => handlePriceChange(r.desi, 'yurtici', parseFloat(e.target.value) || 0)}
                        className="w-18 px-1.5 py-1 rounded border border-border text-xs font-bold tabular-nums focus:bg-primary-tint-50 focus:border-primary focus:outline-none"
                      />
                    </td>

                    {/* CEVA Tedarik */}
                    <td className="py-2.5 px-3 font-mono text-[11px] text-gray-700 font-bold">
                      {r.cevaTedarik ? `₺${r.cevaTedarik}` : '-'}
                    </td>

                    {/* CEVA */}
                    <td className="py-2.5 px-3 font-mono text-[11px] text-gray-700 font-bold">
                      {r.ceva ? `₺${r.ceva}` : '-'}
                    </td>

                    {/* Horoz */}
                    <td className="py-2.5 px-3 font-mono text-[11px] text-gray-700 font-bold">
                      {r.horoz ? `₺${r.horoz}` : '-'}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <Button
                        size="sm"
                        variant={isDirty ? "default" : "outline"}
                        className="h-7 text-[11px] gap-1 px-2 font-bold"
                        onClick={() => handleSaveRow(r.desi)}
                      >
                        <Save className="w-3 h-3" />
                        <span>Kaydet</span>
                      </Button>
                    </td>
                  </tr>
                );
              })}
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
                Excel / CSV ile Desi Fiyatlarını Toplu Güncelle
              </h4>
              <button onClick={() => setImportModal(false)} className="text-gray-400 hover:text-dark">✕</button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Önce <strong>"Excel/CSV İndir"</strong> butonundan mevcut 501 desi fiyat listesini indirin. Bilgisayarınızda dilediğiniz fiyatları değiştirip dosyanızı buraya yükleyin. Tüm fiyatlar veritabanında güncellenecektir.
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
