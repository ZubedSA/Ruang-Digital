import React from 'react';
import Link from 'next/link';
import { prisma } from '@ruang-digital/db';
import { formatRupiah } from '@ruang-digital/utils';
import { Plus, Download, Package, Edit, ExternalLink } from 'lucide-react';

import { getAdminProductsList } from '@/lib/neon';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  let products: any[] = [];
  try {
    products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        files: true,
        variants: true,
      },
    });
  } catch (err) {
    console.warn('Prisma admin products query failed, using Neon HTTP fallback:', err);
    try {
      products = await getAdminProductsList();
    } catch (neonErr) {
      console.error('Neon admin products query error:', neonErr);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">Manajemen Katalog Produk</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kelola produk digital (software/ebook) dan fisik (merchandise/stok) dalam satu inventaris.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm self-start"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Produk Baru</span>
        </Link>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
              <tr>
                <th className="p-4">Produk</th>
                <th className="p-4">Tipe</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Harga Dasar</th>
                <th className="p-4">Status / Inventori</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    Belum ada produk di database. Silakan klik Tambah Produk Baru atau jalankan seed database.
                  </td>
                </tr>
              ) : (
                products.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            p.featuredImage && !p.featuredImage.includes('/uploads/product-')
                              ? p.featuredImage
                              : 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=200'
                          }
                          alt={p.name}
                          className="h-10 w-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{p.name}</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">{p.slug}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      {p.type === 'DIGITAL' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-800">
                          <Download className="h-3 w-3" /> Digital ({p.files?.length ?? 0} file)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800">
                          <Package className="h-3 w-3" /> Fisik ({p.stock} stok)
                        </span>
                      )}
                    </td>

                    <td className="p-4">{p.category?.name || '-'}</td>

                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {formatRupiah(p.discountPrice || p.basePrice)}
                      {p.discountPrice && (
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 line-through font-normal">
                          {formatRupiah(p.basePrice)}
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          p.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                            : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                          title="Edit Rincian Produk"
                        >
                          <Edit className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Edit</span>
                        </Link>
                        <a
                          href={`/produk/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
                          title="Buka Halaman Produk Customer"
                        >
                          <span>Lihat</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {products.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
            Belum ada produk di database.
          </div>
        ) : (
          products.map((p: any) => (
            <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
              <div className="flex items-start gap-3">
                <img
                  src={
                    p.featuredImage && !p.featuredImage.includes('/uploads/product-')
                      ? p.featuredImage
                      : 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=200'
                  }
                  alt={p.name}
                  className="h-14 w-14 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">{p.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{p.category?.name || 'Tanpa Kategori'}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {p.type === 'DIGITAL' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-800">
                      <Download className="h-3 w-3" /> Digital
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800">
                      <Package className="h-3 w-3" /> Stok {p.stock}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      p.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                        : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {formatRupiah(p.discountPrice || p.basePrice)}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Link
                  href={`/admin/products/${p.id}/edit`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <Edit className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  Edit
                </Link>
                <a
                  href={`/produk/${p.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-slate-100 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  Lihat
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
