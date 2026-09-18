import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingCart,
  Truck,
  Users,
  DollarSign,
  Ticket,
  Star,
  ShieldCheck,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { AdminLogoutButton } from './LogoutButton';
import { BottomNav } from './BottomNav';
import { ThemeToggle } from '@ruang-digital/ui';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminSession();
  if (!admin) {
    redirect('/login');
  }

  const navItems = [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    { label: 'Katalog Produk', href: '/products', icon: Package },
    { label: 'Kategori Produk', href: '/categories', icon: Layers },
    { label: 'Pesanan Masuk', href: '/orders', icon: ShoppingCart },
    { label: 'Pengiriman & Resi', href: '/shipments', icon: Truck },
    { label: 'Data Pelanggan', href: '/customers', icon: Users },
    { label: 'Buku Besar Pembayaran', href: '/payments', icon: DollarSign },
    { label: 'Kupon Promo', href: '/coupons', icon: Ticket },
    { label: 'Moderasi Ulasan', href: '/reviews', icon: Star },
    { label: 'Audit Log & Keamanan', href: '/audit-logs', icon: ShieldCheck },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-150">
      {/* Sidebar — Desktop only */}
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white/95 dark:border-slate-800 dark:bg-slate-900/80 p-5 shrink-0 transition-colors">
        <div className="flex items-center gap-2.5 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-black shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
              RUANG<span className="text-emerald-500">DIGITAL</span>
            </h2>
            <span className="text-[10px] font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
              Admin Ops
            </span>
          </div>
        </div>

        {/* Current Admin Badge */}
        <div className="mt-4 p-3 rounded-xl bg-slate-100/80 border border-slate-200 dark:bg-slate-950/60 dark:border-slate-800/80 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
            {admin.name.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{admin.name}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{admin.email}</p>
          </div>
        </div>

        <nav className="mt-4 flex-1 space-y-1 text-xs font-semibold overflow-y-auto pr-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
              >
                <Icon className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-xl bg-slate-100 p-2.5 text-slate-700 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:text-white transition-colors"
          >
            <span>Buka Toko Customer</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <AdminLogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 md:h-16 border-b border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-900/60 backdrop-blur-md px-4 md:px-6 flex items-center justify-between transition-colors">
          {/* Mobile: show logo */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-black shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
              RUANG<span className="text-emerald-500">DIGITAL</span>
            </span>
          </div>

          {/* Desktop: show panel text */}
          <div className="hidden md:block text-xs font-semibold text-slate-500 dark:text-slate-400">
            Panel Operasional E-Commerce Ruang Digital
          </div>

          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Button in Header */}
            <ThemeToggle variant="dropdown" />

            {/* Mobile: admin badge */}
            <div className="flex md:hidden items-center gap-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 font-bold text-[10px] border border-emerald-300 dark:border-emerald-800">
                {admin.name.charAt(0).toUpperCase()}
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 md:px-3 py-1 text-[10px] md:text-[11px] font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-400 dark:border-emerald-800">
              <span className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Sesi Admin Aktif</span>
              <span className="sm:hidden">Aktif</span>
            </span>
          </div>
        </header>

        <div className="p-4 md:p-6 lg:p-8 flex-1 overflow-auto pb-28 md:pb-8">{children}</div>
      </main>

      {/* Bottom Navigation — Mobile only */}
      <BottomNav />
    </div>
  );
}
