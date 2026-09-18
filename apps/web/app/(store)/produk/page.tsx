import React from 'react';
import { prisma } from '@/lib/db';
import { ProductCard } from '@/components/ProductCard';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';

interface SearchParamsProps {
  searchParams: {
    q?: string;
    cat?: string;
    type?: string;
    sort?: string;
  };
}

export default async function ProductsCatalogPage({ searchParams }: SearchParamsProps) {
  const { q, cat, type, sort } = searchParams;

  let whereClause: any = {
    status: 'ACTIVE',
  };

  if (q) {
    whereClause.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (cat) {
    whereClause.category = {
      slug: cat,
    };
  }

  if (type === 'DIGITAL' || type === 'PHYSICAL') {
    whereClause.type = type;
  }

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'price_asc') {
    orderBy = { basePrice: 'asc' };
  } else if (sort === 'price_desc') {
    orderBy = { basePrice: 'desc' };
  }

  let products: any[] = [];
  let categories: any[] = [];

  try {
    categories = await prisma.category.findMany({ where: { isActive: true } });
    products = await prisma.product.findMany({
      where: whereClause,
      include: { category: true },
      orderBy,
    });
  } catch (err) {
    console.warn('Catalog DB query fallback:', err);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-8 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Katalog Produk Ruang Digital
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {products.length} produk ditemukan
            {q && <span> untuk pencarian &ldquo;{q}&rdquo;</span>}
          </p>
        </div>

        {/* Filter / Sort bar */}
        <form className="flex flex-wrap items-center gap-3">
          {q && <input type="hidden" name="q" value={q} />}

          {/* Type filter */}
          <select
            name="type"
            defaultValue={type || ''}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="">Semua Tipe (Digital & Fisik)</option>
            <option value="DIGITAL">Hanya Digital (Unduhan)</option>
            <option value="PHYSICAL">Hanya Fisik (Dikirim)</option>
          </select>

          {/* Category filter */}
          <select
            name="cat"
            defaultValue={cat || ''}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Sort order */}
          <select
            name="sort"
            defaultValue={sort || ''}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="">Urutkan: Terbaru</option>
            <option value="price_asc">Harga: Terendah ke Tertinggi</option>
            <option value="price_desc">Harga: Tertinggi ke Terendah</option>
          </select>

          <button
            type="submit"
            className="h-10 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 transition-colors shadow-sm"
          >
            Terapkan
          </button>
        </form>
      </div>

      {/* Product List */}
      <div className="mt-8">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-800">
            <Search className="h-10 w-10 text-slate-400 mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Produk Tidak Ditemukan
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Tidak ada produk yang cocok dengan kriteria pencarian atau filter yang Anda pilih. Silakan gunakan kata kunci lain.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
