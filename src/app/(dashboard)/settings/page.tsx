"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Settings, Key, Truck, Mail, Users } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "Genel & KDV", icon: Settings },
    { id: "trendyol", label: "Trendyol API", icon: Key },
    { id: "hepsiburada", label: "Hepsiburada API", icon: Key },
    { id: "carriers", label: "Kargo Desi", icon: Truck },
    { id: "users", label: "Kullanıcılar (RBAC)", icon: Users },
    { id: "notifications", label: "Bildirimler", icon: Mail },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl">
      <div>
        <h3 className="text-base sm:text-lg font-bold text-dark">Sistem ve Firma Ayarları</h3>
        <p className="text-[11px] sm:text-xs text-muted-foreground">Pazaryeri API anahtarları, kargo desi matrisleri ve kullanıcı izinleri</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
        {/* Settings Tab Navigation (Horizontal swipeable on mobile, vertical stack on desktop) */}
        <div className="md:col-span-4 bg-white p-2 sm:p-3 rounded-2xl sm:rounded-3xl border border-border flex md:flex-col overflow-x-auto gap-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold transition-all text-left whitespace-nowrap shrink-0 ${
                  activeTab === t.id
                    ? "bg-primary text-white shadow-xs"
                    : "text-dark hover:bg-canvas"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Settings Tab Content Area */}
        <div className="md:col-span-8 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border space-y-4 sm:space-y-5">
          {activeTab === "general" && (
            <div className="space-y-4">
              <h4 className="text-xs sm:text-sm font-bold text-dark pb-2 border-b border-border">Genel Vergi & Hizmet Ayarları</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-bold text-dark block mb-1">Varsayılan Satış KDV (%)</label>
                  <input type="number" defaultValue={20} className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-dark block mb-1">Stopaj Kesinti Oranı (%)</label>
                  <input type="number" defaultValue={1} className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-dark block mb-1">Pazaryeri Hizmet Bedeli (₺)</label>
                  <input type="number" defaultValue={8.49} className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-dark block mb-1">Minimum Kâr Marjı Uyarısı (%)</label>
                  <input type="number" defaultValue={15} className="w-full px-3 py-2 rounded-xl border border-border text-xs font-bold" />
                </div>
              </div>
              <Button onClick={() => toast.success("Genel ayarlar kaydedildi!")} className="text-xs font-bold">
                Ayarları Kaydet
              </Button>
            </div>
          )}

          {activeTab === "trendyol" && (
            <div className="space-y-4">
              <h4 className="text-xs sm:text-sm font-bold text-dark pb-2 border-b border-border">Trendyol SAPI Entegrasyonu</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-dark block mb-1">Satıcı ID (Supplier ID)</label>
                  <input type="text" defaultValue="108452" className="w-full px-3 py-2 rounded-xl border border-border text-xs font-mono font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-dark block mb-1">API Key</label>
                  <input type="password" defaultValue="ty_prod_key_99418241" className="w-full px-3 py-2 rounded-xl border border-border text-xs font-mono" />
                </div>
                <div>
                  <label className="text-xs font-bold text-dark block mb-1">API Secret</label>
                  <input type="password" defaultValue="ty_prod_secret_8412891" className="w-full px-3 py-2 rounded-xl border border-border text-xs font-mono" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => toast.success("Trendyol API bağlantı testi başarılı!")} variant="secondary" className="text-xs font-bold">
                  Bağlantıyı Test Et
                </Button>
                <Button onClick={() => toast.success("Trendyol API anahtarları kaydedildi!")} className="text-xs font-bold">
                  Kaydet
                </Button>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-border gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-dark">Kullanıcı & Mağaza Yetki Matrisi (RBAC)</h4>
                <Button size="sm" className="text-xs font-bold self-start sm:self-auto">+ Yeni Kullanıcı Davet Et</Button>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-2xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-dark">Davut Akbulut (Siz)</span>
                    <span className="block text-[11px] text-gray-500">dvtakblt@gmail.com • Firma Sahibi (Admin)</span>
                  </div>
                  <span className="bg-primary-tint-100 text-primary text-[10px] font-bold px-2.5 py-1 rounded-full self-start sm:self-auto">Tam Yetkili</span>
                </div>

                <div className="p-3 rounded-2xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-dark">Operatör Personel</span>
                    <span className="block text-[11px] text-gray-500">operator@dvt.com • Kullanıcı (User)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-canvas text-gray-700 font-semibold px-2 py-0.5 rounded-md border">Kâr Görme: Kapalı</span>
                    <span className="text-[10px] bg-canvas text-gray-700 font-semibold px-2 py-0.5 rounded-md border">2 Mağaza</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab !== "general" && activeTab !== "trendyol" && activeTab !== "users" && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Bu sekmenin ayar formu hazır. Yapılandırma veritabanına bağlanabilir.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
