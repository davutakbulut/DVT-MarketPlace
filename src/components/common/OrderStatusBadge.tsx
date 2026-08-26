"use client";
import React from 'react';
import { 
  CheckCircle2, 
  Truck, 
  Clock, 
  XCircle, 
  Undo2, 
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type NormalizedOrderStatus = 
  | 'Delivered' 
  | 'Shipped' 
  | 'Created' 
  | 'Picking' 
  | 'ReadyToShip' 
  | 'Invoiced'
  | 'Cancelled' 
  | 'Returned' 
  | 'UnDeliveredAndReturned' 
  | string;

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

  let label = 'Yeni Sipariş';
  let colorClasses = 'bg-amber-100 text-amber-900 border-amber-300';
  let Icon = Clock;

  // 1. TESLİM EDİLDİ
  if (s === 'delivered' || s.includes('teslim') || s.includes('tamamlandı')) {
    label = 'Teslim Edildi';
    colorClasses = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    Icon = CheckCircle2;
  }
  // 2. İADE / TESLİM EDİLEMEDİ
  else if (s.includes('return') || s.includes('iade') || s.includes('undelivered')) {
    label = s.includes('undelivered') ? 'Teslim Edilemedi (İade)' : 'İade Edildi';
    colorClasses = 'bg-purple-100 text-purple-900 border-purple-300';
    Icon = Undo2;
  }
  // 3. İPTAL EDİLDİ
  else if (s.includes('cancel') || s.includes('iptal')) {
    label = 'İptal Edildi';
    colorClasses = 'bg-red-100 text-red-800 border-red-300';
    Icon = XCircle;
  }
  // 4. YENİ / HAZIRLANIYOR / KARGOYA HAZIR (ReadyToShip, Picking, Created, Invoiced, New)
  // CRITICAL: MUST BE CHECKED BEFORE 'shipped' to prevent 'readytoship' from matching 'ship'!
  else if (
    s === 'readytoship' || 
    s === 'ready_to_ship' || 
    s.includes('readyto') ||
    s === 'picking' ||
    s.includes('toplan') ||
    s.includes('hazır') ||
    s.includes('pack') ||
    s === 'created' ||
    s === 'invoiced' ||
    s === 'new' ||
    s.includes('yeni')
  ) {
    if (s === 'readytoship' || s === 'ready_to_ship' || s.includes('readyto')) {
      label = 'Kargoya Hazır';
    } else if (s === 'picking' || s.includes('toplan')) {
      label = 'Toplanıyor';
    } else if (s === 'invoiced') {
      label = 'Faturalandı';
    } else {
      label = 'Yeni Sipariş';
    }
    colorClasses = 'bg-amber-100 text-amber-900 border-amber-300';
    Icon = Package;
  }
  // 5. KARGODA / TRANSIT / YOLDA (Only actual shipped orders)
  else if (
    s === 'shipped' ||
    s === 'in_transit' ||
    s.includes('kargo') ||
    s.includes('transit') ||
    s.includes('yolda') ||
    s.includes('sevk')
  ) {
    label = 'Kargoda';
    colorClasses = 'bg-sky-100 text-sky-800 border-sky-300';
    Icon = Truck;
  }
  // 6. DEFAULT / FALLBACK
  else {
    label = status || 'Yeni Sipariş';
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
