"use client";
import React, { useState } from "react";
import { Calendar, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface DateFilterValue {
  period: string;
  startDate?: string;
  endDate?: string;
}

interface DateRangePickerProps {
  value: DateFilterValue;
  onChange: (val: DateFilterValue) => void;
  className?: string;
}

export function DateRangePicker({ value, onChange, className = "" }: DateRangePickerProps) {
  const [showCustom, setShowCustom] = useState(value.period === "custom");
  const [customStart, setCustomStart] = useState(value.startDate || "2026-05-22");
  const [customEnd, setCustomEnd] = useState(value.endDate || "2026-08-26");

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === "custom") {
      setShowCustom(true);
      onChange({ period: "custom", startDate: customStart, endDate: customEnd });
    } else {
      setShowCustom(false);
      onChange({ period: selected });
    }
  };

  const handleApplyCustom = () => {
    onChange({ period: "custom", startDate: customStart, endDate: customEnd });
  };

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {/* Preset Dropdown */}
      <div className="relative">
        <select
          value={showCustom ? "custom" : value.period || "all"}
          onChange={handlePeriodChange}
          className="pl-8 pr-3 py-1.5 rounded-xl border border-border text-xs font-bold text-dark bg-white focus:ring-2 focus:ring-primary shadow-xs appearance-none cursor-pointer"
        >
          <option value="all">📅 Tüm Dönem (4 Ay: Mayıs - Ağustos 2026)</option>
          <option value="today">Bugün (26 Ağustos 2026)</option>
          <option value="yesterday">Dün (25 Ağustos 2026)</option>
          <option value="thisWeek">Son 7 Gün (19 - 26 Ağustos)</option>
          <option value="2026-08">Ağustos 2026</option>
          <option value="2026-07">Temmuz 2026</option>
          <option value="2026-06">Haziran 2026</option>
          <option value="2026-05">Mayıs 2026</option>
          <option value="last30">Son 30 Gün</option>
          <option value="last60">Son 60 Gün</option>
          <option value="last90">Son 90 Gün</option>
          <option value="custom">⚙️ Özel Tarih Aralığı Seç...</option>
        </select>
        <Calendar className="w-3.5 h-3.5 text-primary absolute left-2.5 top-2.5 pointer-events-none" />
      </div>

      {/* Custom Date Inputs Popup / Row */}
      {showCustom && (
        <div className="flex items-center gap-1.5 bg-canvas p-1 rounded-xl border border-border animate-in fade-in">
          <input
            type="date"
            value={customStart}
            min="2026-05-01"
            max="2026-08-31"
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-2 py-1 rounded-lg border border-border text-[11px] font-bold text-dark bg-white"
          />
          <span className="text-[11px] text-gray-400 font-bold">-</span>
          <input
            type="date"
            value={customEnd}
            min="2026-05-01"
            max="2026-08-31"
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-2 py-1 rounded-lg border border-border text-[11px] font-bold text-dark bg-white"
          />
          <Button
            size="sm"
            onClick={handleApplyCustom}
            className="h-6 text-[10px] font-bold px-2 bg-primary hover:bg-primary-hover text-white rounded-lg"
          >
            Uygula
          </Button>
        </div>
      )}
    </div>
  );
}
