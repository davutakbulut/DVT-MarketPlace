"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Receipt,
  Activity,
  ShieldAlert,
  Settings,
  Store,
  Crown,
  ChevronRight,
  Sparkles,
  ArrowLeftRight,
  Database,
  ExternalLink
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SuperAdminSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function SuperAdminSidebar({ mobileOpen, onMobileClose }: SuperAdminSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      title: 'Genel Bakış & Global KPIs',
      href: '/super-admin',
      icon: LayoutDashboard,
      badge: 'Canlı',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    },
    {
      title: 'Kullanıcılar & Yetkiler',
      href: '/super-admin/users',
      icon: Users,
    },
    {
      title: 'Firmalar & Mağazalar',
      href: '/super-admin/companies',
      icon: Building2,
    },
    {
      title: 'Küresel Canlı İşlemler',
      href: '/super-admin/transactions',
      icon: Receipt,
    },
    {
      title: 'Sayfa Analizi & Isı Haritası',
      href: '/super-admin/analytics',
      icon: Activity,
      badge: 'Telemetri',
      badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
    },
    {
      title: 'Çökme & Hata Takibi',
      href: '/super-admin/crashes',
      icon: ShieldAlert,
      badge: 'Anomali',
      badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
    },
    {
      title: 'Sistem & DB Sağlığı',
      href: '/super-admin/settings',
      icon: Database,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0B0F19] text-slate-200 border-r border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
        <Link href="/super-admin" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0 font-black relative overflow-hidden group-hover:scale-105 transition-transform">
            <Crown className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-black tracking-tight text-white text-base">DVT</span>
              <span className="text-indigo-400 font-bold text-base">Master</span>
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[9px] px-1.5 py-0">
                SUPER
              </Badge>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-1">Platform Komuta Merkezi</p>
          </div>
        </Link>
      </div>

      {/* Mode Switch Card: Go to Seller Portal */}
      <div className="px-4 pt-4">
        <Link
          href="/dashboard"
          className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 hover:border-indigo-400/60 transition-all group shadow-inner"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold shrink-0 group-hover:rotate-12 transition-transform">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1">
                Satıcı Paneline Dön
              </div>
              <div className="text-[10px] text-slate-400">Normal Mağaza Görünümü</div>
            </div>
          </div>
          <ArrowLeftRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
          Yönetim & İzleme Modülleri
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.title}</span>
              </div>

              {item.badge ? (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-bold ${
                  isActive ? 'bg-white/20 text-white border-white/30' : item.badgeColor
                }`}>
                  {item.badge}
                </span>
              ) : (
                isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            PostgreSQL 16 Multi-Tenant
          </span>
          <span className="font-mono text-slate-500 text-[10px]">v2.6.0</span>
        </div>
        <div className="text-[10px] text-slate-500">
          Yetkili: <strong className="text-slate-300">Davut Akbulut (Master Super Admin)</strong>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-[270px] z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onMobileClose} />
          <div className="fixed inset-y-0 left-0 w-[280px] max-w-[85vw] z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
