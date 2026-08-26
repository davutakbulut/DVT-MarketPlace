"use client";
import React, { useState } from 'react';
import { StoreSelector } from './StoreSelector';
import { CountrySelector } from './CountrySelector';
import { DateRangePicker } from './DateRangePicker';
import { NotificationCenter } from './NotificationCenter';
import { VirtualTourModal } from './VirtualTourModal';
import { Menu, Compass, User, LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BrandLogo } from '@/components/common/BrandLogo';

export function Header({ onMobileMenuToggle }: { onMobileMenuToggle: () => void }) {
  const router = useRouter();
  const [tourOpen, setTourOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success("Oturum kapatıldı.");
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 h-14 sm:h-16 bg-white/95 backdrop-blur-md border-b border-border px-3 sm:px-6 flex items-center justify-between transition-all">
      {/* Left: Mobile Toggle & Brand Logo & Store Selector */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-1.5 rounded-xl text-dark hover:bg-canvas transition-colors"
          aria-label="Menüyü Aç"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="lg:hidden">
          <BrandLogo size="sm" showText={false} showBadge={false} showSlogan={false} className="sm:hidden" />
          <BrandLogo size="sm" showText={true} showBadge={false} showSlogan={false} className="hidden sm:flex" />
        </div>

        <div className="flex items-center gap-1.5 ml-1 sm:ml-2">
          <StoreSelector />
          <div className="hidden sm:block">
            <CountrySelector />
          </div>
        </div>
      </div>

      {/* Right: Live DB Status, Date picker, Virtual Tour, Notifications, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">


        <div className="flex items-center">
          <DateRangePicker />
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setTourOpen(true)}
          className="hidden sm:flex items-center gap-1 h-8 text-[11px] rounded-xl font-semibold px-2.5"
        >
          <Compass className="w-3.5 h-3.5 text-primary" />
          <span>Rehber</span>
        </Button>

        <NotificationCenter />

        {/* User Profile & Logout Dropdown */}
        <div className="relative">
          <div
            onClick={() => setUserDropdown(!userDropdown)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-canvas border border-border flex items-center justify-center cursor-pointer hover:bg-border/50 transition-colors"
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
                  <div className="text-[10px] text-gray-500 font-mono">dvtakblt@gmail.com</div>
                  <div className="text-[10px] text-primary font-bold mt-0.5">Admin (Firma Yöneticisi)</div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Güvenli Çıkış Yap</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <VirtualTourModal open={tourOpen} onClose={() => setTourOpen(false)} />
    </header>
  );
}
