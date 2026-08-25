"use client";
import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

export function DateRangePicker() {
  const [preset, setPreset] = useState('last_7_days');

  return (
    <div className="flex items-center gap-2 bg-canvas px-3 py-1.5 rounded-xl border border-border">
      <Calendar className="w-4 h-4 text-primary" />
      <select
        value={preset}
        onChange={(e) => setPreset(e.target.value)}
        className="bg-transparent text-xs font-semibold text-dark focus:outline-none cursor-pointer appearance-none pr-2"
      >
        <option value="today">Bugün (Canlı)</option>
        <option value="yesterday">Dün</option>
        <option value="this_week">Bu Hafta</option>
        <option value="last_7_days">Son 7 Gün</option>
        <option value="last_15_days">Son 15 Gün</option>
        <option value="last_30_days">Son 30 Gün</option>
        <option value="this_month">Bu Ay (Ağustos 2026)</option>
        <option value="last_month">Geçen Ay</option>
      </select>
    </div>
  );
}
