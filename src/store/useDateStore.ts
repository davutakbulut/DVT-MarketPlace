"use client";
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

function getInitialDateState(): { period: string; startDate: string; endDate: string; label: string } {
  if (typeof window !== 'undefined') {
    // 1. Try Cookie
    try {
      const match = document.cookie.match(new RegExp('(^| )dvt_date_state=([^;]+)'));
      if (match && match[2]) {
        const decoded = JSON.parse(decodeURIComponent(match[2]));
        if (decoded?.startDate && decoded?.endDate) {
          return decoded;
        }
      }
    } catch {}

    // 2. Try localStorage
    try {
      const saved = localStorage.getItem('dvt_date_store');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.state?.startDate && parsed?.state?.endDate) {
          return parsed.state;
        }
      }
    } catch {}
  }

  const def = PRESET_MAP.last_7_days;
  return {
    period: 'last_7_days',
    startDate: def.start,
    endDate: def.end,
    label: def.label,
  };
}

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

const initialDate = getInitialDateState();

export const useDateStore = create<DateRangeState>()(
  persist(
    (set) => ({
      period: initialDate.period,
      startDate: initialDate.startDate,
      endDate: initialDate.endDate,
      label: initialDate.label,

      setPreset: (preset: string) => {
        const config = PRESET_MAP[preset] || PRESET_MAP.last_7_days;
        const newState = {
          period: preset,
          startDate: config.start,
          endDate: config.end,
          label: config.label,
        };
        if (typeof window !== 'undefined') {
          document.cookie = `dvt_date_state=${encodeURIComponent(JSON.stringify(newState))}; path=/; max-age=31536000; SameSite=Lax`;
        }
        set(newState);
      },

      setCustomRange: (startDate: string, endDate: string) => {
        const formatD = (s: string) => {
          const parts = s.split('-');
          if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
          return s;
        };
        const label = `${formatD(startDate)} - ${formatD(endDate)}`;
        const newState = {
          period: 'custom',
          startDate,
          endDate,
          label,
        };
        if (typeof window !== 'undefined') {
          document.cookie = `dvt_date_state=${encodeURIComponent(JSON.stringify(newState))}; path=/; max-age=31536000; SameSite=Lax`;
        }
        set(newState);
      },
    }),
    {
      name: 'dvt_date_store',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
