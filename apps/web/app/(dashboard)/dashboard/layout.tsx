import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { LayoutDashboard, ShoppingBag, DownloadCloud, History, Heart, MapPin, User, LogOut } from 'lucide-react';
import { LogoutButton } from './LogoutButton';

export default async function CustomerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?callbackUrl=/dashboard');
  }

  const menuItems = [
    { label: 'Ringkasan', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Pesanan Saya', href: '/dashboard/orders', icon: ShoppingBag },
    { label: 'Produk Digital & Lisensi', href: '/dashboard/products', icon: DownloadCloud },
    { label: 'Riwayat Unduhan', href: '/dashboard/downloads', icon: History },
    { label: 'Wishlist Favorit', href: '/dashboard/wishlist', icon: Heart },
    { label: 'Alamat Pengiriman', href: '/dashboard/addresses', icon: MapPin },
    { label: 'Profil & Keamanan', href: '/dashboard/profile', icon: User },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Nav */}
        <aside className="lg:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
            {/* User card snippet */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 font-bold text-white shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</h3>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>

            <nav className="space-y-1 text-xs font-semibold">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-emerald-600 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <LogoutButton />
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Dashboard Content Area */}
        <main className="lg:col-span-9">{children}</main>
      </div>
    </div>
  );
}
