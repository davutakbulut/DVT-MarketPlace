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
}

const mockStores: StoreInfo[] = [
  { id: 'store-1', name: 'Trendyol Ana Mağaza', marketplace: 'trendyol', sellerId: '108452' },
  { id: 'store-2', name: 'Trendyol Kozmetik', marketplace: 'trendyol', sellerId: '209314' },
  { id: 'store-3', name: 'Hepsiburada Mağazası', marketplace: 'hepsiburada', sellerId: 'HB-9941' },
];

export const useTenantStore = create<TenantState>((set) => ({
  companyId: 'company-1',
  companyName: 'Akbulut Ticaret A.Ş.',
  activeStoreId: 'store-1',
  activeStore: mockStores[0],
  availableStores: mockStores,
  userRole: 'admin',
  permissions: {
    can_view_profit: true,
    can_edit_costs: true,
    can_update_prices: true,
    can_export_reports: true,
    allowed_modules: ['dashboard', 'live_analysis', 'product_pricing', 'reports', 'tariffs', 'settlements', 'alerts', 'settings'],
  },
  setActiveStoreId: (storeId) =>
    set((state) => ({
      activeStoreId: storeId,
      activeStore: state.availableStores.find((s) => s.id === storeId) || state.availableStores[0],
    })),
}));
