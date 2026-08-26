"use client";
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface DateRangeState {
  period: string; // 'last_7_days' | 'today' | 'yesterday' | 'last_15_days' | 'last_30_days' | 'this_month' | 'last_month' | 'all' | 'custom'
  startDate: string; // 'YYYY-MM-DD'
  endDate: string; // 'YYYY-MM-DD'
  label: string; // Formatted label for display, e.g. "Bugün (27.08.2026)"
  setPreset: (preset: string) => void;
  setCustomRange: (startDate: string, endDate: string) => void;
}

function getTodayString(): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Istanbul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(now); // "YYYY-MM-DD"
  } catch {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  }
}

export function getPresetConfig(preset: string): { start: string; end: string; label: string } {
  const today = getTodayString();
  const [yStr, mStr, dStr] = today.split('-');
  const y = parseInt(yStr);
  const m = parseInt(mStr) - 1;
  const d = parseInt(dStr);

  const formatD = (str: string) => {
    const parts = str.split('-');
    if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    return str;
  };

  const monthNames = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  if (preset === 'today') {
    return { start: today, end: today, label: `Bugün (${formatD(today)})` };
  }

  if (preset === 'yesterday') {
    const yestDate = new Date(y, m, d - 1);
    const yestStr = `${yestDate.getFullYear()}-${String(yestDate.getMonth() + 1).padStart(2, '0')}-${String(yestDate.getDate()).padStart(2, '0')}`;
    return { start: yestStr, end: yestStr, label: `Dün (${formatD(yestStr)})` };
  }

  if (preset === 'last_7_days') {
    const d7 = new Date(y, m, d - 6);
    const d7Str = `${d7.getFullYear()}-${String(d7.getMonth() + 1).padStart(2, '0')}-${String(d7.getDate()).padStart(2, '0')}`;
    return { start: d7Str, end: today, label: 'Son 7 Gün' };
  }

  if (preset === 'last_15_days') {
    const d15 = new Date(y, m, d - 14);
    const d15Str = `${d15.getFullYear()}-${String(d15.getMonth() + 1).padStart(2, '0')}-${String(d15.getDate()).padStart(2, '0')}`;
    return { start: d15Str, end: today, label: 'Son 15 Gün' };
  }

  if (preset === 'last_30_days') {
    const d30 = new Date(y, m, d - 29);
    const d30Str = `${d30.getFullYear()}-${String(d30.getMonth() + 1).padStart(2, '0')}-${String(d30.getDate()).padStart(2, '0')}`;
    return { start: d30Str, end: today, label: 'Son 30 Gün' };
  }

  if (preset === 'this_month') {
    const startM = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const endM = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { start: startM, end: endM, label: `Bu Ay (${monthNames[m]} ${y})` };
  }

  if (preset === 'last_month') {
    const prevDate = new Date(y, m - 1, 1);
    const prevY = prevDate.getFullYear();
    const prevM = prevDate.getMonth();
    const startM = `${prevY}-${String(prevM + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(prevY, prevM + 1, 0).getDate();
    const endM = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { start: startM, end: endM, label: `Geçen Ay (${monthNames[prevM]} ${prevY})` };
  }

  if (preset === 'all') {
    return { start: '2025-01-01', end: today, label: 'Tüm Dönem' };
  }

  const def = getPresetConfig('last_7_days');
  return { start: def.start, end: def.end, label: def.label };
}

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

  const def = getPresetConfig('last_7_days');
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
        const config = getPresetConfig(preset);
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
