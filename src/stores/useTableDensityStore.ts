import { create } from 'zustand';

interface TableDensityState {
  zoomLevel: 85 | 90 | 100;
  isExpanded: boolean;
  setZoomLevel: (zoom: 85 | 90 | 100) => void;
  toggleExpanded: () => void;
}

export const useTableDensityStore = create<TableDensityState>((set) => ({
  zoomLevel: 100,
  isExpanded: false,
  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),
  toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),
}));
