"use client";
import React, { useState, useEffect } from "react";
import { formatDateTime } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  AlertTriangle, ShieldAlert, CheckCircle2, RefreshCw, 
  Copy, Download, Terminal, Bug, Clock, ExternalLink,
  ChevronDown, ChevronRight, Activity, Filter, Eye, Check
} from "lucide-react";

export default function SystemCrashesPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalCrashes: 0, unresolvedCrashes: 0, resolvedCrashes: 0, criticalCrashes: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchCrashes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/system/crash-report?status=${statusFilter}&severity=${severityFilter}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setStats(data.stats || { totalCrashes: 0, unresolvedCrashes: 0, resolvedCrashes: 0, criticalCrashes: 0 });
    } catch (e) {
      toast.error("Çökme kayıtları yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrashes();
  }, [statusFilter, severityFilter]);

  const handleToggleResolve = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'resolved' ? 'unresolved' : 'resolved';
    try {
      await fetch('/api/system/crash-report', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus })
      });
      toast.success(nextStatus === 'resolved' ? 'Hata çözüldü olarak işaretlendi.' : 'Hata açık duruma getirildi.');
      fetchCrashes();
    } catch (e) {
      toast.error("Durum güncellenemedi.");
    }
  };

  const handleCopyStack = (stack: string) => {
    navigator.clipboard.writeText(stack);
    toast.success("Stack Trace panoya kopyalandı!");
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dvt-crashes-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    toast.success("Çökme raporu JSON olarak indirildi.");
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-dark flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <span>Sistem Çökme & Hata Takip Merkezi</span>
            </h3>
            <Badge variant="danger">İç Yazılım Telemetry</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            İstemci tarafı JS çökmeleri, Promise rejection'lar ve API hatalarının anlık izleme günlüğü
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleExportJson} className="h-8 sm:h-9 text-xs gap-1.5 font-bold">
            <Download className="w-3.5 h-3.5" />
            <span>JSON İndir</span>
          </Button>
          <Button size="sm" variant="outline" onClick={fetchCrashes} className="h-8 sm:h-9 text-xs gap-1.5 font-bold">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Yenile</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-3xl border border-border shadow-xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block">Toplam Çökme</span>
          <div className="text-2xl font-black text-dark tabular-nums mt-1">{stats.totalCrashes}</div>
          <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">Kayıt altına alınan</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-border shadow-xs">
          <span className="text-[11px] font-bold text-red-600 uppercase tracking-wide block">Açık / Çözülmemiş</span>
          <div className="text-2xl font-black text-red-600 tabular-nums mt-1">{stats.unresolvedCrashes}</div>
          <span className="text-[10px] text-red-500 font-semibold block mt-0.5">Müdahale bekleyen</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-border shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wide block">Kritik Hatalar</span>
          <div className="text-2xl font-black text-amber-600 tabular-nums mt-1">{stats.criticalCrashes}</div>
          <span className="text-[10px] text-amber-500 font-semibold block mt-0.5">Yüksek öncelikli</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-border shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wide block">Çözülen Olaylar</span>
          <div className="text-2xl font-black text-emerald-600 tabular-nums mt-1">{stats.resolvedCrashes}</div>
          <span className="text-[10px] text-emerald-500 font-semibold block mt-0.5">Tamamlanan</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-border shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black text-dark flex items-center gap-1.5 mr-2">
            <Filter className="w-4 h-4 text-primary" />
            <span>Filtrele:</span>
          </span>

          <div className="flex items-center gap-1 bg-canvas p-1 rounded-2xl border border-border text-xs font-bold">
            {['all', 'unresolved', 'resolved'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-xl transition-all ${
                  statusFilter === st 
                    ? 'bg-primary text-white shadow-xs' 
                    : 'text-gray-600 hover:text-dark'
                }`}
              >
                {st === 'all' ? 'Tümü' : st === 'unresolved' ? 'Açık Hatalar' : 'Çözülenler'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-canvas p-1 rounded-2xl border border-border text-xs font-bold">
            {['all', 'critical', 'error', 'warning'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1 rounded-xl transition-all ${
                  severityFilter === sev 
                    ? 'bg-dark text-white shadow-xs' 
                    : 'text-gray-600 hover:text-dark'
                }`}
              >
                {sev === 'all' ? 'Tüm Seviyeler' : sev === 'critical' ? 'Kritik' : sev === 'error' ? 'Hata' : 'Uyarı'}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs text-gray-500 font-bold">
          Listelenen: {logs.length} Olay
        </span>
      </div>

      {/* Incidents Stream */}
      <div className="space-y-3">
        {logs.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-border shadow-xs space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="text-base font-black text-dark">Harika! Kayıtlı çökme veya açık hata bulunamadı.</h4>
            <p className="text-xs text-gray-500">Tüm sistem sayfaları ve istemci iş parçacıkları sorunsuz çalışıyor.</p>
          </div>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedId === log.id;
            return (
              <div 
                key={log.id}
                className={`bg-white rounded-3xl border transition-all shadow-xs ${
                  log.status === 'resolved' 
                    ? 'border-border opacity-75' 
                    : (log.severity === 'critical' ? 'border-red-200 ring-1 ring-red-400/20' : 'border-border')
                }`}
              >
                {/* Main Row */}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-canvas/50 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`p-2 rounded-2xl shrink-0 mt-0.5 ${
                      log.severity === 'critical' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      <Bug className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black text-dark">{log.errorType}</span>
                        <Badge variant={log.severity === 'critical' ? 'danger' : 'warning'}>
                          {log.severity}
                        </Badge>
                        <span className="px-2 py-0.5 rounded-lg bg-canvas text-[11px] font-mono font-bold text-gray-600 border border-border">
                          {log.pageUrl}
                        </span>
                        {log.componentName && (
                          <span className="text-[11px] text-gray-500 font-semibold">
                            Bileşen: <strong className="text-dark">{log.componentName}</strong>
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-bold text-gray-800 truncate max-w-3xl">
                        {log.errorMessage}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-gray-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDateTime(log.createdAt)}</span>
                        </span>
                        {log.status === 'resolved' && (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Çözüldü</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant={log.status === 'resolved' ? 'outline' : 'default'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleResolve(log.id, log.status);
                      }}
                      className="h-8 text-xs font-bold gap-1 rounded-xl"
                    >
                      {log.status === 'resolved' ? 'Tekrar Aç' : 'Çözüldü Yap'}
                    </Button>
                    <div className="p-1 rounded-xl hover:bg-canvas text-gray-400">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Stack Trace Drawer */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 pt-0 border-t border-border/60 bg-canvas/40 space-y-3 text-xs">
                    <div className="flex items-center justify-between pt-3">
                      <span className="font-black text-dark flex items-center gap-1.5">
                        <Terminal className="w-4 h-4 text-primary" />
                        <span>Hata Ayrıntısı & Stack Trace:</span>
                      </span>

                      {log.stackTrace && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleCopyStack(log.stackTrace)}
                          className="h-7 text-xs font-bold gap-1 text-primary"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Kopyala</span>
                        </Button>
                      )}
                    </div>

                    <div className="p-3.5 rounded-2xl bg-dark text-gray-100 font-mono text-[11px] overflow-x-auto leading-relaxed shadow-inner">
                      {log.stackTrace || log.errorMessage || "Stack trace bilgisi bulunmuyor."}
                    </div>

                    {log.userAgent && (
                      <div className="text-[11px] text-gray-500 font-mono pt-1">
                        <strong>Kullanıcı İstemcisi (User-Agent):</strong> {log.userAgent}
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
