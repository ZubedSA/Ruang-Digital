'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, ShoppingBag, Package, User } from 'lucide-react';
import { useCart } from './CartContext';

export function MobileBottomNav({ user }: { user?: { id: string; name: string } | null }) {
  const pathname = usePathname();
  const { itemCount } = useCart();

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Produk', href: '/produk', icon: Compass },
    { label: 'Keranjang', href: '/cart', icon: ShoppingBag, badge: itemCount > 0 ? itemCount : null },
    { label: 'Pesanan', href: user ? '/dashboard/orders' : '/login', icon: Package },
    { label: 'Profil', href: user ? '/dashboard' : '/login', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 z-40 block md:hidden w-full border-t border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
      <div className="grid h-16 grid-cols-5 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-0.5 py-1 text-center transition-colors ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
