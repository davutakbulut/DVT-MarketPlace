import { create } from 'zustand';

export interface StoreInfo {
  id: string;
  name: string;
  marketplace: 'trendyol' | 'hepsiburada' | 'amazon_tr';
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
}

const defaultStores: StoreInfo[] = [
  { id: '22222222-2222-2222-2222-222222222221', name: 'Trendyol Ana Mağaza', marketplace: 'trendyol', sellerId: '108452' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Trendyol Kozmetik', marketplace: 'trendyol', sellerId: '209314' },
  { id: '22222222-2222-2222-2222-222222222223', name: 'Hepsiburada Mağazası', marketplace: 'hepsiburada', sellerId: 'HB-9941' },
];

export const useTenantStore = create<TenantState>((set) => ({
  companyId: '11111111-1111-1111-1111-111111111111',
  companyName: 'Akbulut Ticaret A.Ş.',
  activeStoreId: '22222222-2222-2222-2222-222222222221',
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
  setActiveStoreId: (storeId) =>
    set((state) => ({
      activeStoreId: storeId,
      activeStore: state.availableStores.find((s) => s.id === storeId) || state.availableStores[0],
    })),
  setSessionData: (data) =>
    set(() => ({
      companyId: data.user.companyId,
      companyName: data.user.companyName,
      userRole: data.user.role,
      availableStores: data.stores,
      activeStore: data.stores[0] || defaultStores[0],
      activeStoreId: data.stores[0]?.id || defaultStores[0].id,
    })),
}));
