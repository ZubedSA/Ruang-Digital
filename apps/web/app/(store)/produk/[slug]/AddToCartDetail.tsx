'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Check, Plus, Minus, Zap } from 'lucide-react';
import { useCart } from '@/components/CartContext';
import { formatRupiah } from '@ruang-digital/utils';

export function AddToCartDetail({ product }: { product: any }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants?.length > 0 ? product.variants[0].id : null
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const selectedVariant = product.variants?.find((v: any) => v.id === selectedVariantId);
  const currentPrice = selectedVariant ? selectedVariant.price : (product.discountPrice ?? product.basePrice);
  const availableStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isOutOfStock = product.type === 'PHYSICAL' && availableStock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    addItem({
      productId: product.id,
      variantId: selectedVariantId,
      name: selectedVariant ? `${product.name} (${selectedVariant.name})` : product.name,
      slug: product.slug,
      price: currentPrice,
      image: product.featuredImage,
      type: product.type,
      quantity,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/cart');
  };

  return (
    <div className="space-y-4">
      {/* Variant Selector (if any) */}
      {product.variants && product.variants.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
            Pilih Varian:
          </label>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant: any) => {
              const isSelected = selectedVariantId === variant.id;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={`rounded-xl border px-3.5 py-2 text-xs font-medium transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  {variant.name} — {formatRupiah(variant.price)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity Modifier */}
      <div className="flex items-center gap-4">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
          Jumlah:
        </label>
        <div className="flex items-center rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-10 text-center text-xs font-bold text-slate-900 dark:text-white">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity(product.type === 'PHYSICAL' ? Math.min(availableStock, quantity + 1) : quantity + 1)}
            className="flex h-9 w-9 items-center justify-center text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 transition-all dark:bg-emerald-600 dark:hover:bg-emerald-700"
        >
          {added ? (
            <>
              <Check className="h-4 w-4 text-emerald-400" />
              <span>Berhasil Ditambahkan!</span>
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              <span>{isOutOfStock ? 'Stok Habis' : 'Tambah ke Keranjang'}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleBuyNow}
          disabled={isOutOfStock}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-600 bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-all"
        >
          <Zap className="h-4 w-4" />
          <span>Beli Sekarang</span>
        </button>
      </div>
    </div>
  );
}
