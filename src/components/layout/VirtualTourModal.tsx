"use client";
import React, { useState } from 'react';
import { Compass, X, Play, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const tourSteps = [
  { id: 1, title: 'Dashboard Tanıtımı', desc: 'Genel ciro, net kâr, kâr şelalesi ve 12 masraf kaleminin incelenmesi.' },
  { id: 2, title: 'Ürün Ayarları & Maliyet Yükleme', desc: 'Excel veya satır içi düzenleme ile ürün alış maliyetlerinin girilmesi.' },
  { id: 3, title: 'Promosyon & Tarife Kârlılık Analizi', desc: 'Trendyol Plus ve baremli komisyon tarifelerinde kâr simülasyonu.' },
  { id: 4, title: 'Finansal Raporlara Erişim', desc: 'Sipariş, ürün, kategori, iade zarar ve RoAS reklam analizleri.' },
  { id: 5, title: 'Kâr Marjı Listesi', desc: 'Liste fiyatı ile müşteri fiyatı kıyası ve toplu fiyat güncelleme.' },
  { id: 6, title: 'Ürün Fiyatlandırma Motoru', desc: 'İstenilen kâr marjına göre tersine hedef satış fiyatı hesaplama.' },
  { id: 7, title: 'Uyarı Listesi & Anomali Tespiti', desc: 'Zararına satışlar ve eksik maliyetli siparişlerin takibi.' },
  { id: 8, title: 'Genel & Kargo Desi Ayarları', desc: 'Kargo firmaları desi baremleri ve operasyonel giderlerin tanımlanması.' },
];

export function VirtualTourModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-border">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-primary-tint-100 flex items-center justify-center">
              <Compass className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-dark">Nasıl Yapılır? Sanal Tur Rehberi</h3>
              <p className="text-xs text-muted-foreground">DVT-MarketPlace sistemini en verimli şekilde kullanma adımları</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-muted-foreground hover:bg-canvas">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-6 max-h-96 overflow-y-auto pr-1">
          {tourSteps.map((s) => (
            <div
              key={s.id}
              className="p-3.5 rounded-2xl border border-border hover:border-primary/50 hover:bg-primary-tint-50 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                  {s.id}
                </span>
                <h4 className="text-xs font-bold text-dark group-hover:text-primary transition-colors">{s.title}</h4>
              </div>
              <p className="text-[11px] text-gray-500 leading-snug pl-7">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <span className="text-[11px] text-gray-500">Düzenli kullanan mağazalar kâr marjlarını ortalama %40 artırıyor.</span>
          <Button onClick={onClose} size="sm">
            Anladım, Başla
          </Button>
        </div>
      </div>
    </div>
  );
}
