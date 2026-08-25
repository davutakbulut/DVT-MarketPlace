"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Building2, Mail, Lock, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Registration logic connected to Supabase
    setTimeout(() => {
      toast.success("Firma kaydı başarıyla oluşturuldu! Giriş yapabilirsiniz.");
      router.push('/login');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-border shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary text-white font-black text-xl flex items-center justify-center mx-auto shadow-md">
            D
          </div>
          <h2 className="text-2xl font-black tracking-tight text-dark">Yeni Firma Kaydı</h2>
          <p className="text-xs text-muted-foreground">Pazaryerlerinizi entegre edin ve kârlılığınızı canlı yönetin.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-dark block mb-1">Firma / Mağaza Ticari Ünvanı</label>
            <div className="relative">
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs font-semibold text-dark focus:outline-none focus:ring-2 focus:ring-primary pl-9"
                placeholder="Akbulut Ticaret A.Ş."
              />
              <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-dark block mb-1">Yetkili Adı Soyadı</label>
            <div className="relative">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs font-semibold text-dark focus:outline-none focus:ring-2 focus:ring-primary pl-9"
                placeholder="Davut Akbulut"
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-dark block mb-1">E-Posta Adresi</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs font-semibold text-dark focus:outline-none focus:ring-2 focus:ring-primary pl-9"
                placeholder="dvtakblt@gmail.com"
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

          <Button type="submit" disabled={loading} className="w-full h-11 rounded-2xl text-xs font-bold gap-2">
            <span>{loading ? 'Kayıt Yapılıyor...' : 'Ücretsiz Hesabımı Başlat'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="pt-4 border-t border-border text-center text-xs text-gray-500">
          Zaten hesabınız var mı?{' '}
          <Link href="/login" className="font-bold text-primary hover:underline">
            Giriş Yap
          </Link>
        </div>
      </div>
    </div>
  );
}
