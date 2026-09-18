'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
    >
      <LogOut className="h-4 w-4" />
      <span>Keluar Akun</span>
    </button>
  );
}
