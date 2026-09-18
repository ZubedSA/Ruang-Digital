'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Download, Package, Heart } from 'lucide-react';
import { formatRupiah } from '@ruang-digital/utils';
import { useCart } from './CartContext';

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  type: 'DIGITAL' | 'PHYSICAL';
  basePrice: number;
  discountPrice?: number | null;
  featuredImage: string;
  category?: { name: string } | null;
  shortDescription?: string | null;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const { addItem } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const effectivePrice = product.discountPrice ?? product.basePrice;
  const hasDiscount = product.discountPrice && product.discountPrice < product.basePrice;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      productId: product.id,
      variantId: null,
      name: product.name,
      slug: product.slug,
      price: effectivePrice,
      image: product.featuredImage,
      type: product.type,
      quantity: 1,
    });
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlistLoading(true);
    try {
      const res = await fetch('/api/user/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsWishlisted(data.isWishlisted);
      } else if (res.status === 401) {
        window.location.href = `/login?callbackUrl=/produk/${product.slug}`;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div className="group relative flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      {/* Product Image & Badges */}
      <Link href={`/produk/${product.slug}`} className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={product.featuredImage}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* Type Badge */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {product.type === 'DIGITAL' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600/90 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm shadow-sm">
              <Download className="h-3 w-3" /> Digital
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-600/90 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm shadow-sm">
              <Package className="h-3 w-3" /> Fisik
            </span>
          )}
        </div>

        {hasDiscount && (
          <div className="absolute top-3 right-3 rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
            Hemat {Math.round(((product.basePrice - product.discountPrice!) / product.basePrice) * 100)}%
          </div>
        )}

        {/* Wishlist Button Overlay */}
        <button
          onClick={handleWishlistToggle}
          disabled={wishlistLoading}
          className={`absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md shadow-sm transition-all active:scale-90 ${
            isWishlisted
              ? 'bg-rose-500 text-white'
              : 'bg-white/85 text-slate-700 hover:bg-white hover:text-rose-500 dark:bg-slate-900/85 dark:text-slate-300'
          }`}
          title={isWishlisted ? 'Hapus dari Wishlist' : 'Simpan ke Wishlist'}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current text-white' : ''}`} />
        </button>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {product.category && (
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
            {product.category.name}
          </span>
        )}

        <Link href={`/produk/${product.slug}`} className="mt-1">
          <h3 className="line-clamp-2 text-sm font-bold text-slate-900 transition-colors group-hover:text-emerald-600 dark:text-white">
            {product.name}
          </h3>
        </Link>

        {product.shortDescription && (
          <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
            {product.shortDescription}
          </p>
        )}

        {/* Pricing & Cart Action */}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-col">
            <span className="text-base font-extrabold text-slate-900 dark:text-white">
              {formatRupiah(effectivePrice)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-slate-400 line-through">
                {formatRupiah(product.basePrice)}
              </span>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-all hover:bg-emerald-600 hover:text-white active:scale-95 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-emerald-600"
            title="Tambah ke Keranjang"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
