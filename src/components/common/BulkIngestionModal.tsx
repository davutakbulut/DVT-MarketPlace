"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

interface BulkIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  importType: 'products' | 'invoices' | 'tariffs';
  title: string;
  onSuccess?: () => void;
}

export function BulkIngestionModal({ isOpen, onClose, importType, title, onSuccess }: BulkIngestionModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!file) {
      toast.error("Lütfen bir dosya seçin.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('importType', importType);

    try {
      const res = await fetch('/api/ingestion/bulk-import', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "İçe aktarım başarıyla tamamlandı!");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(data.error || "İçe aktarılamadı.");
      }
    } catch (e) {
      toast.error("Dosya yüklenirken hata oluştu.");
    } finally {
      setUploading(false);
    }
  };

  const sampleCsvTemplates: Record<string, string> = {
    products: 'data:text/csv;charset=utf-8,Barkod,Urun Adi,Maliyet,Satis Fiyati,Komisyon,Desi\n8690001010,Yeni Nemlendirici Serum,75.00,299.90,18.0,1.0',
    invoices: 'data:text/csv;charset=utf-8,Fatura No,Platform,Tarih,Tutar\nTY-AD-2026-09,Trendyol Reklam,2026-08-25,2500.00',
    tariffs: 'data:text/csv;charset=utf-8,Kategori,Komisyon Orani\nKozmetik & Cilt Bakim,18.0',
  };

  return (
    <div className="fixed inset-0 z-50 bg-dark/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-border shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h4 className="text-sm font-bold text-dark flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-primary" />
            {title}
          </h4>
          <button onClick={onClose} className="text-gray-400 hover:text-dark">✕</button>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          Excel (.xlsx) veya CSV formatındaki listenizi seçin. Veritabanında eşleşen kayıtlar güncellenecek, yeni kayıtlar eklenecektir.
        </p>

        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-canvas border border-border text-xs">
          <span className="font-semibold text-gray-700">Örnek Şablon:</span>
          <a
            href={sampleCsvTemplates[importType] || sampleCsvTemplates.products}
            download={`dvt_${importType}_sablon.csv`}
            className="text-primary font-bold hover:underline flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" /> Şablonu İndir
          </a>
        </div>

        <div className="border-2 border-dashed border-border hover:border-primary p-6 rounded-2xl text-center cursor-pointer transition-colors bg-canvas/40">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-xs cursor-pointer"
          />
          {file && (
            <div className="mt-2 text-xs font-bold text-emerald-700 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Seçilen Dosya: {file.name}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Vazgeç
          </Button>
          <Button
            size="sm"
            onClick={handleUpload}
            disabled={!file || uploading}
            className="text-xs font-bold gap-1.5 shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? "Veritabanına Yazılıyor..." : "İçe Aktar & Kaydet"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
