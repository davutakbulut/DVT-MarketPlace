"use client";
import React, { useState } from 'react';
import { StoreSelector } from './StoreSelector';
import { CountrySelector } from './CountrySelector';
import { DateRangePicker } from './DateRangePicker';
import { NotificationCenter } from './NotificationCenter';
import { VirtualTourModal } from './VirtualTourModal';
import { Menu, Compass, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header({ onMobileMenuToggle }: { onMobileMenuToggle: () => void }) {
  const [tourOpen, setTourOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 h-16 bg-white/95 backdrop-blur-md border-b border-border px-4 sm:px-6 flex items-center justify-between transition-all">
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-xl text-dark hover:bg-canvas transition-colors"
          aria-label="Menüyü Aç"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold tracking-tight text-primary flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
            DVT<span className="text-dark font-normal">MarketPlace</span>
          </span>
          <span className="hidden sm:inline-block bg-primary-tint-100 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
            v1.0
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 ml-4">
          <StoreSelector />
          <CountrySelector />
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="hidden lg:block">
          <DateRangePicker />
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setTourOpen(true)}
          className="hidden sm:flex items-center gap-1.5 h-8 text-[11px] rounded-xl font-semibold"
        >
          <Compass className="w-3.5 h-3.5 text-primary" />
          <span>Nasıl Yapılır?</span>
        </Button>

        <NotificationCenter />

        <div className="w-8 h-8 rounded-xl bg-canvas border border-border flex items-center justify-center cursor-pointer hover:bg-border/50 transition-colors">
          <User className="w-4 h-4 text-dark" />
        </div>
      </div>

      <VirtualTourModal open={tourOpen} onClose={() => setTourOpen(false)} />
    </header>
  );
}
