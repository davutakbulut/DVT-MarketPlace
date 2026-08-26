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
import { BrandLogo } from '@/components/common/BrandLogo';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/live-analysis', label: 'Canlı Analiz', icon: Activity, badge: 'Canlı' },
  { href: '/products', label: 'Ürünlerim (Katalog)', icon: Package, badge: '283 Ürün' },
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
        <div className="flex items-center justify-between px-4 sm:px-5 h-16 border-b border-border">
          <BrandLogo 
            size="md" 
            showText={!collapsed} 
            showSlogan={!collapsed}
            showBadge={!collapsed}
            href="/dashboard"
          />

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
                        title={collapsed ? child.label : undefined}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
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
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative',
                  isActive
                    ? 'bg-primary text-white shadow-xs font-bold'
                    : 'text-dark hover:bg-canvas'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-gray-500 group-hover:text-dark')} />
                {!collapsed && (
                  <div className="flex items-center justify-between flex-1 overflow-hidden">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded-md",
                        isActive ? "bg-white/20 text-white" : "bg-primary-tint-100 text-primary"
                      )}>
                        {item.badge}
                      </span>
                    )}
                    {item.badgeCount && (
                      <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                        {item.badgeCount}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border">
          <div className={cn(
            'flex items-center gap-3 p-2 rounded-2xl bg-canvas border border-border/80',
            collapsed && 'justify-center p-2'
          )}>
            <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
              DA
            </div>
            {!collapsed && (
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className="text-xs font-bold text-dark truncate">Davut Akbulut</span>
                <span className="text-[10px] text-gray-500 truncate font-mono">dvtakblt@gmail.com</span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
