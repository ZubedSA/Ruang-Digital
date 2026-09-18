'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Search, User, Menu, X, Laptop, BookOpen, Layers, Sparkles } from 'lucide-react';
import { useCart } from './CartContext';
import { ThemeToggle } from '@ruang-digital/ui';

export function Navbar({ user }: { user?: { id: string; name: string; role: string } | null }) {
  const router = useRouter();
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/produk?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition-transform group-hover:scale-105">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                RUANG<span className="text-emerald-600">DIGITAL</span>
              </span>
              <span className="text-[10px] font-medium tracking-wider text-slate-400 uppercase -mt-1">
                Katalog Produk
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Link href="/produk" className="rounded-md px-3 py-1.5 transition-colors hover:text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-900">
              Semua Produk
            </Link>
            <Link href="/produk?cat=aplikasi" className="rounded-md px-3 py-1.5 transition-colors hover:text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-900">
              Aplikasi
            </Link>
            <Link href="/produk?cat=ebook" className="rounded-md px-3 py-1.5 transition-colors hover:text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-900">
              Ebook
            </Link>
            <Link href="/produk?cat=template" className="rounded-md px-3 py-1.5 transition-colors hover:text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-900">
              Template
            </Link>
            <Link href="/produk?cat=merchandise" className="rounded-md px-3 py-1.5 transition-colors hover:text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-900">
              Merchandise
            </Link>
          </nav>
        </div>

        {/* Search Bar & Actions */}
        <div className="flex items-center gap-3">
          {/* Desktop Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative hidden sm:block w-48 md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari produk digital / fisik..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-4 text-xs text-slate-900 transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </form>

          {/* Theme Switcher */}
          <ThemeToggle variant="dropdown" />

          {/* Cart Icon */}
          <Link
            href="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Keranjang Belanja"
          >
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[11px] font-bold text-white shadow-sm">
                {itemCount}
              </span>
            )}
          </Link>

          {/* User Profile / Auth */}
          {user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:border-emerald-500 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <User className="h-4 w-4 text-emerald-600" />
              <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              Masuk
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 dark:border-slate-800 dark:bg-slate-950">
          <form onSubmit={handleSearchSubmit} className="mb-4 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari software, ebook, kaos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </form>
          <div className="flex flex-col space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <Link
              href="/produk"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              Semua Produk
            </Link>
            <Link
              href="/produk?cat=aplikasi"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              Aplikasi & Software
            </Link>
            <Link
              href="/produk?cat=ebook"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              Ebook & Panduan
            </Link>
            <Link
              href="/produk?cat=template"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              Template & Desain
            </Link>
            <Link
              href="/produk?cat=merchandise"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              Merchandise & Fisik
            </Link>
            {user?.role === 'ADMIN' && (
              <a
                href="http://localhost:3001"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg px-3 py-2 text-emerald-600 font-semibold"
              >
                Panel Admin ↗
              </a>
            )}

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Mode Tema</span>
              <ThemeToggle variant="segmented" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
