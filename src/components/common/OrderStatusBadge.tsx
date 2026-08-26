"use client";
import React from 'react';
import { 
  CheckCircle2, 
  Truck, 
  Clock, 
  XCircle, 
  Undo2, 
  Package, 
  AlertCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type NormalizedOrderStatus = 'Delivered' | 'Shipped' | 'Created' | 'Picking' | 'ReadyToShip' | 'Cancelled' | 'Returned' | 'UnDeliveredAndReturned' | string;

interface OrderStatusBadgeProps {
  status: NormalizedOrderStatus;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function OrderStatusBadge({ 
  status, 
  className, 
  showIcon = true,
  size = 'sm' 
}: OrderStatusBadgeProps) {
  const s = (status || '').toLowerCase().trim();

  let label = 'Yeni';
  let colorClasses = 'bg-amber-100 text-amber-900 border-amber-300';
  let Icon = Clock;

  if (s.includes('deliver') || s.includes('teslim') || s.includes('tamam')) {
    // 1. TESLİM EDİLDİ - Canlı Yeşil
    label = 'Teslim Edildi';
    colorClasses = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    Icon = CheckCircle2;
  } else if (s.includes('ship') || s.includes('kargo') || s.includes('transit') || s.includes('yolda')) {
    // 2. KARGODA - Canlı Mavi / Gökyüzü
    label = 'Kargoda';
    colorClasses = 'bg-sky-100 text-sky-800 border-sky-300';
    Icon = Truck;
  } else if (s.includes('return') || s.includes('iade') || s.includes('undelivered')) {
    // 3. İADE EDİLDİ - Dikkat Çekici Mor / Eflatun
    label = s.includes('undelivered') ? 'Teslim Edilemedi (İade)' : 'İade Edildi';
    colorClasses = 'bg-purple-100 text-purple-900 border-purple-300';
    Icon = Undo2;
  } else if (s.includes('cancel') || s.includes('iptal')) {
    // 4. İPTAL - Dikkat Çekici Kırmızı / Gül Kurusu
    label = 'İptal Edildi';
    colorClasses = 'bg-red-100 text-red-800 border-red-300';
    Icon = XCircle;
  } else if (s.includes('pick') || s.includes('hazır') || s.includes('pack') || s.includes('readytoship')) {
    // 5. HAZIRLANIYOR / TOPLANIYOR - Turuncu / Kehribar
    label = 'Hazırlanıyor';
    colorClasses = 'bg-amber-100 text-amber-900 border-amber-300';
    Icon = Package;
  } else {
    // 6. YENİ SİPARİŞ - Sarı / Kehribar
    label = 'Yeni Sipariş';
    colorClasses = 'bg-amber-100 text-amber-900 border-amber-300';
    Icon = Clock;
  }

  const sizeClasses = {
    sm: 'text-[10px] py-0.5 px-2 gap-1 rounded-lg',
    md: 'text-xs py-1 px-2.5 gap-1.5 rounded-xl',
    lg: 'text-sm py-1.5 px-3 gap-2 rounded-xl',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <span
      className={cn(
        'inline-flex items-center font-black border shadow-2xs whitespace-nowrap transition-colors select-none',
        colorClasses,
        sizeClasses,
        className
      )}
    >
      {showIcon && <Icon className={cn('shrink-0', iconSizes)} />}
      <span>{label}</span>
    </span>
  );
}
