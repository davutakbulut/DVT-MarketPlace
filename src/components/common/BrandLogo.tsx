"use client";
import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showBadge?: boolean;
  showSlogan?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function BrandLogo({
  size = 'md',
  showText = true,
  showBadge = true,
  showSlogan = false,
  href = '/dashboard',
  onClick,
  className = '',
}: BrandLogoProps) {
  const iconDimensions = {
    sm: 'w-7 h-7 text-xs rounded-xl',
    md: 'w-9 h-9 text-sm rounded-2xl',
    lg: 'w-12 h-12 text-base rounded-2xl shadow-md',
    xl: 'w-16 h-16 text-xl rounded-3xl shadow-lg',
  }[size];

  const titleSize = {
    sm: 'text-xs',
    md: 'text-sm sm:text-base',
    lg: 'text-lg',
    xl: 'text-2xl',
  }[size];

  const content = (
    <div className={`flex items-center gap-2 sm:gap-2.5 select-none shrink-0 ${className}`}>
      {/* SVG Monogram Dynamic Logo Badge */}
      <div className={`${iconDimensions} bg-gradient-to-tr from-primary via-[#FF5722] to-[#D83A14] flex items-center justify-center text-white shadow-xs shrink-0 font-black relative overflow-hidden group`}>
        <svg viewBox="0 0 100 100" className="w-5/6 h-5/6 fill-none stroke-white stroke-[9] stroke-linecap-round stroke-linejoin-round">
          <path d="M22 75 L40 55 L58 64 L78 30" />
          <path d="M62 30 L78 30 L78 46" />
          <circle cx="22" cy="75" r="4" fill="white" />
          <circle cx="40" cy="55" r="4" fill="white" />
          <circle cx="58" cy="64" r="4" fill="white" />
          <circle cx="78" cy="30" r="5" fill="white" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col justify-center shrink-0">
          <div className="flex items-center gap-1.5 leading-none whitespace-nowrap">
            <span className={`font-black tracking-tight text-dark ${titleSize} whitespace-nowrap inline-flex items-center`}>
              DVT<span className="text-primary ml-1">MarketPlace</span>
            </span>
            {showBadge && (
              <span className="bg-[#FFEDE7] text-primary text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none tracking-wide shrink-0 border border-primary/20 uppercase">
                PRO
              </span>
            )}
          </div>
          {showSlogan && (
            <span className="text-[10px] text-muted-foreground font-semibold tracking-tight mt-1 whitespace-nowrap">
              Finans & Kârlılık Zekası
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="hover:opacity-95 transition-opacity inline-flex items-center shrink-0 text-left cursor-pointer">
        {content}
      </button>
    );
  }

  if (href) {
    return (
      <Link href={href} className="hover:opacity-95 transition-opacity inline-flex items-center shrink-0">
        {content}
      </Link>
    );
  }

  return content;
}
