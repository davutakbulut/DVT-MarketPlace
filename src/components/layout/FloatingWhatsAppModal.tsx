"use client";
import React, { useState, useEffect } from "react";
import { 
  MessageCircle, X, Phone, Mail, MapPin, ExternalLink, 
  Copy, Check, Send, Sparkles, ShieldCheck, Clock
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function FloatingWhatsAppModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const phoneNumberFormatted = "0 537 882 68 58";
  const phoneNumberRaw = "905378826858";
  const email = "bilgi@davutakbulut.co";
  const address = "Molla Gürani, Uygar Sokağı No:17/A, Fatih/İstanbul";

  const handleCopyPhone = () => {
    navigator.clipboard.writeText("05378826858");
    setCopied(true);
    toast.success("Telefon numarası kopyalandı: 0 537 882 68 58");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartWhatsAppChat = () => {
    const text = encodeURIComponent("Merhaba Davut Bey, DVT-MarketPlace finansal yönetim paneli hakkında görüşmek istiyorum.");
    const url = `https://wa.me/${phoneNumberRaw}?text=${text}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Close with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <aside aria-label="WhatsApp Destek Paneli" className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-90 select-none">
      {/* 1. FLOATING CHAT CARD MODAL */}
      {isOpen && (
        <div 
          role="dialog"
          aria-label="WhatsApp Canlı Destek Modalı"
          className="absolute bottom-16 sm:bottom-20 right-0 w-[calc(100vw-2.5rem)] sm:w-96 bg-white rounded-3xl shadow-2xl border border-border/80 overflow-hidden animate-in zoom-in-95 fade-in duration-200"
        >
          {/* Header Banner (WhatsApp Signature Gradient) */}
          <div className="bg-gradient-to-r from-[#075E54] to-[#128C7E] p-4 text-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-sm border border-white/30 text-white">
                  DA
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#075E54] rounded-full animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  <span>Davut Akbulut Destek</span>
                  <Badge className="bg-emerald-500/30 text-emerald-200 text-[9px] py-0 px-1 border-0">
                    Çevrimiçi
                  </Badge>
                </h3>
                <span className="text-[11px] text-emerald-100 flex items-center gap-1 mt-0.5 opacity-90">
                  <Clock className="w-3 h-3" /> Genellikle 5 dk içinde yanıtlar
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-5 space-y-4 bg-canvas/30">
            {/* WhatsApp Speech Bubble */}
            <div className="bg-white p-3.5 rounded-2xl rounded-tl-xs shadow-xs border border-border/60 text-xs text-dark space-y-1.5 relative">
              <p className="leading-relaxed font-medium">
                👋 Merhaba! <strong>DVT-MarketPlace</strong> platformu, entegrasyonlar veya finansal analizleriniz ile ilgili her türlü sorunuz için doğrudan WhatsApp üzerinden bize yazabilirsiniz.
              </p>
              <span className="text-[10px] text-gray-400 block text-right font-mono">Bugün • Canlı</span>
            </div>

            {/* Official Contact Info Card */}
            <div className="bg-white p-3.5 rounded-2xl border border-border shadow-xs space-y-2.5 text-xs">
              {/* Phone */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-dark font-bold min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-mono text-xs truncate">{phoneNumberFormatted}</span>
                </div>
                <button
                  onClick={handleCopyPhone}
                  className="p-1.5 rounded-lg hover:bg-canvas text-gray-500 hover:text-primary transition-colors cursor-pointer shrink-0"
                  title="Numarayı Kopyala"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Email */}
              <div className="flex items-center gap-2 text-dark font-medium border-t border-border/60 pt-2">
                <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <a href={`mailto:${email}`} className="text-xs text-gray-700 hover:text-primary transition-colors truncate">
                  {email}
                </a>
              </div>

              {/* Address */}
              <div className="flex items-start gap-2 text-dark font-medium border-t border-border/60 pt-2">
                <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] text-gray-600 leading-snug">
                  {address}
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleStartWhatsAppChat}
                className="w-full h-10 px-4 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer transform active:scale-98"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>WhatsApp ile Sohbete Başla</span>
                <Send className="w-3.5 h-3.5 ml-0.5" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href="tel:05378826858"
                  className="h-8 rounded-xl bg-white hover:bg-canvas border border-border text-dark text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <span>Hemen Ara</span>
                </a>

                <button
                  onClick={handleCopyPhone}
                  className="h-8 rounded-xl bg-white hover:bg-canvas border border-border text-dark text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
                  <span>{copied ? "Kopyalandı!" : "No Kopyala"}</span>
                </button>
              </div>
            </div>

          </div>

          {/* Footer note */}
          <div className="px-4 py-2.5 bg-canvas/80 border-t border-border/60 text-[10px] text-gray-500 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>7/24 Kesintisiz Pazaryeri & Finans Desteği</span>
          </div>
        </div>
      )}

      {/* 2. FLOATING TRIGGER BUBBLE (Sağda Yüzen Yeşil WhatsApp Butonu) */}
      <div className="relative group">
        {/* Pulse Glow Ring when closed */}
        {!isOpen && (
          <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-40 animate-ping pointer-events-none" />
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 transform active:scale-95 cursor-pointer ${
            isOpen 
              ? "bg-dark hover:bg-black rotate-90" 
              : "bg-[#25D366] hover:bg-[#1EBE5D] hover:scale-105"
          }`}
          aria-label="WhatsApp Destek"
          title="WhatsApp Destek Hattı (0 537 882 68 58)"
        >
          {isOpen ? (
            <X className="w-6 h-6 transition-transform" />
          ) : (
            <div className="relative">
              <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 fill-white" />
              {/* Online Green Badge */}
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-300 border-2 border-[#25D366] rounded-full" />
            </div>
          )}
        </button>

        {/* Hover Tooltip when closed */}
        {!isOpen && (
          <div className="hidden sm:group-hover:flex absolute right-16 top-1/2 -translate-y-1/2 bg-dark text-white px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap items-center gap-1.5 shadow-lg animate-in fade-in slide-in-from-right-2 duration-150 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>WhatsApp Destek (0 537 882 68 58)</span>
          </div>
        )}
      </div>
    </aside>
  );
}
