"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('dvtakblt@gmail.com');
  const [password, setPassword] = useState('a');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Giriş başarısız oldu.');
        setLoading(false);
        return;
      }

      toast.success(`Hoş geldiniz, ${data.user.name}!`);
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      toast.error('Bağlantı hatası oluştu.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-border shadow-xl space-y-6 animate-in fade-in zoom-in-95">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary text-white font-black text-xl flex items-center justify-center mx-auto shadow-md">
            D
          </div>
          <h2 className="text-2xl font-black tracking-tight text-dark">DVT-MarketPlace</h2>
          <p className="text-xs text-muted-foreground">Pazaryeri Finansal Analiz & Fiyatlandırma Yönetim Paneli</p>
        </div>

        {/* Demo Credential Reminder Box */}
        <div className="bg-primary-tint-50 border border-primary-tint-200 p-3 rounded-2xl text-xs space-y-1">
          <div className="font-bold text-primary flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Tanımlı Admin Giriş Bilgileri:
          </div>
          <div className="text-gray-700 text-[11px] font-mono">
            E-posta: <strong className="text-dark">dvtakblt@gmail.com</strong>
          </div>
          <div className="text-gray-700 text-[11px] font-mono">
            Şifre: <strong className="text-dark">a</strong>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-dark block mb-1">E-Posta Adresi</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs font-semibold text-dark focus:outline-none focus:ring-2 focus:ring-primary pl-9"
                placeholder="ornek@firma.com"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-dark">Şifre</label>
              <Link href="/forgot-password" className="text-[11px] font-semibold text-primary hover:underline">Şifremi Unuttum</Link>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs font-semibold text-dark focus:outline-none focus:ring-2 focus:ring-primary pl-9 font-mono"
                placeholder="••••••••"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-11 rounded-2xl text-xs font-bold gap-2">
            <span>{loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="pt-4 border-t border-border text-center text-xs text-gray-500">
          Hesabınız yok mu?{' '}
          <Link href="/register" className="font-bold text-primary hover:underline">
            Yeni Firma Kaydı Aç
          </Link>
        </div>
      </div>
    </div>
  );
}
