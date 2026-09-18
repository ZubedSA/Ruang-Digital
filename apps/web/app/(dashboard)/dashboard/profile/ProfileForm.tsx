'use client';

import React, { useState } from 'react';
import { User, Lock, CheckCircle2, AlertCircle, Loader2, ShieldCheck, Mail, Phone } from 'lucide-react';

interface ProfileFormProps {
  initialUser: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    createdAt: string | Date;
  };
}

export function ProfileForm({ initialUser }: ProfileFormProps) {
  const [profileData, setProfileData] = useState({
    name: initialUser.name,
    phone: initialUser.phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProfile(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui profil');

      setProfileSuccess('Informasi profil berhasil diperbarui.');
    } catch (err: any) {
      setProfileError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPassword(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengganti password');

      setPasswordSuccess(data.message || 'Password berhasil diubah.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPasswordError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="h-5 w-5 text-emerald-600" />
          Profil & Pengaturan Akun
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Perbarui informasi kontak dan kata sandi keamanan akun Ruang Digital Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 1: Informasi Profil */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Informasi Pribadi</h3>
              <p className="text-[11px] text-slate-400">Data identitas dan nomor kontak aktif</p>
            </div>
          </div>

          {profileSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Alamat Email (Akun)
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={initialUser.email}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 pl-9 text-xs text-slate-500 cursor-not-allowed dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400"
                />
                <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Email digunakan sebagai ID unik akun dan verifikasi unduhan.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nomor WhatsApp / HP
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="081234567890"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 pl-9 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
                <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Dibutuhkan untuk notifikasi pengiriman resi pesanan fisik.</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loadingProfile}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {loadingProfile && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Simpan Informasi Profil
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Ganti Password */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Keamanan & Sandi</h3>
              <p className="text-[11px] text-slate-400">Perbarui kata sandi untuk mengamankan akun</p>
            </div>
          </div>

          {passwordSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password Saat Ini
              </label>
              <input
                type="password"
                required
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password Baru (Min. 8 Karakter)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Konfirmasi Password Baru
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loadingPassword}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {loadingPassword && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Perbarui Kata Sandi
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
