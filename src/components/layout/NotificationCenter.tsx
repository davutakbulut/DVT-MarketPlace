"use client";
import React, { useState, useEffect } from 'react';
import { 
  Bell, AlertTriangle, AlertCircle, Info, Check, Sparkles, 
  ExternalLink, CheckCircle2, ShieldAlert, Package, RefreshCw, Send
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  category: 'order' | 'shipping' | 'inventory' | 'crash' | 'system';
  actionUrl?: string;
  isRead: boolean;
  timeAgo: string;
  createdAt: string;
}

export function NotificationCenter() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'shipping' | 'system'>('all');
  const [sendingTest, setSendingTest] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error("Notifications poll error:", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for live notification updates
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success("Tüm bildirimler okundu olarak işaretlendi.");
      }
    } catch (e) {
      toast.error("İşlem başarısız.");
    }
  };

  const handleClickItem = async (item: NotificationItem) => {
    if (!item.isRead) {
      try {
        await fetch('/api/notifications/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.id }),
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (e) {
        console.error(e);
      }
    }

    setOpen(false);
    if (item.actionUrl) {
      router.push(item.actionUrl);
    }
  };

  const handleSendTestNotification = async () => {
    setSendingTest(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '🚨 Test Alarmı: Zararına Satış Tetiklendi',
          message: 'Sipariş #8829103 için kargo ve komisyon maliyetleri satış fiyatını ₺34.50 aşmıştır.',
          type: 'danger',
          category: 'order',
          actionUrl: '/live-analysis',
        }),
      });

      if (res.ok) {
        toast.error("Yeni Bildirim Tetiklendi: Zararına Satış Tespiti!");
        await fetchNotifications();
      }
    } catch (e) {
      toast.error("Test bildirimi oluşturulamadı.");
    } finally {
      setSendingTest(false);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'critical') return n.type === 'danger';
    if (activeTab === 'shipping') return n.category === 'shipping';
    if (activeTab === 'system') return n.category === 'system' || n.category === 'inventory';
    return true;
  });

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-dark hover:bg-canvas transition-colors cursor-pointer"
        title="Bildirim Merkezi"
      >
        <Bell className="w-5 h-5 text-dark" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-black rounded-full ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-border z-60 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[550px]">
            
            {/* Header */}
            <div className="p-4 border-b border-border bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black text-dark flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Akıllı Bildirim Merkezi</span>
                </h4>
                {unreadCount > 0 && (
                  <span className="bg-primary-tint-100 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">
                    {unreadCount} Okunmamış
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    Tümünü Oku
                  </button>
                )}
                <button
                  onClick={fetchNotifications}
                  title="Yenile"
                  className="text-gray-400 hover:text-dark p-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-2 bg-canvas border-b border-border text-[11px] overflow-x-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                  activeTab === 'all' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tümü ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab('critical')}
                className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                  activeTab === 'critical' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                Kritik ({notifications.filter(n => n.type === 'danger').length})
              </button>
              <button
                onClick={() => setActiveTab('shipping')}
                className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                  activeTab === 'shipping' ? 'bg-amber-600 text-white' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                Kargo ({notifications.filter(n => n.category === 'shipping').length})
              </button>
              <button
                onClick={() => setActiveTab('system')}
                className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                  activeTab === 'system' ? 'bg-dark text-white' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                Sistem ({notifications.filter(n => n.category === 'system' || n.category === 'inventory').length})
              </button>
            </div>

            {/* Notification List */}
            <div className="divide-y divide-border/60 overflow-y-auto flex-1 p-1">
              {filteredNotifications.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="font-bold text-dark">Her Şey Yolunda!</p>
                  <p className="text-[11px]">Şu anda aktif bir uyarı veya okunmamış bildirim bulunmuyor.</p>
                </div>
              ) : (
                filteredNotifications.map((item) => {
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleClickItem(item)}
                      className={`p-3 rounded-2xl transition-all cursor-pointer flex gap-3 items-start my-1 ${
                        !item.isRead ? 'bg-primary-tint-50/40 hover:bg-primary-tint-50/70 border border-primary-tint-200/50' : 'hover:bg-canvas'
                      }`}
                    >
                      {item.type === 'danger' && (
                        <div className="w-7 h-7 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      )}
                      {item.type === 'warning' && (
                        <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      )}
                      {item.type === 'info' && (
                        <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Info className="w-4 h-4" />
                        </div>
                      )}
                      {item.type === 'success' && (
                        <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs truncate ${!item.isRead ? 'font-black text-dark' : 'font-semibold text-gray-700'}`}>
                            {item.title}
                          </span>
                          <span className="text-[10px] text-gray-400 shrink-0 font-medium">{item.timeAgo}</span>
                        </div>
                        <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed line-clamp-2">
                          {item.desc}
                        </p>
                        {item.actionUrl && (
                          <div className="flex items-center gap-1 text-[10px] text-primary font-bold mt-1.5 hover:underline">
                            <span>İncele ve Aksiyon Al</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-canvas border-t border-border flex items-center justify-between text-xs">
              <button
                onClick={handleSendTestNotification}
                disabled={sendingTest}
                className="text-[11px] font-bold text-gray-600 hover:text-primary flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
                <span>Test Alarmı Tetikle</span>
              </button>

              <button
                onClick={() => { setOpen(false); router.push('/alerts'); }}
                className="text-[11px] font-black text-primary hover:underline flex items-center gap-1"
              >
                <span>Tüm Uyarılar Sayfası ➔</span>
              </button>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
