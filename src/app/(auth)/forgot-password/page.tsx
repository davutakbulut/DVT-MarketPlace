"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, KeyRound, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('dvtakblt@gmail.com');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [receivedCode, setReceivedCode] = useState<string | null>(null);

  // Step 1: Request reset code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'İşlem başarısız.');
        setLoading(false);
        return;
      }

      setReceivedCode(data.code);
      setCode(data.code); // Auto-fill for tester convenience
      toast.success("6 haneli doğrulama kodu oluşturuldu!");
      setStep('reset');
    } catch (e) {
      toast.error("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Girdiğiniz yeni şifreler birbiriyle uyuşmuyor.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Şifre güncellenemedi.');
        setLoading(false);
        return;
      }

      toast.success(data.message || "Şifreniz başarıyla değiştirildi!");
      setTimeout(() => {
        router.push('/login');
      }, 1200);
    } catch (e) {
      toast.error("Bağlantı hatası oluştu.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-4 selection:bg-primary-tint-200">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-xl space-y-6 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary text-white font-black text-xl flex items-center justify-center mx-auto shadow-md">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-dark">
            {step === 'request' ? 'Şifrenizi mi Unuttunuz?' : 'Yeni Şifrenizi Belirleyin'}
          </h2>
          <p className="text-xs text-muted-foreground">
            {step === 'request'
              ? 'Kayıtlı e-posta adresinizi girin, doğrulama kodunuzu anında iletelim.'
              : 'E-postanıza gönderilen 6 haneli kodu ve yeni şifrenizi girin.'}
          </p>
        </div>

        {/* Simulated Email Notification Banner */}
        {receivedCode && step === 'reset' && (
          <div className="bg-primary-tint-50 border border-primary-tint-200 p-3 rounded-2xl text-xs space-y-1 animate-in fade-in">
            <div className="font-bold text-primary flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Doğrulama Kodu Üretildi:
            </div>
            <div className="text-gray-700 text-xs font-mono">
              Doğrulama Kodu: <strong className="text-dark font-black tracking-widest text-sm bg-white px-2 py-0.5 rounded-lg border border-primary-tint-200">{receivedCode}</strong>
            </div>
            <div className="text-[10px] text-gray-500">15 dakika boyunca geçerlidir.</div>
          </div>
        )}

        {/* Step 1 Form: Request Code */}
        {step === 'request' ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-dark block mb-1">Kayıtlı E-Posta Adresiniz</label>
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

            <Button type="submit" disabled={loading} className="w-full h-11 rounded-2xl text-xs font-bold gap-2 shadow-xs">
              <span>{loading ? 'Kod Gönderiliyor...' : 'Doğrulama Kodu Gönder'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        ) : (
          /* Step 2 Form: Enter Code & New Password */
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-dark block mb-1">6 Haneli Doğrulama Kodu</label>
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border text-center text-base font-mono font-bold tracking-widest text-dark focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="123456"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-dark block mb-1">Yeni Şifreniz</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs font-semibold text-dark focus:outline-none focus:ring-2 focus:ring-primary pl-9 font-mono"
                  placeholder="Yeni şifreniz"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-dark block mb-1">Yeni Şifre (Tekrar)</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs font-semibold text-dark focus:outline-none focus:ring-2 focus:ring-primary pl-9 font-mono"
                  placeholder="Yeni şifrenizi tekrar girin"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11 rounded-2xl text-xs font-bold gap-2 shadow-xs">
              <span>{loading ? 'Şifre Güncelleniyor...' : 'Şifremi Sıfırla ve Giriş Yap'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </Button>

            <button
              type="button"
              onClick={() => setStep('request')}
              className="w-full text-center text-xs font-bold text-gray-500 hover:text-dark flex items-center justify-center gap-1 mt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> E-postayı Değiştir
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-border text-center text-xs text-gray-500">
          Şifrenizi hatırladınız mı?{' '}
          <Link href="/login" className="font-bold text-primary hover:underline">
            Giriş Ekranına Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
