"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useDateStore } from '@/store/useDateStore';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DateRangePicker({ isMobileRow = false }: { isMobileRow?: boolean }) {
  const { period, startDate, endDate, label, setPreset, setCustomRange } = useDateStore();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(7); // 0-indexed: 7 = August

  // Interactive selection states
  const [rangeStart, setRangeStart] = useState<string | null>(startDate);
  const [rangeEnd, setRangeEnd] = useState<string | null>(endDate);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync state when store updates
  useEffect(() => {
    setRangeStart(startDate);
    setRangeEnd(endDate);
  }, [startDate, endDate]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const monthNames = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Generate days in month grid (Monday first)
  const getDaysInMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    let startingDayOfWeek = firstDay.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const days: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];

    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDay = prevMonthLastDay - i;
      const prevMonthIdx = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const mStr = String(prevMonthIdx + 1).padStart(2, '0');
      const dStr = String(prevDay).padStart(2, '0');
      days.push({
        day: prevDay,
        dateStr: `${prevYear}-${mStr}-${dStr}`,
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(i).padStart(2, '0');
      days.push({
        day: i,
        dateStr: `${year}-${mStr}-${dStr}`,
        isCurrentMonth: true,
      });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextMonthIdx = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const mStr = String(nextMonthIdx + 1).padStart(2, '0');
      const dStr = String(i).padStart(2, '0');
      days.push({
        day: i,
        dateStr: `${nextYear}-${mStr}-${dStr}`,
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const days = getDaysInMonth(currentYear, currentMonth);

  const handleDayClick = (dateStr: string) => {
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(dateStr);
      setRangeEnd(null);
    } else {
      let start = rangeStart;
      let end = dateStr;
      if (new Date(start) > new Date(end)) {
        [start, end] = [end, start];
      }
      setRangeStart(start);
      setRangeEnd(end);
      setCustomRange(start, end);
      setIsOpen(false);
    }
  };

  const isSelectedStart = (dateStr: string) => rangeStart === dateStr;
  const isSelectedEnd = (dateStr: string) => rangeEnd === dateStr;

  const isInRange = (dateStr: string) => {
    if (rangeStart && rangeEnd) {
      return dateStr > rangeStart && dateStr < rangeEnd;
    }
    if (rangeStart && !rangeEnd && hoveredDate) {
      const start = rangeStart;
      const end = hoveredDate;
      if (start <= end) {
        return dateStr > start && dateStr < end;
      } else {
        return dateStr > end && dateStr < start;
      }
    }
    return false;
  };

  const isHoveredTarget = (dateStr: string) => {
    return rangeStart && !rangeEnd && hoveredDate === dateStr && dateStr !== rangeStart;
  };

  const formatDisplayRange = (s: string, e: string) => {
    const formatD = (str: string) => {
      const parts = str.split('-');
      if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
      return str;
    };
    return `${formatD(s)} - ${formatD(e)}`;
  };

  const formatShortDisplayRange = (s: string, e: string) => {
    const formatShort = (str: string) => {
      const parts = str.split('-');
      if (parts.length === 3) return `${parts[2]}.${parts[1]}`;
      return str;
    };
    return `${formatShort(s)} - ${formatShort(e)}`;
  };

  return (
    <div className={`relative ${isMobileRow ? 'w-full flex items-center gap-2' : 'flex items-center gap-1.5 sm:gap-2 shrink-0'}`} ref={containerRef}>
      {/* 1. Quick Preset Dropdown Pill (Visible on xl+ or on dedicated Mobile row) */}
      <div className={`relative ${isMobileRow ? 'w-1/2' : 'hidden xl:block'}`}>
        <select
          value={period === 'custom' ? 'custom' : period}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'custom') {
              setIsOpen(true);
            } else {
              setPreset(val);
            }
          }}
          className={`h-8 sm:h-9 pl-3 pr-7 rounded-2xl border border-border bg-white text-xs font-bold text-dark shadow-2xs focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer appearance-none ${isMobileRow ? 'w-full' : ''}`}
        >
          <option value="last_7_days">Son 7 Gün</option>
          <option value="today">Bugün</option>
          <option value="yesterday">Dün</option>
          <option value="last_15_days">Son 15 Gün</option>
          <option value="last_30_days">Son 30 Gün</option>
          <option value="this_month">Bu Ay (Ağustos)</option>
          <option value="last_month">Geçen Ay (Temmuz)</option>
          <option value="all">Tüm Dönem (4 Ay)</option>
          <option value="custom">Özel Aralık...</option>
        </select>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 sm:top-3 pointer-events-none rotate-90" />
      </div>

      {/* 2. Interactive Date Range Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`h-8 sm:h-9 px-2.5 sm:px-3 rounded-2xl bg-dark hover:bg-dark/90 text-white font-bold text-xs flex items-center justify-center gap-1.5 sm:gap-2 shadow-xs transition-colors cursor-pointer shrink-0 ${isMobileRow ? 'w-1/2' : ''}`}
        title="Tarih Aralığı Seç"
      >
        <CalendarIcon className="w-3.5 h-3.5 text-primary shrink-0" />
        {isMobileRow ? (
          <span className="tabular-nums font-semibold text-[11px] sm:text-xs">{formatShortDisplayRange(startDate, endDate)}</span>
        ) : (
          <>
            <span className="hidden xl:inline tabular-nums font-semibold text-xs">{formatDisplayRange(startDate, endDate)}</span>
            <span className="xl:hidden tabular-nums font-semibold text-[11px]">{formatShortDisplayRange(startDate, endDate)}</span>
          </>
        )}
      </button>

      {/* 3. POPUP CALENDAR MODAL / DROPDOWN */}
      {isOpen && (
        <div className={`absolute ${isMobileRow ? 'left-0 right-0 top-11 mx-auto max-w-xs' : 'right-0 top-11 sm:top-12'} z-50 w-72 sm:w-80 bg-white rounded-3xl border border-border shadow-2xl p-4 animate-in fade-in zoom-in-95 space-y-3`}>
          {/* Calendar Header: < Month Year > */}
          <div className="flex items-center justify-between px-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-canvas text-dark transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 font-black text-sm text-dark">
              <span>{monthNames[currentMonth]}</span>
              <span>{currentYear}</span>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-canvas text-dark transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 text-center text-[11px] font-bold text-gray-400 py-1 border-b border-border/40">
            <span>Pzt</span>
            <span>Sal</span>
            <span>Çar</span>
            <span>Per</span>
            <span>Cum</span>
            <span>Cmt</span>
            <span>Paz</span>
          </div>

          {/* Days Grid with Range Hover Highlight */}
          <div className="grid grid-cols-7 gap-y-1 text-center text-xs select-none">
            {days.map((item, idx) => {
              const isStart = isSelectedStart(item.dateStr);
              const isEnd = isSelectedEnd(item.dateStr);
              const inRange = isInRange(item.dateStr);
              const isHovered = isHoveredTarget(item.dateStr);

              let containerClasses = "relative h-9 flex items-center justify-center cursor-pointer transition-all";
              let pillClasses = "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-transform";

              if (inRange) {
                containerClasses += " bg-[#FFEDE7]";
              } else if (isStart && (rangeEnd || hoveredDate)) {
                containerClasses += " bg-gradient-to-r from-transparent to-[#FFEDE7]";
              } else if ((isEnd || isHovered) && rangeStart) {
                containerClasses += " bg-gradient-to-l from-transparent to-[#FFEDE7]";
              }

              if (isStart || isEnd || isHovered) {
                pillClasses += " bg-primary text-white shadow-xs scale-105 z-10";
              } else if (inRange) {
                pillClasses += " text-primary font-black";
              } else if (item.isCurrentMonth) {
                pillClasses += " text-dark hover:bg-canvas";
              } else {
                pillClasses += " text-gray-300 hover:bg-canvas/50";
              }

              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(item.dateStr)}
                  onMouseEnter={() => rangeStart && !rangeEnd && setHoveredDate(item.dateStr)}
                  className={containerClasses}
                >
                  <div className={pillClasses}>
                    {item.day}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Selection Hint & Action */}
          <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-gray-500">
            <span>
              {rangeStart && !rangeEnd ? "Bitiş tarihini seçin..." : "Aralık seçildi"}
            </span>

            <Button
              size="sm"
              onClick={() => {
                if (rangeStart && rangeEnd) {
                  setCustomRange(rangeStart, rangeEnd);
                }
                setIsOpen(false);
              }}
              className="h-7 px-3 text-[11px] font-bold bg-primary text-white hover:bg-primary-hover rounded-xl shadow-2xs cursor-pointer"
            >
              Tamam
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
