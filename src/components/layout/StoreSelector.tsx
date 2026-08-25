"use client";
import React from 'react';
import { useTenantStore } from '@/stores/useTenantStore';
import { Store, ChevronDown } from 'lucide-react';

export function StoreSelector() {
  const { activeStore, availableStores, setActiveStoreId } = useTenantStore();

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2 bg-canvas hover:bg-border/60 px-3 py-1.5 rounded-xl border border-border transition-colors cursor-pointer group">
        <Store className="w-4 h-4 text-primary" />
        <select
          value={activeStore.id}
          onChange={(e) => setActiveStoreId(e.target.value)}
          className="bg-transparent text-xs font-semibold text-dark focus:outline-none cursor-pointer pr-4 appearance-none"
        >
          {availableStores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.marketplace.toUpperCase()})
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground -ml-4 pointer-events-none" />
      </div>
    </div>
  );
}
