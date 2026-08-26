"use client";
import React, { useEffect, useState } from 'react';
import { useTenantStore } from '@/stores/useTenantStore';
import { Store, ChevronDown } from 'lucide-react';

export function StoreSelector() {
  const { activeStore, activeStoreId, availableStores, setActiveStoreId, loadStoresFromAPI } = useTenantStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadStoresFromAPI();
  }, [loadStoresFromAPI]);

  return (
    <div className="relative inline-block text-left shrink-0" suppressHydrationWarning>
      <div className="flex items-center gap-1.5 bg-canvas hover:bg-border/60 px-2.5 sm:px-3 py-1.5 rounded-xl border border-border transition-colors cursor-pointer group">
        <Store className="w-3.5 h-3.5 text-primary shrink-0" />
        <select
          suppressHydrationWarning
          value={mounted ? (activeStoreId || activeStore?.id || 'all') : 'all'}
          onChange={(e) => setActiveStoreId(e.target.value)}
          className="bg-transparent text-[11px] sm:text-xs font-bold text-dark focus:outline-none cursor-pointer pr-4 appearance-none truncate max-w-[130px] sm:max-w-[180px] lg:max-w-[220px]"
        >
          {availableStores.map((s) => (
            <option key={s.id} value={s.id} className="bg-white text-dark font-medium py-1">
              {s.name}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3 h-3 text-muted-foreground -ml-2 pointer-events-none shrink-0" />
      </div>
    </div>
  );
}
