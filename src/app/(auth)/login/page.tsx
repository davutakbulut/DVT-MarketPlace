"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Lock, Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { BrandLogo } from '@/components/common/BrandLogo';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // Restore remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('dvt_remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (rememberMe) {
        localStorage.setItem('dvt_remember_email', email);
      } else {
        localStorage.removeItem('dvt_remember_email');
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
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
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Top Floating Return to Home Button */}
      <Link 
        href="/" 
        className="absolute top-4 sm:top-6 left-4 sm:left-6 z-20 inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-border text-xs font-bold text-dark hover:text-primary hover:bg-white shadow-xs transition-all"
      >
        <ArrowLeft className="w-4 h-4 text-primary" />
        <span>Anasayfaya Dön</span>
      </Link>

      {/* Background Decorative Rings */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-xl space-y-6 animate-in fade-in zoom-in-95 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <BrandLogo size="lg" showBadge={true} showSlogan={false} href="/" />
          <p className="text-xs text-muted-foreground font-medium pt-1">
            Akıllı Pazaryeri Finansal Yönetim & Kârlılık Zekası
          </p>
        </div>

        {/* Login Form */}
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
            <label className="text-xs font-bold text-dark block mb-1">Şifre</label>
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

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none text-gray-600 hover:text-dark font-medium">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
              />
              <span>Beni Hatırla</span>
            </label>

            <Link
              href={email ? `/forgot-password?email=${encodeURIComponent(email)}` : "/forgot-password"}
              className="text-[11px] font-semibold text-primary hover:underline"
            >
              Şifremi Unuttum?
            </Link>
          </div>

          <Button type="submit" disabled={loading} className="w-full h-11 rounded-2xl text-xs font-bold gap-2 bg-primary hover:bg-primary-hover text-white shadow-xs">
            <span>{loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        {/* Register CTA */}
        <div className="text-center pt-2 border-t border-border">
          <p className="text-xs text-gray-500">
            Hesabınız yok mu?{' '}
            <Link href="/register" className="text-primary font-bold hover:underline">
              Ücretsiz Kayıt Olun
            </Link>
          </p>
        </div>

        {/* Feature Pillars */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/80 text-[10px] text-gray-500 text-center font-bold">
          <div className="p-1.5 rounded-xl bg-canvas">⚡ Ters Fiyatlama</div>
          <div className="p-1.5 rounded-xl bg-canvas">🚚 Barem Desteği</div>
          <div className="p-1.5 rounded-xl bg-canvas">📊 Canlı Net Kâr</div>
        </div>
      </div>
    </div>
  );
}
