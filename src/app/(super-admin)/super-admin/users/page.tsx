"use client";
import React, { useState, useEffect } from 'react';
import {
  Users,
  Crown,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Building2,
  Store,
  RefreshCw,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  MoreVertical,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function SuperAdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/super-admin/users');
      const json = await res.json();
      if (json.success) {
        setUsers(json.users || []);
      } else {
        toast.error(json.error || 'Kullanıcılar yüklenemedi');
      }
    } catch (e: any) {
      toast.error('Kullanıcı listesi alınırken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleSuperAdmin = async (user: any) => {
    try {
      setUpdatingId(user.id);
      const newStatus = !user.isSuperAdmin;
      const res = await fetch('/api/super-admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          isSuperAdmin: newStatus
        })
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`${user.fullName || user.email} için Süper Admin yetkisi ${newStatus ? 'verildi' : 'kaldırıldı'}.`);
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isSuperAdmin: newStatus } : u));
      } else {
        toast.error(json.error || 'Yetki güncellenemedi');
      }
    } catch (e: any) {
      toast.error('İşlem sırasında hata oluştu');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleChange = async (user: any, newRole: string) => {
    try {
      setUpdatingId(user.id);
      const res = await fetch('/api/super-admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          role: newRole
        })
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`${user.fullName || user.email} rolü '${newRole}' olarak güncellendi.`);
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      } else {
        toast.error(json.error || 'Rol güncellenemedi');
      }
    } catch (e: any) {
      toast.error('Rol güncellenirken hata oluştu');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.companyName || '').toLowerCase().includes(search.toLowerCase());

    const matchesRole =
      roleFilter === 'all' ||
      (roleFilter === 'super_admin' && u.isSuperAdmin) ||
      (roleFilter === 'admin' && u.role === 'admin' && !u.isSuperAdmin) ||
      (roleFilter === 'user' && u.role === 'user' && !u.isSuperAdmin);

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Tüm Kullanıcılar & Yetki Yönetimi
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Platformdaki tüm kayıtlı hesapları inceleyin, şirket bağlantılarını görün ve Süper Admin yetkisi atayın.
          </p>
        </div>

        <Button
          onClick={fetchUsers}
          disabled={loading}
          variant="outline"
          size="sm"
          className="h-10 px-4 rounded-xl border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white text-xs font-bold gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Yenile</span>
        </Button>
      </div>

      {/* 2. Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İsim, e-posta veya firma ara..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'super_admin', label: '👑 Süper Adminler' },
            { id: 'admin', label: 'Firma Adminleri' },
            { id: 'user', label: 'Kullanıcılar' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                roleFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Users Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase font-mono text-[10px] bg-slate-950/40">
                <th className="p-4 font-semibold">Kullanıcı Bilgisi</th>
                <th className="p-4 font-semibold">Bağlı Firma</th>
                <th className="p-4 font-semibold">Mevcut Rol</th>
                <th className="p-4 font-semibold">Süper Admin Durumu</th>
                <th className="p-4 font-semibold">Kayıt Tarihi</th>
                <th className="p-4 font-semibold text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-mono">
                    Eşleşen kullanıcı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isUpdating = updatingId === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                            user.isSuperAdmin
                              ? 'bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-md shadow-amber-500/20'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {user.isSuperAdmin ? '👑' : (user.fullName || user.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              {user.fullName}
                              {user.isSuperAdmin && (
                                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[9px] px-1.5 py-0">
                                  SUPER
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-slate-200 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>{user.companyName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {user.stores?.length || 0} Bağlı Mağaza
                        </div>
                      </td>

                      <td className="p-4">
                        <select
                          value={user.role}
                          disabled={isUpdating}
                          onChange={(e) => handleRoleChange(user, e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="admin">Admin (Firma Yöneticisi)</option>
                          <option value="user">User (Kısıtlı Yetkili)</option>
                        </select>
                      </td>

                      <td className="p-4">
                        {user.isSuperAdmin ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs px-2.5 py-1 gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Yetkili (Süper Admin)</span>
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-800 text-slate-400 border-slate-700 text-xs px-2.5 py-1">
                            Standart Hesap
                          </Badge>
                        )}
                      </td>

                      <td className="p-4 font-mono text-[11px] text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString('tr-TR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </td>

                      <td className="p-4 text-right">
                        <Button
                          size="sm"
                          disabled={isUpdating}
                          onClick={() => handleToggleSuperAdmin(user)}
                          className={`h-8 px-3 rounded-xl text-xs font-bold transition-all ${
                            user.isSuperAdmin
                              ? 'bg-rose-950/60 border border-rose-800/80 text-rose-300 hover:bg-rose-900/80'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                          }`}
                        >
                          {user.isSuperAdmin ? (
                            <span>Yetkiyi Geri Al</span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Crown className="w-3.5 h-3.5" />
                              <span>Süper Admin Yap</span>
                            </span>
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
