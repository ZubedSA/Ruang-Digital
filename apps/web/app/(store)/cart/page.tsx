'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartContext';
import { formatRupiah } from '@ruang-digital/utils';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Tag, ShieldCheck, Download, Package } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart } = useCart();
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [serverCalculation, setServerCalculation] = useState<any>(null);
  const [loadingCalc, setLoadingCalc] = useState(false);

  // Sync with server calculation API whenever cart items change
  useEffect(() => {
    async function calculate() {
      if (items.length === 0) {
        setServerCalculation(null);
        return;
      }

      setLoadingCalc(true);
      try {
        const res = await fetch('/api/cart/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map((it) => ({
              productId: it.productId,
              variantId: it.variantId,
              quantity: it.quantity,
            })),
            couponCode: appliedCoupon,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setServerCalculation(data);
        }
      } catch (err) {
        console.error('Failed to sync server calculation', err);
      } finally {
        setLoadingCalc(false);
      }
    }

    calculate();
  }, [items, appliedCoupon]);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponInput.trim()) {
      setAppliedCoupon(couponInput.trim().toUpperCase());
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-6">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Keranjang Masih Kosong
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
          Anda belum menambahkan produk apa pun ke keranjang belanja Anda.
        </p>
        <div className="mt-8">
          <Link
            href="/produk"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            Mulai Belanja Sekarang
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = serverCalculation ? serverCalculation.subtotal : items.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const discount = serverCalculation?.discountAmount || 0;
  const shipping = serverCalculation?.shippingFee || 0;
  const total = serverCalculation ? serverCalculation.total : subtotal;
  const hasPhysical = serverCalculation?.hasPhysicalItems || items.some((it) => it.type === 'PHYSICAL');

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Keranjang Belanja
        </h1>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700"
        >
          Kosongkan Keranjang
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cart Item List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantId || 'base'}`}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-20 w-20 rounded-xl object-cover border border-slate-100 dark:border-slate-800 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {item.type === 'DIGITAL' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        <Download className="h-3 w-3" /> Digital
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                        <Package className="h-3 w-3" /> Fisik
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/produk/${item.slug}`}
                    className="text-sm font-bold text-slate-900 hover:text-emerald-600 dark:text-white line-clamp-1"
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs font-semibold text-emerald-600 mt-1">
                    {formatRupiah(item.price)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between w-full sm:w-auto gap-4 self-end sm:self-center">
                {/* Qty controller */}
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                  <button
                    onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                    className="flex h-8 w-8 items-center justify-center text-slate-600 hover:bg-slate-200/50"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-slate-900 dark:text-white">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                    className="flex h-8 w-8 items-center justify-center text-slate-600 hover:bg-slate-200/50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Subtotal per item */}
                <span className="text-sm font-extrabold text-slate-900 dark:text-white min-w-20 text-right">
                  {formatRupiah(item.price * item.quantity)}
                </span>

                {/* Delete button */}
                <button
                  onClick={() => removeItem(item.productId, item.variantId)}
                  className="rounded-lg p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Box */}
        <div className="lg:col-span-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Ringkasan Pesanan
            </h2>

            {/* Coupon Code Input */}
            <div>
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Kode kupon (contoh: DISKONHEMAT)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="h-10 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs uppercase focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                />
                <button
                  type="submit"
                  className="h-10 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800"
                >
                  Pakai
                </button>
              </form>
              {appliedCoupon && (
                <div className="mt-2 flex items-center justify-between text-xs text-emerald-600 bg-emerald-50 p-2 rounded-lg dark:bg-emerald-950/50">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Tag className="h-3.5 w-3.5" />
                    <span>Kupon {appliedCoupon} diterapkan</span>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-slate-400 hover:text-rose-600 font-bold">
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Breakdown */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal ({items.length} item)</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Diskon Kupon</span>
                  <span>- {formatRupiah(discount)}</span>
                </div>
              )}

              {hasPhysical ? (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Ongkos Kirim (Flat Rate)</span>
                  <span>{formatRupiah(shipping)}</span>
                </div>
              ) : (
                <div className="flex justify-between text-indigo-600 font-medium">
                  <span>Pengiriman Digital</span>
                  <span>Gratis (Download Langsung)</span>
                </div>
              )}

              <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white pt-3 border-t border-slate-100 dark:border-slate-800">
                <span>Total Pembayaran</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(total)}
                </span>
              </div>
            </div>

            <button
              onClick={() => router.push('/checkout')}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              <span>Lanjut ke Pembayaran</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-2">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Transaksi dienkripsi & dilindungi Midtrans</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
