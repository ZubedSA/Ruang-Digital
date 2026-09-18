'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { CartProvider } from '@/components/CartContext';

interface StorefrontShellProps {
  user?: { id: string; name: string; email?: string; role: string; avatar?: string | null } | null;
  children: React.ReactNode;
}

export function StorefrontShell({ user, children }: StorefrontShellProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <CartProvider>
      <Navbar user={user} />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer />
      <MobileBottomNav user={user} />
    </CartProvider>
  );
}
