"use client";
import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { AuthProvider } from '@/lib/auth-context';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { RealtimeListener } from '@/components/common/RealtimeListener';
import { Toaster } from 'sonner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <AuthProvider>
      <QueryProvider>
        <div className="min-h-screen bg-canvas flex flex-col">
          <RealtimeListener />
          <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
          
          <div className="flex-1 flex flex-col lg:pl-[260px] transition-all duration-300">
            <Header onMobileMenuToggle={() => setMobileMenuOpen(true)} />
            <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>

          <Toaster position="top-right" richColors />
        </div>
      </QueryProvider>
    </AuthProvider>
  );
}
