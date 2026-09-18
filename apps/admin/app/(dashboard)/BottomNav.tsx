'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  MoreHorizontal,
  Layers,
  Truck,
  DollarSign,
  Ticket,
  Star,
  ShieldCheck,
  ExternalLink,
  LogOut,
  X,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@ruang-digital/ui';

const mainTabs = [
  { label: 'Overview', href: '/', icon: LayoutDashboard },
  { label: 'Produk', href: '/products', icon: Package },
  { label: 'Pesanan', href: '/orders', icon: ShoppingCart },
  { label: 'Pelanggan', href: '/customers', icon: Users },
];

const moreItems = [
  { label: 'Kategori Produk', href: '/categories', icon: Layers },
  { label: 'Pengiriman & Resi', href: '/shipments', icon: Truck },
  { label: 'Buku Besar Pembayaran', href: '/payments', icon: DollarSign },
  { label: 'Kupon Promo', href: '/coupons', icon: Ticket },
  { label: 'Moderasi Ulasan', href: '/reviews', icon: Star },
  { label: 'Audit Log & Keamanan', href: '/audit-logs', icon: ShieldCheck },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const isMoreActive = moreItems.some((item) => isActive(item.href));

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      {/* More Menu Overlay */}
      {showMore && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          style={{ position: 'fixed', inset: 0, zIndex: 60 }}
          onClick={() => setShowMore(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute bottom-[68px] left-0 right-0 mx-3 rounded-2xl border border-slate-200 bg-white/95 text-slate-800 shadow-2xl backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/95 dark:text-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">Menu Lainnya</span>
              <button
                onClick={() => setShowMore(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="p-2 space-y-0.5">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Theme Toggle Row */}
            <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mode Tampilan</span>
              <ThemeToggle variant="segmented" />
            </div>

            {/* Footer Actions */}
            <div className="p-2 pt-0 space-y-0.5 border-t border-slate-200 dark:border-slate-800 mt-1">
              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
              >
                <span>Buka Toko Customer</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              </a>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-rose-400 transition-colors disabled:opacity-50"
              >
                {loggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                )}
                <span>Keluar (Logout)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 border-t border-slate-200 shadow-[0_-4px_25px_rgba(0,0,0,0.1)] dark:bg-slate-900/95 dark:border-slate-800 dark:shadow-[0_-4px_25px_rgba(0,0,0,0.6)] backdrop-blur-md"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex items-center justify-around px-1 py-2">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2.5 py-1 min-w-[56px] transition-colors ${
                  active ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-400'}`} />
                <span className={`text-[10px] tracking-tight ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}

          {/* More Button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2.5 py-1 min-w-[56px] transition-colors ${
              showMore || isMoreActive ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <MoreHorizontal className={`h-5 w-5 ${showMore || isMoreActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-400'}`} />
            <span className={`text-[10px] tracking-tight ${showMore || isMoreActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
              Lainnya
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
