"use client";

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function RealtimeListener() {
  const queryClient = useQueryClient();

  useEffect(() => {
    try {
      const supabase = createClient();

      // Subscribe to real-time changes on orders
      const ordersChannel = supabase
        .channel('realtime-orders-changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders' },
          (payload: any) => {
            const newOrder = payload.new;
            if (newOrder) {
              const amount = Number(newOrder.paid_amount || 0).toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
              toast.success(`🎉 Yeni Sipariş Düştü: #${newOrder.marketplace_order_number || newOrder.id}`, {
                description: `${newOrder.customer_name || 'Müşteri'} • ₺${amount} (${newOrder.marketplace || 'Trendyol'})`,
                duration: 5000,
              });

              // Invalidate caches so tables and charts update live
              queryClient.invalidateQueries({ queryKey: ['orders'] });
              queryClient.invalidateQueries({ queryKey: ['dashboard'] });
              queryClient.invalidateQueries({ queryKey: ['live-analysis'] });
              queryClient.invalidateQueries({ queryKey: ['financial-rollups'] });
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders' },
          (payload: any) => {
            const updatedOrder = payload.new;
            const oldOrder = payload.old;

            if (updatedOrder && oldOrder && updatedOrder.status !== oldOrder.status) {
              toast.info(`📦 Sipariş Durumu Değişti: #${updatedOrder.marketplace_order_number || updatedOrder.id}`, {
                description: `${oldOrder.status || 'Bilinmiyor'} ➔ ${updatedOrder.status}`,
                duration: 4000,
              });
            }

            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['live-analysis'] });
            queryClient.invalidateQueries({ queryKey: ['returns-cancellations'] });
          }
        )
        .subscribe();

      // Subscribe to real-time notifications
      const notificationsChannel = supabase
        .channel('realtime-notifications-changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'system_notifications' },
          (payload: any) => {
            const notif = payload.new;
            if (notif) {
              if (notif.type === 'warning' || notif.type === 'error') {
                toast.warning(notif.title || 'Sistem Uyarısı', {
                  description: notif.message,
                  duration: 6000,
                });
              }
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(ordersChannel);
        supabase.removeChannel(notificationsChannel);
      };
    } catch (e) {
      console.warn('Supabase Realtime subscription error:', e);
    }
  }, [queryClient]);

  return null;
}
