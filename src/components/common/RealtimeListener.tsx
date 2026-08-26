"use client";

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Synthesizes a subtle, pleasant notification chime using browser Web Audio API.
 * No external MP3 file or audio asset download required.
 */
function playOrderChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    const now = ctx.currentTime;
    // Pleasant dual chime chord: D5 (587.33Hz) -> A5 (880.00Hz)
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.12);

    osc2.frequency.setValueAtTime(783.99, now); // G5
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.12); // D6

    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  } catch {
    // Audio Context might be restricted before first user interaction
  }
}

export function RealtimeListener() {
  const queryClient = useQueryClient();
  const lastCheckTimeRef = useRef<string>(new Date().toISOString());
  const seenOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef<boolean>(true);

  // FAST REALTIME LIVE-SYNC POLLING (Every 5 seconds)
  useEffect(() => {
    let isMounted = true;

    const pollLiveSync = async () => {
      try {
        const sinceParam = encodeURIComponent(lastCheckTimeRef.current);
        const res = await fetch(`/api/system/live-sync-poll?since=${sinceParam}`);
        if (!res.ok) return;

        const data = await res.json();
        if (!data.success || !isMounted) return;

        if (data.serverTime) {
          lastCheckTimeRef.current = data.serverTime;
        }

        // On very first baseline load, seed the existing IDs to avoid alert spamming
        if (isInitialLoadRef.current) {
          if (data.latestOrder?.id) {
            seenOrderIdsRef.current.add(data.latestOrder.id);
          }
          isInitialLoadRef.current = false;
          return;
        }

        // If new orders are returned
        if (Array.isArray(data.newOrders) && data.newOrders.length > 0) {
          for (const order of data.newOrders) {
            if (!seenOrderIdsRef.current.has(order.id)) {
              seenOrderIdsRef.current.add(order.id);

              // Play pleasant audio chime
              playOrderChime();

              // Trigger interactive top-right Toast notification
              const formattedAmount = Number(order.paidAmount || order.grossAmount || 0).toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });

              toast.success(`🛍️ Yeni Sipariş Alındı! #${order.orderNumber || order.id.slice(0, 8)}`, {
                description: `${order.customerName || 'Trendyol Müşterisi'} • ₺${formattedAmount} (${order.totalItems || 1} Kalem Ürün)`,
                duration: 8000,
                action: {
                  label: 'Siparişi Gör',
                  onClick: () => {
                    window.location.href = `/live-analysis?search=${order.orderNumber || ''}`;
                  },
                },
              });

              // Dispatch window event so components can listen
              window.dispatchEvent(
                new CustomEvent('dvt:new-order-received', { detail: order })
              );

              // Invalidate React Query caches
              queryClient.invalidateQueries({ queryKey: ['orders'] });
              queryClient.invalidateQueries({ queryKey: ['dashboard'] });
              queryClient.invalidateQueries({ queryKey: ['live-analysis'] });
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
              queryClient.invalidateQueries({ queryKey: ['financial-rollups'] });
            }
          }
        }
      } catch {
        // Silent poll error
      }
    };

    // Initial check
    pollLiveSync();

    // High frequency 5-second interval for instant new order detection
    const interval = setInterval(pollLiveSync, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [queryClient]);

  return null;
}
