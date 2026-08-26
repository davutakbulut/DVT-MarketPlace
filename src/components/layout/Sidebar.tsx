"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/live-analysis', label: 'Canlı Analiz', icon: Activity, badge: 'Canlı' },
  { href: '/products', label: 'Ürünlerim (Katalog)', icon: Package, badge: '245 Ürün' },
  { href: '/product-profitability', label: 'Ürün Kârlılık Analizi', icon: TrendingUp },
  { href: '/product-pricing', label: 'Ürün Fiyatlandırma', icon: Calculator },
  { href: '/profit-margin-list', label: 'Kâr Marjı Listesi', icon: Percent },
  { href: '/marketing/ads', label: 'Reklamlarım', icon: Megaphone },
  {
    label: 'Kargo & Tarifeler',
    icon: Truck,
    children: [
      { href: '/tariffs/desi', label: 'Kargo Desi Fiyatları (0-500)' },
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
  { href: '/settings', label: 'Ayarlar', icon: Settings },
];

export function Sidebar({ mobileOpen, onMobileClose }: { mobileOpen: boolean; onMobileClose: () => void }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-white border-r border-border flex flex-col justify-between transition-all duration-300 ease-in-out',
          collapsed ? 'w-20' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-primary to-primary-hover flex items-center justify-center text-white shadow-xs shrink-0 font-black text-sm">
              DVT
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-black text-sm text-dark tracking-tight leading-none">DVT Market</span>
                <span className="text-[10px] text-muted-foreground font-semibold mt-0.5">Finans & Fiyatlama</span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-xl text-muted-foreground hover:bg-canvas hover:text-dark transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
          {navItems.map((item, idx) => {
            if (item.children) {
              return (
                <div key={idx} className="space-y-1 pt-1">
                  {!collapsed && (
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
                      >
                        <item.icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-muted-foreground')} />
                        {!collapsed && <span>{child.label}</span>}
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
                  'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group',
                  isActive
                    ? 'bg-primary text-white shadow-xs font-bold'
                    : 'text-gray-600 hover:bg-canvas hover:text-dark'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-muted-foreground')} />
                  {!collapsed && <span>{item.label}</span>}
                </div>

                {!collapsed && item.badge && (
                  <span className="text-[10px] bg-primary-tint-100 text-primary font-bold px-1.5 py-0.5 rounded-full group-hover:bg-white group-hover:text-primary">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer User Info */}
        <div className="p-4 border-t border-border flex items-center gap-3 bg-canvas/40">
          <div className="w-8 h-8 rounded-xl bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0">
            DA
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="text-xs font-bold text-dark truncate">Davut Akbulut</span>
              <span className="text-[10px] text-muted-foreground">Admin • Trendyol Mağaza</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
