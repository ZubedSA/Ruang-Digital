import React from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Zap, DownloadCloud, Truck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 pb-20 md:pb-8">
      {/* Value Proposition Strip */}
      <div className="border-b border-slate-100 dark:border-slate-800/80 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <DownloadCloud className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Unduh Instan</h4>
                <p className="text-[11px] text-slate-500">File digital langsung siap di dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Pembayaran Aman</h4>
                <p className="text-[11px] text-slate-500">Verifikasi otomatis via Midtrans</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Lisensi Resmi</h4>
                <p className="text-[11px] text-slate-500">Key generator unik & aman</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Pengiriman Cepat</h4>
                <p className="text-[11px] text-slate-500">Produk fisik dengan resi terlacak</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                RUANG<span className="text-emerald-600">DIGITAL</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Platform e-commerce terpercaya untuk produk digital dan fisik. Belanja software, ebook, template, dan merchandise developer dengan mudah dan aman.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Kategori Produk
            </h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><Link href="/produk?cat=aplikasi" className="hover:text-emerald-600">Aplikasi & Software</Link></li>
              <li><Link href="/produk?cat=ebook" className="hover:text-emerald-600">Ebook & Tutorial</Link></li>
              <li><Link href="/produk?cat=template" className="hover:text-emerald-600">Template & UI Kit</Link></li>
              <li><Link href="/produk?cat=merchandise" className="hover:text-emerald-600">Merchandise Fisik</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Bantuan & Layanan
            </h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><Link href="/dashboard" className="hover:text-emerald-600">Dashboard Customer</Link></li>
              <li><Link href="/dashboard/products" className="hover:text-emerald-600">Pusat Unduhan</Link></li>
              <li><Link href="/cart" className="hover:text-emerald-600">Keranjang Belanja</Link></li>
              <li><span className="text-slate-400">support@ruangdigital.com</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Keamanan & Pembayaran
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              Didukung oleh Midtrans dengan enkripsi standar industri. Mendukung QRIS, GoPay, OVO, Virtual Account BCA, Mandiri, BNI, dan kartu debit/kredit.
            </p>
            <div className="text-[11px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-100 dark:border-emerald-800/40">
              ✓ Server-Verified & Idempotent Transactions
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-100 pt-6 text-center text-xs text-slate-400 dark:border-slate-800">
          <p>© {new Date().getFullYear()} Ruang Digital. Hak Cipta Dilindungi Undang-Undang.</p>
        </div>
      </div>
    </footer>
  );
}
