'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2 } from 'lucide-react';

export function AdminLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-rose-400 transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4 text-slate-400 dark:text-slate-500" />
      )}
      <span>Keluar (Logout)</span>
    </button>
  );
}
