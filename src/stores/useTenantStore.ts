import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface StoreInfo {
  id: string;
  name: string;
  marketplace: 'all' | 'trendyol' | 'hepsiburada' | 'amazon_tr';
  sellerId: string;
}

interface TenantState {
  companyId: string;
  companyName: string;
  activeStoreId: string;
  activeStore: StoreInfo;
  availableStores: StoreInfo[];
  userRole: 'admin' | 'user';
  permissions: {
    can_view_profit: boolean;
    can_edit_costs: boolean;
    can_update_prices: boolean;
    can_export_reports: boolean;
    allowed_modules: string[];
  };
  setActiveStoreId: (storeId: string) => void;
  setSessionData: (data: any) => void;
  loadStoresFromAPI: () => Promise<void>;
}

const defaultStores: StoreInfo[] = [
  { id: 'all', name: '🏪 Tüm Mağazalar (Tümü)', marketplace: 'all', sellerId: 'all' },
  { id: '22222222-2222-2222-2222-222222222221', name: 'Trendyol Davye Medikal', marketplace: 'trendyol', sellerId: '108452' },
  { id: '62610a67-3f0f-4780-9afb-405e251f9640', name: 'HepsiBurada Davye Medikal', marketplace: 'hepsiburada', sellerId: '867a6d46-c62e-4f21-beb1-50225bd14205' },
];

const safeStorage = {
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(name, value);
    }
  },
  removeItem: (name: string) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(name);
    }
  },
};

export const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
      companyId: '11111111-1111-1111-1111-111111111111',
      companyName: 'Akbulut Ticaret A.Ş.',
      activeStoreId: 'all',
      activeStore: defaultStores[0],
      availableStores: defaultStores,
      userRole: 'admin',
      permissions: {
        can_view_profit: true,
        can_edit_costs: true,
        can_update_prices: true,
        can_export_reports: true,
        allowed_modules: ['all'],
      },
      setActiveStoreId: (storeId: string) => {
        const store = get().availableStores.find((s) => s.id === storeId) || 
                      defaultStores.find((s) => s.id === storeId) || 
                      get().availableStores[0] || 
                      defaultStores[0];
        set({
          activeStoreId: store.id,
          activeStore: store,
        });
      },
      setSessionData: (data: any) => {
        if (!data || !data.user) return;
        const stores: StoreInfo[] = [
          { id: 'all', name: '🏪 Tüm Mağazalar (Tümü)', marketplace: 'all', sellerId: 'all' },
          ...(data.stores || []).map((s: any) => ({
            id: s.id,
            name: s.name || s.storeName,
            marketplace: s.marketplace || 'trendyol',
            sellerId: s.sellerId || s.id,
          }))
        ];
        const active = stores.find(s => s.id === get().activeStoreId) || stores[0];
        set({
          companyId: data.user.companyId || '11111111-1111-1111-1111-111111111111',
          companyName: data.user.companyName || 'Akbulut Ticaret A.Ş.',
          userRole: data.user.role || 'admin',
          availableStores: stores,
          activeStore: active,
          activeStoreId: active.id,
        });
      },
      loadStoresFromAPI: async () => {
        try {
          const res = await fetch('/api/stores');
          if (!res.ok) return;
          const data = await res.json();
          if (data.stores && Array.isArray(data.stores) && data.stores.length > 0) {
            const apiStores: StoreInfo[] = [
              { id: 'all', name: '🏪 Tüm Mağazalar (Tümü)', marketplace: 'all', sellerId: 'all' },
              ...data.stores.map((s: any) => ({
                id: s.id,
                name: s.storeName || (s.marketplace === 'hepsiburada' ? 'HepsiBurada Davye Medikal' : 'Trendyol Davye Medikal'),
                marketplace: s.marketplace as any,
                sellerId: s.sellerId || s.id,
              }))
            ];
            const currentActiveId = get().activeStoreId;
            const currentActive = apiStores.find(s => s.id === currentActiveId) || apiStores[0];
            set({
              availableStores: apiStores,
              activeStore: currentActive,
              activeStoreId: currentActive.id,
            });
          }
        } catch (err) {
          console.error('Failed to load stores from API:', err);
        }
      },
    }),
    {
      name: 'dvt_tenant_store',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
