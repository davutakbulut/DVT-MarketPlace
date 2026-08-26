"use client";
import React, { useState } from 'react';
import { StoreSelector } from './StoreSelector';
import { CountrySelector } from './CountrySelector';
import { DateRangePicker } from './DateRangePicker';
import { NotificationCenter } from './NotificationCenter';
import { InteractiveSpotlightGuide } from './InteractiveSpotlightGuide';
import { Menu, Compass, User, LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/common/BrandLogo';

export function Header({ onMobileMenuToggle }: { onMobileMenuToggle: () => void }) {
  const router = useRouter();
  const [guideOpen, setGuideOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success("Oturum kapatıldı.");
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-border transition-all w-full">
      {/* 1. TOP ROW: Mobile Header & Desktop Main Header */}
      <div className="h-14 sm:h-16 px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-2 min-w-0 w-full">
        
        {/* Left: Mobile Toggle / Full Brand Logo / Desktop Store & Country Selectors */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-1.5 rounded-xl text-dark hover:bg-canvas transition-colors cursor-pointer shrink-0"
            aria-label="Menüyü Aç"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Full Brand Logo with Text and PRO badge (ONLY on Mobile/Tablet < lg when Sidebar is hidden) */}
          <div className="shrink-0 lg:hidden">
            <BrandLogo size="sm" showText={true} showBadge={true} showSlogan={false} href="/dashboard" />
          </div>

          {/* Desktop Left Toolbar (Store & Country Selector) */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <StoreSelector />
            <CountrySelector />
          </div>
        </div>

        {/* Right Toolbar: Adapts smoothly from Mobile to 4K Ultra Wide */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 shrink-0">
          {/* Store Selector on Mobile & Tablet (< lg) */}
          <div className="lg:hidden shrink-0">
            <StoreSelector />
          </div>

          {/* Desktop/Tablet Date Range Picker */}
          <div className="hidden md:flex items-center shrink-0">
            <DateRangePicker />
          </div>

          {/* Rehber Spotlight Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setGuideOpen(true)}
            className="flex items-center gap-1.5 h-8 text-[11px] rounded-xl font-bold px-2.5 sm:px-3 shrink-0 bg-primary-tint-50 hover:bg-primary-tint-100 text-primary border border-primary-tint-200 shadow-2xs"
            title="İnteraktif Rehberi Başlat"
          >
            <Compass className="w-3.5 h-3.5 text-primary" />
            <span>Rehber</span>
          </Button>

          {/* Notifications Center */}
          <div className="shrink-0">
            <NotificationCenter />
          </div>

          {/* User Profile & Logout Dropdown */}
          <div className="relative shrink-0">
            <div
              onClick={() => setUserDropdown(!userDropdown)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-canvas border border-border flex items-center justify-center cursor-pointer hover:bg-border/50 transition-colors shrink-0"
              title="Profil & Oturum"
            >
              <User className="w-4 h-4 text-dark" />
            </div>

            {userDropdown && (
              <>
                <div className="fixed inset-0 z-50" onClick={() => setUserDropdown(false)} />
                <div className="absolute right-0 mt-2 w-56 sm:w-60 bg-white rounded-2xl shadow-xl border border-border z-60 p-3 animate-in fade-in zoom-in-95 space-y-2">
                  <div className="px-2 py-1 border-b border-border">
                    <div className="text-xs font-bold text-dark flex items-center gap-1">
                      Davut Akbulut <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono">bilgi@davutakbulut.co</div>
                    <div className="text-[10px] text-primary font-bold mt-0.5">Admin (Firma Yöneticisi)</div>
                  </div>

                  <Link
                    href="/super-admin"
                    onClick={() => setUserDropdown(false)}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200 transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">👑</span>
                      <span>Süper Admin Paneli</span>
                    </div>
                    <Badge className="bg-indigo-600 text-white text-[9px] py-0 px-1">Master</Badge>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Güvenli Çıkış Yap</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. ROW 2: Mobile Date Range & Quick Preset Filter Bar (< md) */}
      <div className="md:hidden px-3 py-2 bg-canvas/60 border-t border-border/60">
        <DateRangePicker isMobileRow={true} />
      </div>

      {/* Dynamic Page-Aware Spotlight Tour Guide */}
      <InteractiveSpotlightGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
    </header>
  );
}
