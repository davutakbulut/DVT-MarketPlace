"use client";
import React, { useState } from 'react';
import { Bell, AlertTriangle, AlertCircle, Info, Check } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  type: 'danger' | 'warning' | 'info';
  time: string;
}

const mockAlerts: NotificationItem[] = [
  { id: '1', title: 'Zararına Satış Tespiti!', desc: 'mlntk-code-42 nolu siparişte -₺18.40 net zarar oluştu.', type: 'danger', time: '12 dk önce' },
  { id: '2', title: 'Maliyeti Eksik Ürün', desc: '8690001293 barkodlu ürünün maliyeti girilmemiş.', type: 'warning', time: '1 saat önce' },
  { id: '3', title: 'Kargo Desi Aşımı', desc: 'Aras Kargo 2 desi faturalandı (Katalog: 1 desi).', type: 'danger', time: '3 saat önce' },
];

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState(mockAlerts);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-dark hover:bg-canvas transition-colors"
        title="Bildirimler"
      >
        <Bell className="w-5 h-5 text-dark" />
        {alerts.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-border z-60 p-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-dark">Akıllı Bildirimler</span>
                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {alerts.length} Yeni
                </span>
              </div>
              <button
                onClick={() => setAlerts([])}
                className="text-[11px] font-medium text-primary hover:underline"
              >
                Tümünü Okundu Say
              </button>
            </div>

            <div className="divide-y divide-border/60 max-h-72 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Okunmamış bildirim bulunmuyor 🎉
                </div>
              ) : (
                alerts.map((a) => (
                  <div key={a.id} className="py-3 flex gap-3 hover:bg-canvas/50 px-2 rounded-xl transition-colors">
                    {a.type === 'danger' ? (
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-dark">{a.title}</span>
                        <span className="text-[10px] text-muted-foreground">{a.time}</span>
                      </div>
                      <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">{a.desc}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
