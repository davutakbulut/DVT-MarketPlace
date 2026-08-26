"use client";
import React from 'react';
import { useTenantStore } from '@/stores/useTenantStore';
import { Store, ChevronDown } from 'lucide-react';

export function StoreSelector() {
  const { activeStore, availableStores, setActiveStoreId } = useTenantStore();

  return (
    <div className="relative inline-block text-left shrink-0">
      <div className="flex items-center gap-1 sm:gap-1.5 bg-canvas hover:bg-border/60 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-border transition-colors cursor-pointer group">
        <Store className="w-3.5 h-3.5 text-primary shrink-0" />
        <select
          value={activeStore.id}
          onChange={(e) => setActiveStoreId(e.target.value)}
          className="bg-transparent text-[11px] sm:text-xs font-semibold text-dark focus:outline-none cursor-pointer pr-3 sm:pr-4 appearance-none truncate max-w-[65px] xs:max-w-[100px] sm:max-w-[200px]"
        >
          {availableStores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3 h-3 text-muted-foreground -ml-2.5 pointer-events-none shrink-0" />
      </div>
    </div>
  );
}
