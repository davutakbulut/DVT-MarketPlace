"use client";
import React, { useState } from 'react';
import { Globe } from 'lucide-react';

const countries = [
  { code: 'TR', name: 'Türkiye' },
  { code: 'AZ', name: 'Azerbaycan' },
  { code: 'SA', name: 'Suudi Arabistan' },
  { code: 'AE', name: 'Birleşik Arap Emirlikleri' },
  { code: 'RO', name: 'Romanya' },
  { code: 'GR', name: 'Yunanistan' },
  { code: 'BG', name: 'Bulgaristan' },
  { code: 'ALL', name: 'Tüm Ülkeler (Mikro İhracat)' },
];

export function CountrySelector() {
  const [selected, setSelected] = useState('TR');

  return (
    <div className="flex items-center gap-2 bg-canvas px-3 py-1.5 rounded-xl border border-border">
      <Globe className="w-4 h-4 text-primary" />
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="bg-transparent text-xs font-medium text-dark focus:outline-none cursor-pointer appearance-none pr-3"
      >
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
