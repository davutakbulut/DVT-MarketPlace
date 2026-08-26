"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Undo2,
  LayoutDashboard,
  Activity,
  Package,
  TrendingUp,
  Calculator,
  Percent,
  Layers,
  Truck,
  Megaphone,
  Sparkles,
  Award,
  FileCheck2,
  AlertOctagon,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
  Store,
  Users,
  ShieldAlert,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandLogo } from '@/components/common/BrandLogo';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/live-analysis', label: 'Canlı Analiz', icon: Activity, badge: 'Canlı' },
  { href: '/products', label: 'Ürünlerim (Katalog)', icon: Package, badge: '279 Ürün' },
  { href: '/returns-cancellations', label: 'İptal & İade Siparişler', icon: Undo2, badge: '156' },
  { href: '/product-profitability', label: 'Ürün Kârlılık Analizi', icon: TrendingUp },
  { href: '/product-pricing', label: 'Ürün Fiyatlandırma', icon: Calculator },
  { href: '/profit-margin-list', label: 'Kâr Marjı Listesi', icon: Percent },
  { href: '/marketing/ads', label: 'Reklamlarım', icon: Megaphone },
  {
    label: 'Kargo Yönetimi',
    icon: Truck,
    children: [
      { href: '/tariffs/desi', label: 'Kargo Desi Fiyatları (0-500)' },
      { href: '/tariffs/cargo-barem', label: 'Kargo Barem Destek' },
    ],
  },
  {
    label: 'Pazaryeri Tarifeleri',
    icon: Layers,
    children: [
      { href: '/tariffs/commission', label: 'Ürün Komisyon Tarifesi' },
      { href: '/tariffs/plus', label: 'Plus Komisyon Tarifesi' },
      { href: '/tariffs/badges', label: 'Avantajlı Ürün Etiketi' },
    ],
  },
  { href: '/settlement-desi-audit', label: 'Hakediş & Desi Kontrol', icon: FileCheck2 },
  { href: '/reports/order-profitability', label: 'Finansal Raporlar', icon: FileSpreadsheet },
  { href: '/customers', label: 'Müşterilerim', icon: Users },
  { href: '/alerts', label: 'Uyarı Listesi', icon: AlertOctagon, badgeCount: 3 },
  { href: '/stores', label: 'Mağazalarım & Yeni Bağla', icon: Store },
  { href: '/system/analytics', label: 'Sayfa Analytics & Isı Haritası', icon: Activity, badge: 'Canlı' },
  { href: '/system/crashes', label: 'Çökme & Hata Takibi', icon: ShieldAlert, badge: 'Yeni' },
  { href: '/settings', label: 'Ayarlar', icon: Settings },
];

export function Sidebar({ mobileOpen, onMobileClose }: { mobileOpen: boolean; onMobileClose: () => void }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Lock body scroll when mobile sidebar is active
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-white border-r border-border flex flex-col justify-between transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none',
          collapsed ? 'w-20' : 'w-64 sm:w-72 lg:w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 h-16 border-b border-border shrink-0">
          <BrandLogo 
            size="md" 
            showText={!collapsed || mobileOpen} 
            showSlogan={!collapsed || mobileOpen}
            showBadge={!collapsed || mobileOpen}
            href="/dashboard"
          />

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-xl text-muted-foreground hover:bg-canvas hover:text-dark transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onMobileClose}
            className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-dark hover:bg-canvas transition-colors cursor-pointer"
            aria-label="Menüyü Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
          {navItems.map((item, idx) => {
            if (item.children) {
              return (
                <div key={idx} className="space-y-1 pt-1">
                  {(!collapsed || mobileOpen) && (
                    <span className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      {item.label}
                    </span>
                  )}
                  {item.children.map((child) => {
                    const isActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onMobileClose}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all',
                          isActive
                            ? 'bg-primary text-white shadow-xs font-bold'
                            : 'text-gray-600 hover:bg-canvas hover:text-dark'
                        )}
                        title={collapsed && !mobileOpen ? child.label : undefined}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                        {(!collapsed || mobileOpen) && <span>{child.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href!}
                onClick={onMobileClose}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-primary text-white shadow-xs font-bold'
                    : 'text-gray-600 hover:bg-canvas hover:text-dark'
                )}
                title={collapsed && !mobileOpen ? item.label : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  {(!collapsed || mobileOpen) && <span>{item.label}</span>}
                </div>

                {(!collapsed || mobileOpen) && (
                  <>
                    {item.badge && (
                      <span
                        className={cn(
                          'text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase leading-none tracking-wide',
                          isActive ? 'bg-white/20 text-white' : 'bg-primary-tint-100 text-primary'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                    {item.badgeCount && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full leading-none">
                        {item.badgeCount}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer info in sidebar */}
        <div className="p-3 border-t border-border bg-canvas/40 shrink-0">
          {(!collapsed || mobileOpen) ? (
            <div className="flex items-center justify-between text-[11px] text-gray-500">
              <span className="font-semibold">v2.6 Live Engine</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          ) : (
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mx-auto" />
          )}
        </div>
      </aside>
    </>
  );
}
