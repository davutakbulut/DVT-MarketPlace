"use client";
import React, { useState } from 'react';
import { SuperAdminSidebar } from '@/components/super-admin/SuperAdminSidebar';
import { SuperAdminHeader } from '@/components/super-admin/SuperAdminHeader';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from 'sonner';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#070A11] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
        <SuperAdminSidebar
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />

        <div className="flex-1 flex flex-col lg:pl-[270px] transition-all duration-300">
          <SuperAdminHeader onMobileMenuToggle={() => setMobileMenuOpen(true)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>

        <Toaster position="top-right" theme="dark" richColors />
      </div>
    </AuthProvider>
  );
}
