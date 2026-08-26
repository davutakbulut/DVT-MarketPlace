"use client";
import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Clock,
  Globe,
  Trash2,
  Check,
  ChevronDown,
  ChevronRight,
  Code
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function SuperAdminCrashesPage() {
  const [loading, setLoading] = useState(true);
  const [crashes, setCrashes] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchCrashes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/system/crash-report');
      const json = await res.json();
      if (json.crashes) {
        setCrashes(json.crashes);
      }
    } catch (e: any) {
      toast.error('Hata raporları yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrashes();
  }, []);

  const handleResolve = async (id: string) => {
    try {
      const res = await fetch('/api/system/crash-report', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, resolved: true })
      });
      if (res.ok) {
        toast.success('Hata çözüldü olarak işaretlendi.');
        setCrashes(prev => prev.map(c => c.id === id ? { ...c, resolved: true } : c));
      }
    } catch (e) {
      toast.error('İşlem başarısız oldu.');
    }
  };

  const filteredCrashes = crashes.filter((c) => {
    if (filter === 'unresolved') return !c.resolved;
    if (filter === 'resolved') return c.resolved;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Canlı Çökme & Anomali İzleme Konsolu
            </h1>
            <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 text-xs">
              7/24 Koruma
            </Badge>
          </div>
          <p className="text-xs text-slate-400">
            Kullanıcı tarayıcılarında veya API çağrılarında meydana gelen beklenmedik hatalar ve stack trace dökümleri.
          </p>
        </div>

        <Button
          onClick={fetchCrashes}
          disabled={loading}
          variant="outline"
          size="sm"
          className="h-10 px-4 rounded-xl border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white text-xs font-bold gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Yenile</span>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {[
            { id: 'unresolved', label: '🚨 Aktif / Çözülmemiş' },
            { id: 'resolved', label: '✅ Çözülmüş' },
            { id: 'all', label: 'Tüm Kayıtlar' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === tab.id
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 font-mono">
          {filteredCrashes.length} Rapor Listelendi
        </div>
      </div>

      {/* Crash Cards */}
      <div className="space-y-3">
        {filteredCrashes.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-mono bg-slate-900/60 border border-slate-800 rounded-3xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <div>Harika! Listelenecek aktif hata veya çökme bulunamadı.</div>
          </div>
        ) : (
          filteredCrashes.map((crash) => {
            const isExpanded = expandedId === crash.id;

            return (
              <div
                key={crash.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      crash.resolved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{crash.error_message || 'Bilinmeyen Hata'}</span>
                        <Badge className={`text-[10px] font-bold uppercase ${
                          crash.resolved
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}>
                          {crash.resolved ? 'Çözüldü' : 'Aktif'}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                        <span>Rota: <strong className="text-slate-200">{crash.route || '/'}</strong></span>
                        <span>•</span>
                        <span>{new Date(crash.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!crash.resolved && (
                      <Button
                        size="sm"
                        onClick={() => handleResolve(crash.id)}
                        className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Çözüldü</span>
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpandedId(isExpanded ? null : crash.id)}
                      className="h-8 px-3 rounded-xl border-slate-800 bg-slate-950 text-slate-300 text-xs font-bold gap-1"
                    >
                      <Code className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{isExpanded ? 'Gizle' : 'Stack Trace'}</span>
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-rose-300 space-y-2 overflow-x-auto">
                    <div className="text-[11px] text-slate-400 uppercase font-bold">Hata Ayrıntısı & Stack Trace:</div>
                    <pre className="text-[11px] whitespace-pre-wrap leading-relaxed">
                      {crash.error_stack || 'Stack trace kaydı bulunamadı.'}
                    </pre>
                    {crash.user_agent && (
                      <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500">
                        Tarayıcı / Cihaz: {crash.user_agent}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
