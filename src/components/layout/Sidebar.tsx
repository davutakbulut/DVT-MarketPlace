"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Activity,
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
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/live-analysis', label: 'Canlı Analiz', icon: Activity, badge: 'Canlı' },
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
  { href: '/alerts', label: 'Uyarı Listesi', icon: AlertOctagon, badgeCount: 3 },
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

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 lg:z-30 bg-white border-r border-border flex flex-col justify-between transition-all duration-300 ease-in-out",
          collapsed ? "w-[72px]" : "w-[260px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Brand Logo & Collapse Toggle */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-primary flex items-center justify-center text-white font-extrabold text-xs">
                  D
                </div>
                <span className="text-sm font-bold text-dark tracking-tight">DVT-MarketPlace</span>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-muted-foreground hover:bg-canvas transition-colors ml-auto"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {navItems.map((item, idx) => {
              if (item.children) {
                return (
                  <div key={idx} className="pt-2">
                    {!collapsed && (
                      <span className="px-3 text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                        {item.label}
                      </span>
                    )}
                    <div className="mt-1 space-y-1">
                      {item.children.map((child) => {
                        const active = pathname === child.href || (child.href !== '/dashboard' && pathname.startsWith(child.href));
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onMobileClose}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all",
                              active
                                ? "bg-primary-tint-100 text-primary border-r-2 border-primary font-bold"
                                : "text-dark/80 hover:bg-canvas hover:text-dark"
                            )}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                            {!collapsed && <span>{child.label}</span>}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onMobileClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative",
                    active
                      ? "bg-primary text-white shadow-xs"
                      : "text-dark/80 hover:bg-canvas hover:text-dark"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", active ? "text-white" : "text-dark/70 group-hover:text-primary")} />
                  {!collapsed && <span className="flex-1">{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {!collapsed && item.badgeCount && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                      {item.badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
