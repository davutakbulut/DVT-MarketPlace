"use client";
import React, { useState } from 'react';
import {
  Database,
  Cpu,
  Server,
  Zap,
  RefreshCw,
  ShieldCheck,
  Bell,
  CheckCircle2,
  Terminal,
  Activity,
  Layers,
  Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function SuperAdminSettingsPage() {
  const [triggering, setTriggering] = useState(false);

  const handleTriggerAnomalyCron = async () => {
    try {
      setTriggering(true);
      const res = await fetch('/api/cron/notifications');
      const json = await res.json();
      if (json.success) {
        toast.success(`Otomasyon başarıyla tetiklendi. (${json.alertsCreated || 0} yeni anomali uyarısı üretildi).`);
      } else {
        toast.error('Tetikleme başarısız: ' + (json.error || 'Bilinmeyen hata'));
      }
    } catch (e: any) {
      toast.error('Cron isteği sırasında hata oluştu.');
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Sistem Altyapısı & Veritabanı Sağlığı
            </h1>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
              Süper Admin
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            PostgreSQL 16 High-Availability bağlantı havuzu, 2026 kargo barem kuralları ve anomali tarayıcı kontrolleri.
          </p>
        </div>
      </div>

      {/* Grid: 3 Main Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Database Pool */}
        <div className="bg-slate-900/80 p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>PostgreSQL 16 Havuz Durumu</span>
          </h3>

          <div className="space-y-2.5 text-xs font-mono text-slate-300">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-500">Durum:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Aktif & Sağlıklı
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-500">Maksimum Havuz Boyutu:</span>
              <span className="text-white font-bold">20 Bağlantı</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-500">SSL Şifreleme:</span>
              <span className="text-indigo-400 font-bold">require (TLS 1.3)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Bölge (Region):</span>
              <span className="text-slate-300">eu-central-1 (Frankfurt)</span>
            </div>
          </div>
        </div>

        {/* Card 2: 2026 Engine Rules */}
        <div className="bg-slate-900/80 p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>2026 Finans Motoru Parametreleri</span>
          </h3>

          <div className="space-y-2.5 text-xs font-mono text-slate-300">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-500">Resmi Barem Yürürlüğü:</span>
              <span className="text-amber-400 font-bold">10 Ağustos 2026</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-500">Desteklenen Kargo Firmaları:</span>
              <span className="text-white font-bold">7 Firma (TEX, Aras, vb.)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-500">Yasal Stopaj Oranı:</span>
              <span className="text-emerald-400 font-bold">%1.00</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Tersine Fiyatlandırma:</span>
              <span className="text-indigo-300 font-bold">KDV Doğrusallaştırma Devrede</span>
            </div>
          </div>
        </div>

        {/* Card 3: Cron Automation Trigger */}
        <div className="bg-slate-900/80 p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Otomatik Anomali Tarama</span>
          </h3>

          <p className="text-xs text-slate-400 leading-relaxed">
            Sistem arka planda her 15 dakikada bir tüm mağazalardaki zararına siparişleri, desi aşımlarını ve kârsız ürünleri tarar.
          </p>

          <Button
            onClick={handleTriggerAnomalyCron}
            disabled={triggering}
            className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold gap-2 shadow-lg shadow-indigo-600/30"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${triggering ? 'animate-spin' : ''}`} />
            <span>{triggering ? 'Taranıyor...' : 'Şimdi Anomali Taramasını Tetikle'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
