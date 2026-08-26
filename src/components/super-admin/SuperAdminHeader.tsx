"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Crown,
  Store,
  LogOut,
  User,
  ShieldCheck,
  Zap,
  Activity,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface SuperAdminHeaderProps {
  onMobileMenuToggle?: () => void;
}

export function SuperAdminHeader({ onMobileMenuToggle }: SuperAdminHeaderProps) {
  const router = useRouter();
  const [userDropdown, setUserDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Oturum kapatıldı.');
      router.push('/login');
    } catch (e) {
      router.push('/login');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800/80 text-slate-200">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu & Portal Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Menü"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-xl text-xs font-bold text-indigo-400">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Süper Admin Modu Aktif</span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Sistem Sağlıklı (14ms)
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Portal Switch & Profile */}
        <div className="flex items-center gap-3">
          {/* Quick Switch Button to Normal Dashboard */}
          <Link href="/dashboard">
            <Button
              size="sm"
              className="h-9 px-3.5 rounded-xl text-xs font-black bg-gradient-to-r from-orange-500 to-[#FF5722] text-white hover:opacity-90 shadow-md shadow-orange-500/20 gap-1.5"
            >
              <Store className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Satıcı Paneline Geç</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>

          {/* User Profile Dropdown */}
          <div className="relative">
            <div
              onClick={() => setUserDropdown(!userDropdown)}
              className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors"
              title="Süper Admin Profili"
            >
              <Crown className="w-4 h-4 text-amber-400" />
            </div>

            {userDropdown && (
              <>
                <div className="fixed inset-0 z-50" onClick={() => setUserDropdown(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-[#111827] rounded-2xl shadow-2xl border border-slate-700 z-60 p-3 animate-in fade-in zoom-in-95 space-y-2.5 text-slate-200">
                  <div className="px-2 py-1.5 border-b border-slate-800">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      Davut Akbulut
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">bilgi@davutakbulut.co</div>
                    <Badge className="mt-1.5 bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[9px] px-2 py-0.5">
                      Master Super Admin
                    </Badge>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setUserDropdown(false)}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-orange-400" />
                      <span>Satıcı Paneline Dön</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors text-left cursor-pointer"
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
    </header>
  );
}
