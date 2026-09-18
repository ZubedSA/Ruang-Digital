'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartContext';
import { formatRupiah } from '@ruang-digital/utils';
import {
  ShieldCheck,
  Truck,
  Download,
  Lock,
  CheckCircle2,
  AlertCircle,
  Ticket,
  MapPin,
  Plus,
  Loader2,
  Tag,
  Check,
} from 'lucide-react';

interface SavedAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  subdistrict: string | null;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCart();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Customer basics
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Address selection state
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);

  // New address form fields
  const [newLabel, setNewLabel] = useState('Rumah');
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [street, setStreet] = useState('');
  const [subdistrict, setSubdistrict] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const [calculation, setCalculation] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load user session and addresses
  useEffect(() => {
    async function checkAuthAndAddresses() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
          setName(data.user.name || '');
          setEmail(data.user.email || '');

          // Fetch saved addresses
          const addrRes = await fetch('/api/user/addresses');
          const addrData = await addrRes.json();
          if (addrRes.ok && addrData.success && addrData.data.length > 0) {
            setSavedAddresses(addrData.data);
            const defaultAddr = addrData.data.find((a: SavedAddress) => a.isDefault) || addrData.data[0];
            setSelectedAddressId(defaultAddr.id);
            setUseNewAddress(false);
          } else {
            setUseNewAddress(true);
          }
        }
      } catch (err) {
        console.error('Failed to get user session', err);
      } finally {
        setLoadingUser(false);
      }
    }
    checkAuthAndAddresses();
  }, []);

  // Recalculate cart whenever items or applied coupon changes
  const runCalculation = async (couponCodeToUse?: string | null) => {
    if (items.length === 0) return;
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
          couponCode: couponCodeToUse || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCalculation(data);
      }
    } catch (e) {
      console.error('Calculation error', e);
    }
  };

  useEffect(() => {
    runCalculation(appliedCoupon?.code);
  }, [items, appliedCoupon]);

  const hasPhysical = calculation?.hasPhysicalItems || items.some((it) => it.type === 'PHYSICAL');

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponMsg(null);

    const subtotal = calculation?.subtotal || items.reduce((a, b) => a + b.price * b.quantity, 0);

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponInput.trim(),
          subtotal,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        setCouponMsg({ text: data.error || 'Voucher promo tidak valid', isError: true });
      } else {
        setAppliedCoupon(data.data);
        setCouponMsg({ text: data.message, isError: false });
        runCalculation(data.data.code);
      }
    } catch (err: any) {
      setCouponMsg({ text: err.message || 'Gagal memvalidasi kupon', isError: true });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponMsg(null);
    runCalculation(null);
  };

  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!currentUser) {
      router.push(`/login?callbackUrl=/checkout`);
      return;
    }

    if (!name || !email) {
      setErrorMessage('Mohon lengkapi nama dan alamat email Anda.');
      return;
    }

    let finalAddressId = selectedAddressId;

    // If order has physical products and user is inputting a new address
    if (hasPhysical) {
      if (useNewAddress || !finalAddressId) {
        if (!street || !city || !province || !postalCode) {
          setErrorMessage('Mohon lengkapi seluruh kolom alamat pengiriman fisik.');
          return;
        }

        // Save address to user's address book
        try {
          const addrRes = await fetch('/api/user/addresses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              label: newLabel || 'Rumah',
              recipientName: newRecipientName || name,
              phone: newPhone || phone,
              street,
              subdistrict,
              city,
              province,
              postalCode,
              isDefault: savedAddresses.length === 0,
            }),
          });
          const addrData = await addrRes.json();
          if (!addrRes.ok) {
            throw new Error(addrData.error || 'Gagal menyimpan alamat pengiriman.');
          }
          finalAddressId = addrData.data.id;
        } catch (addrErr: any) {
          setErrorMessage(addrErr.message);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          customerNotes: notes,
          couponCode: appliedCoupon?.code || null,
          items: items.map((it) => ({
            productId: it.productId,
            variantId: it.variantId,
            quantity: it.quantity,
          })),
          shippingAddressId: hasPhysical ? finalAddressId : null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memproses checkout.');
      }

      clearCart();
      router.push(`/order/${data.result.orderNumber}?token=${data.result.snapToken || ''}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan pemrosesan pesanan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h2 className="text-xl font-bold">Keranjang Anda Kosong</h2>
        <p className="text-xs text-slate-500 mt-2">Silakan pilih produk terlebih dahulu.</p>
        <button
          onClick={() => router.push('/produk')}
          className="mt-6 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white"
        >
          Lihat Produk
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="pb-6 mb-8 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Selesaikan Pesanan
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Lengkapi data pemesan dan konfirmasi pembayaran aman Anda
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-xs font-semibold text-rose-700 border border-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleProcessCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* Customer Information Box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>1. Data Pemesan</span>
            </h3>

            {!currentUser && !loadingUser && (
              <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
                Anda belum masuk.{' '}
                <a href="/login?callbackUrl=/checkout" className="font-bold underline">
                  Masuk ke akun Anda
                </a>{' '}
                agar pesanan otomatis tercatat di dashboard.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="Budi Santoso"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Alamat Email (Akses File & Notifikasi) *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="budi@example.com"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Nomor WhatsApp / HP
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="081234567890"
                />
              </div>
            </div>
          </div>

          {/* Conditional Shipping Address (Only for Physical Products) */}
          {hasPhysical ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="h-4 w-4 text-amber-600" />
                <span>2. Alamat Pengiriman (Produk Fisik)</span>
              </h3>

              {/* Saved Addresses Selector */}
              {savedAddresses.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Pilih dari Buku Alamat Tersimpan:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedAddresses.map((addr) => {
                      const isSelected = !useNewAddress && selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => {
                            setSelectedAddressId(addr.id);
                            setUseNewAddress(false);
                          }}
                          className={`cursor-pointer rounded-xl border p-3.5 transition-all text-xs space-y-1 ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20 ring-1 ring-emerald-500'
                              : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-white">{addr.label}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 font-medium">{addr.recipientName} ({addr.phone})</p>
                          <p className="text-[11px] text-slate-500 line-clamp-2">
                            {addr.street}, {addr.city}, {addr.province} {addr.postalCode}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setUseNewAddress(!useNewAddress)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline pt-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{useNewAddress ? 'Gunakan Alamat Tersimpan' : 'Gunakan Alamat Pengiriman Baru'}</span>
                  </button>
                </div>
              )}

              {/* New Address Input Form */}
              {(useNewAddress || savedAddresses.length === 0) && (
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                        Label Alamat
                      </label>
                      <input
                        type="text"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder="Rumah / Kantor"
                        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                        Nama Penerima
                      </label>
                      <input
                        type="text"
                        value={newRecipientName}
                        onChange={(e) => setNewRecipientName(e.target.value)}
                        placeholder="Nama Lengkap Penerima"
                        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                      Alamat Lengkap (Jalan, No. Rumah, RT/RW) *
                    </label>
                    <textarea
                      required={useNewAddress || savedAddresses.length === 0}
                      rows={2}
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      placeholder="Jl. Merdeka Barat No. 12"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                        Kota / Kabupaten *
                      </label>
                      <input
                        type="text"
                        required={useNewAddress || savedAddresses.length === 0}
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        placeholder="Jakarta Selatan"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                        Provinsi *
                      </label>
                      <input
                        type="text"
                        required={useNewAddress || savedAddresses.length === 0}
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        placeholder="DKI Jakarta"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                        Kode Pos *
                      </label>
                      <input
                        type="text"
                        required={useNewAddress || savedAddresses.length === 0}
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        placeholder="12190"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 text-xs text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300 flex items-center gap-3">
              <Download className="h-5 w-5 shrink-0" />
              <span>
                <strong>Pesanan Digital Murni:</strong> Tidak memerlukan alamat fisik. File dan lisensi akan langsung aktif di akun Anda setelah pembayaran lunas.
              </span>
            </div>
          )}

          {/* Customer Notes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
              Catatan untuk Penjual (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
              placeholder="Contoh: Titipkan di pos satpam"
            />
          </div>
        </div>

        {/* Right Column: Order Summary, Coupon Box & Pay Button */}
        <div className="lg:col-span-5 space-y-6">
          {/* Coupon Promo Box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <Ticket className="h-4 w-4 text-amber-500" />
              <span>Voucher Kupon Promo</span>
            </div>

            {appliedCoupon ? (
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-3 dark:bg-emerald-950/40 dark:border-emerald-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <div>
                    <p className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                      {appliedCoupon.code}
                    </p>
                    <p className="text-[10px] text-emerald-600">
                      Hemat {formatRupiah(calculation?.discountAmount || appliedCoupon.discountAmount)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  Hapus
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Masukkan kode voucher..."
                    className="h-9 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-mono uppercase focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                  />
                  <button
                    type="button"
                    disabled={couponLoading || !couponInput.trim()}
                    onClick={handleApplyCoupon}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-700 transition-colors"
                  >
                    {couponLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                    <span>Terapkan</span>
                  </button>
                </div>
                {couponMsg && (
                  <p
                    className={`text-[11px] ${
                      couponMsg.isError ? 'text-rose-600' : 'text-emerald-600 font-semibold'
                    }`}
                  >
                    {couponMsg.text}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Order Summary Box */}
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Ringkasan Item ({items.length})
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto pr-1">
              {items.map((it) => (
                <div key={it.productId} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <img src={it.image} alt={it.name} className="h-10 w-10 rounded-lg object-cover" />
                    <div>
                      <p className="font-bold line-clamp-1">{it.name}</p>
                      <p className="text-slate-400">Qty: {it.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold">{formatRupiah(it.price * it.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>
                  {formatRupiah(
                    calculation?.subtotal || items.reduce((a, b) => a + b.price * b.quantity, 0)
                  )}
                </span>
              </div>
              {hasPhysical && (
                <div className="flex justify-between text-slate-500">
                  <span>Ongkos Kirim Flat (JNE/SiCepat)</span>
                  <span>{formatRupiah(calculation?.shippingFee || 15000)}</span>
                </div>
              )}
              {calculation?.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Diskon Kupon Promo</span>
                  <span>- {formatRupiah(calculation.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>Total Bayar</span>
                <span className="text-emerald-600">
                  {formatRupiah(
                    calculation?.total || items.reduce((a, b) => a + b.price * b.quantity, 0)
                  )}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              <Lock className="h-4 w-4" />
              <span>{isSubmitting ? 'Memproses Pesanan...' : 'Bayar Sekarang (Midtrans)'}</span>
            </button>

            <p className="text-center text-[11px] text-slate-400">
              Dengan mengklik Bayar, Anda menyetujui syarat & ketentuan layanan Ruang Digital.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
