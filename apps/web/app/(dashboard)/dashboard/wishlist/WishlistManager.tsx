'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Trash2, ShoppingCart, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { formatRupiah } from '@ruang-digital/utils';
import { useCart } from '@/components/CartContext';

interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string | Date;
  product: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    discountPrice?: number | null;
    featuredImage: string;
    type: 'DIGITAL' | 'PHYSICAL';
    category?: { name: string } | null;
  };
}

interface WishlistManagerProps {
  initialItems: WishlistItem[];
}

export function WishlistManager({ initialItems }: WishlistManagerProps) {
  const [items, setItems] = useState<WishlistItem[]>(initialItems);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { addItem } = useCart();

  const handleRemove = async (productId: string) => {
    setLoadingId(productId);
    try {
      const res = await fetch(`/api/user/wishlist?productId=${productId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.productId !== productId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleAddToCart = (item: WishlistItem) => {
    addItem({
      productId: item.product.id,
      variantId: null,
      name: item.product.name,
      slug: item.product.slug,
      price: item.product.discountPrice ?? item.product.basePrice,
      image: item.product.featuredImage,
      type: item.product.type,
      quantity: 1,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Heart className="h-6 w-6 text-rose-500 fill-rose-500" />
          Daftar Keinginan (Wishlist)
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Simpan software, ebook, dan produk yang Anda incar untuk dibeli nanti.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center">
          <Heart className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Wishlist Anda Masih Kosong</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Jelajahi berbagai produk digital dan merchandise kami, lalu klik ikon hati untuk menyimpannya di sini.
          </p>
          <div className="mt-5">
            <Link
              href="/produk"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
            >
              Jelajahi Produk
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {items.map((item) => {
            const product = item.product;
            const priceToDisplay = product.discountPrice ?? product.basePrice;
            const hasDiscount = !!product.discountPrice && product.discountPrice < product.basePrice;

            return (
              <div
                key={item.id}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Image & Badges */}
                <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <Image
                    src={product.featuredImage}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="rounded-full bg-slate-900/80 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                      {product.type}
                    </span>
                    {hasDiscount && (
                      <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
                        PROMO
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleRemove(product.id)}
                    disabled={loadingId === product.id}
                    title="Hapus dari Wishlist"
                    className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-sm hover:bg-rose-500 hover:text-white transition-colors dark:bg-slate-900/90"
                  >
                    {loadingId === product.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {product.category && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        {product.category.name}
                      </span>
                    )}
                    <Link
                      href={`/produk/${product.slug}`}
                      className="block text-xs font-bold text-slate-900 dark:text-white hover:text-emerald-600 line-clamp-2 mt-1 transition-colors"
                    >
                      {product.name}
                    </Link>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {formatRupiah(priceToDisplay)}
                      </p>
                      {hasDiscount && (
                        <p className="text-[10px] text-slate-400 line-through">
                          {formatRupiah(product.basePrice)}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddToCart(item)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition-all"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      <span>+ Keranjang</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
