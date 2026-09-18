import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { ProductCard } from '@/components/ProductCard';
import { ArrowRight, Sparkles, Laptop, BookOpen, Layers, ShoppingBag, ShieldCheck, Download, Truck } from 'lucide-react';

export const revalidate = 60; // Revalidate cache every 60s

export default async function HomePage() {
  let categories: any[] = [];
  let featuredProducts: any[] = [];
  let digitalProducts: any[] = [];
  let physicalProducts: any[] = [];

  try {
    const [cats, feat, digi, phys] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        take: 6,
      }),
      prisma.product.findMany({
        where: { status: 'ACTIVE', isFeatured: true },
        include: { category: true },
        take: 4,
      }),
      prisma.product.findMany({
        where: { status: 'ACTIVE', type: 'DIGITAL' },
        include: { category: true },
        take: 4,
      }),
      prisma.product.findMany({
        where: { status: 'ACTIVE', type: 'PHYSICAL' },
        include: { category: true },
        take: 4,
      }),
    ]);

    categories = cats;
    featuredProducts = feat;
    digitalProducts = digi;
    physicalProducts = phys;
  } catch (error) {
    console.warn('Database not connected or seeded yet, using fallback showcase items.', error);
    // Graceful fallback for initial zero-DB rendering
    featuredProducts = [
      {
        id: 'mock-1',
        name: 'Aplikasi Kasir POS Pro (Windows & Android)',
        slug: 'aplikasi-kasir-pos-pro',
        type: 'DIGITAL',
        basePrice: 349000,
        discountPrice: 249000,
        featuredImage: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800&auto=format&fit=crop&q=80',
        shortDescription: 'Software kasir POS multifungsi dengan laporan otomatis & cetak struk.',
        category: { name: 'Aplikasi' },
      },
      {
        id: 'mock-2',
        name: 'Ebook: Mastering Full-Stack Next.js 14 & Prisma',
        slug: 'ebook-mastering-fullstack-nextjs',
        type: 'DIGITAL',
        basePrice: 150000,
        discountPrice: 99000,
        featuredImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
        shortDescription: 'Panduan lengkap membangun aplikasi enterprise dari nol sampai production.',
        category: { name: 'Ebook' },
      },
      {
        id: 'mock-3',
        name: 'Kaos Developer "git commit && push"',
        slug: 'kaos-developer-commit-push',
        type: 'PHYSICAL',
        basePrice: 135000,
        discountPrice: null,
        featuredImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
        shortDescription: 'Cotton Combed 30s reaktif super nyaman dan adem untuk coding.',
        category: { name: 'Merchandise' },
      },
      {
        id: 'mock-4',
        name: 'Ultimate Notion Freelance OS',
        slug: 'ultimate-notion-freelance-os',
        type: 'DIGITAL',
        basePrice: 120000,
        discountPrice: 79000,
        featuredImage: 'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=800&auto=format&fit=crop&q=80',
        shortDescription: 'Template Notion terlengkap untuk manajemen klien dan proyek.',
        category: { name: 'Template' },
      },
    ];
    digitalProducts = featuredProducts.filter((p) => p.type === 'DIGITAL');
    physicalProducts = featuredProducts.filter((p) => p.type === 'PHYSICAL');
  }

  return (
    <div className="flex flex-col gap-12 sm:gap-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/50 via-slate-50 to-white dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-950 py-12 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-6">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Platform E-Commerce Produk Digital & Fisik</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl md:text-6xl dark:text-white leading-tight">
              Koleksi Terbaik untuk{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                Karya & Produktivitas
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base text-slate-600 sm:text-lg dark:text-slate-300 leading-relaxed max-w-2xl">
              Dapatkan aplikasi premium, ebook panduan, template desain siap pakai, serta merchandise developer berkualitas dengan sistem pembayaran resmi dan unduhan instan.
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 w-full sm:w-auto">
              <Link
                href="/produk"
                className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-98 transition-all"
              >
                <span>Jelajahi Produk</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/produk?type=DIGITAL"
                className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white transition-all"
              >
                <Download className="h-4 w-4 text-emerald-600" />
                <span>Produk Digital</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category Icons Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Kategori Pilihan</h2>
            <p className="text-xs text-slate-500">Temukan produk sesuai kebutuhan Anda</p>
          </div>
          <Link href="/produk" className="text-xs font-semibold text-emerald-600 hover:underline">
            Lihat Semua →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/produk?cat=aplikasi"
            className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-5 text-center transition-all hover:border-emerald-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform dark:bg-indigo-950 dark:text-indigo-400">
              <Laptop className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Aplikasi & Software</h3>
            <p className="text-[11px] text-slate-500 mt-1">POS, desktop & scripts</p>
          </Link>

          <Link
            href="/produk?cat=ebook"
            className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-5 text-center transition-all hover:border-emerald-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform dark:bg-emerald-950 dark:text-emerald-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Ebook & Panduan</h3>
            <p className="text-[11px] text-slate-500 mt-1">Coding, bisnis & desain</p>
          </Link>

          <Link
            href="/produk?cat=template"
            className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-5 text-center transition-all hover:border-emerald-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform dark:bg-purple-950 dark:text-purple-400">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Template & Desain</h3>
            <p className="text-[11px] text-slate-500 mt-1">Notion, UI Kit & code</p>
          </Link>

          <Link
            href="/produk?cat=merchandise"
            className="group flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-5 text-center transition-all hover:border-emerald-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform dark:bg-amber-950 dark:text-amber-400">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Merchandise Fisik</h3>
            <p className="text-[11px] text-slate-500 mt-1">Kaos, tumbler & stiker</p>
          </Link>
        </div>
      </section>

      {/* Featured Products Showcase */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Paling Populer</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              Produk Unggulan
            </h2>
          </div>
          <Link href="/produk" className="text-xs font-semibold text-slate-600 hover:text-emerald-600 dark:text-slate-400">
            Semua Produk →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {featuredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Digital Products Section */}
      <section className="bg-slate-100/60 dark:bg-slate-900/40 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Unduh Seketika
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                Katalog Produk Digital
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Aplikasi, source code, lisensi, dan materi pembelajaran siap pakai
              </p>
            </div>
            <Link
              href="/produk?type=DIGITAL"
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Lihat Kategori Digital →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {digitalProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Physical Merchandise Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Dikirim ke Rumah
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              Merchandise & Barang Fisik
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Apparel distro developer dan perlengkapan meja kerja berkualitas
            </p>
          </div>
          <Link
            href="/produk?type=PHYSICAL"
            className="text-xs font-semibold text-amber-600 hover:underline"
          >
            Lihat Produk Fisik →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {physicalProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Trust & Guarantee Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8">
        <div className="rounded-3xl bg-emerald-700 p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Siap Meningkatkan Skill & Bisnis Anda?
            </h2>
            <p className="text-sm sm:text-base text-emerald-100 leading-relaxed">
              Semua produk digital dapat diunduh langsung setelah pembayaran terverifikasi. Dilengkapi panduan instalasi dan dokumentasi lengkap.
            </p>
            <div className="pt-2">
              <Link
                href="/produk"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-emerald-800 shadow-md hover:bg-emerald-50 transition-colors"
              >
                Mulai Belanja Sekarang
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
