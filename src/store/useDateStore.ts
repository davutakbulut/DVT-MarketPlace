"use client";
import { create } from 'zustand';

export interface DateRangeState {
  period: string; // 'last_7_days' | 'today' | 'yesterday' | 'last_15_days' | 'last_30_days' | 'this_month' | 'last_month' | 'all' | 'custom'
  startDate: string; // 'YYYY-MM-DD'
  endDate: string; // 'YYYY-MM-DD'
  label: string; // Formatted label for display, e.g. "Son 7 Gün"
  setPreset: (preset: string) => void;
  setCustomRange: (startDate: string, endDate: string) => void;
}

const PRESET_MAP: Record<string, { start: string; end: string; label: string }> = {
  last_7_days: { start: '2026-08-19', end: '2026-08-26', label: 'Son 7 Gün' },
  today: { start: '2026-08-26', end: '2026-08-26', label: 'Bugün' },
  yesterday: { start: '2026-08-25', end: '2026-08-25', label: 'Dün' },
  last_15_days: { start: '2026-08-12', end: '2026-08-26', label: 'Son 15 Gün' },
  last_30_days: { start: '2026-07-27', end: '2026-08-26', label: 'Son 30 Gün' },
  this_month: { start: '2026-08-01', end: '2026-08-31', label: 'Bu Ay (Ağustos 2026)' },
  last_month: { start: '2026-07-01', end: '2026-07-31', label: 'Geçen Ay (Temmuz 2026)' },
  all: { start: '2026-05-01', end: '2026-08-31', label: 'Tüm Dönem' },
};

export const useDateStore = create<DateRangeState>((set) => ({
  period: 'last_7_days',
  startDate: '2026-08-19',
  endDate: '2026-08-26',
  label: 'Son 7 Gün',

  setPreset: (preset: string) => {
    const config = PRESET_MAP[preset] || PRESET_MAP.last_7_days;
    set({
      period: preset,
      startDate: config.start,
      endDate: config.end,
      label: config.label,
    });
  },

  setCustomRange: (startDate: string, endDate: string) => {
    // Format label as DD.MM.YYYY - DD.MM.YYYY
    const formatD = (s: string) => {
      const parts = s.split('-');
      if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
      return s;
    };
    const label = `${formatD(startDate)} - ${formatD(endDate)}`;
    set({
      period: 'custom',
      startDate,
      endDate,
      label,
    });
  },
}));
