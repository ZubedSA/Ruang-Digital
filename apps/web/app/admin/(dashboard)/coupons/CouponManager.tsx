'use client';

import React, { useState } from 'react';
import { Ticket, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, Loader2, Percent, DollarSign, Search } from 'lucide-react';
import { formatRupiah, formatIndonesianDateTime } from '@ruang-digital/utils';

interface CouponItem {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minPurchase: number;
  maxDiscount: number | null;
  quota: number;
  usedCount: number;
  startDate: string | Date;
  endDate: string | Date;
  isActive: boolean;
  createdAt: string | Date;
  _count?: {
    usages: number;
  };
}

interface CouponManagerProps {
  initialCoupons: CouponItem[];
}

export function CouponManager({ initialCoupons }: CouponManagerProps) {
  const [coupons, setCoupons] = useState<CouponItem[]>(initialCoupons);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    discountValue: 10,
    minPurchase: 0,
    maxDiscount: '',
    quota: 100,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minPurchase: 0,
      maxDiscount: '',
      quota: 100,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
    });
    setEditingId(null);
    setIsModalOpen(false);
    setErrorMsg(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: CouponItem) => {
    setEditingId(c.id);
    setFormData({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minPurchase: c.minPurchase,
      maxDiscount: c.maxDiscount ? String(c.maxDiscount) : '',
      quota: c.quota,
      startDate: new Date(c.startDate).toISOString().split('T')[0],
      endDate: new Date(c.endDate).toISOString().split('T')[0],
      isActive: c.isActive,
    });
    setIsModalOpen(true);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const url = '/api/admin/coupons';
      const method = editingId ? 'PUT' : 'POST';
      const payload = {
        ...formData,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        ...(editingId ? { id: editingId } : {}),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan kupon');

      if (editingId) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === editingId ? { ...c, ...data.data } : c))
        );
        setSuccessMsg('Kupon berhasil diperbarui.');
      } else {
        setCoupons((prev) => [data.data, ...prev]);
        setSuccessMsg('Kupon diskon baru berhasil dibuat.');
      }

      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kupon diskon ini?')) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus kupon');

      setCoupons((prev) => prev.filter((c) => c.id !== id));
      setSuccessMsg('Kupon berhasil dihapus.');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredCoupons = coupons.filter((c) =>
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Ticket className="h-6 w-6 text-amber-500 dark:text-amber-400" />
            Manajemen Kupon & Promo Diskon
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Buat voucher promo potongan persentase atau nominal tetap untuk mendongkrak konversi checkout.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-sm hover:bg-amber-400 transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Buat Kupon Baru
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <input
          type="text"
          placeholder="Cari kode kupon..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 pl-9 text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-amber-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-500"
        />
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
      </div>

      {/* Table — Desktop Only */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400">
              <tr>
                <th className="p-4">Kode Voucher</th>
                <th className="p-4">Tipe & Nilai Diskon</th>
                <th className="p-4">Syarat & Batasan</th>
                <th className="p-4">Pemakaian / Kuota</th>
                <th className="p-4">Periode Berlaku</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    Belum ada kupon promo ditemukan.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((c) => {
                  const isExpired = new Date(c.endDate).getTime() < Date.now();
                  const isExhausted = c.usedCount >= c.quota;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-mono font-black tracking-wider text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/80 dark:text-amber-300">
                            {c.code}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                          {c.discountType === 'PERCENTAGE' ? (
                            <>
                              <Percent className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                              <span>{c.discountValue}% OFF</span>
                            </>
                          ) : (
                            <>
                              <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Potongan {formatRupiah(c.discountValue)}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-4 space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <p>Min. Belanja: {c.minPurchase > 0 ? formatRupiah(c.minPurchase) : 'Tanpa Min.'}</p>
                        {c.maxDiscount && (
                          <p>Maks. Diskon: {formatRupiah(c.maxDiscount)}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{c.usedCount}</span>
                            <span className="text-slate-400 dark:text-slate-500">/ {c.quota}</span>
                          </div>
                          <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{ width: `${Math.min(100, (c.usedCount / c.quota) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                        <p>{formatIndonesianDateTime(c.startDate).split('pukul')[0]}</p>
                        <p className="text-slate-400 dark:text-slate-500">s/d {formatIndonesianDateTime(c.endDate).split('pukul')[0]}</p>
                      </td>
                      <td className="p-4">
                        {!c.isActive ? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Nonaktif
                          </span>
                        ) : isExpired ? (
                          <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:border-rose-800 dark:bg-rose-950/80 dark:text-rose-400">
                            Kadaluarsa
                          </span>
                        ) : isExhausted ? (
                          <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-950/80 dark:text-amber-400">
                            Habis
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400">
                            Aktif
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-amber-600 transition-colors dark:hover:bg-slate-800 dark:hover:text-amber-400"
                            title="Ubah Kupon"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-red-600 transition-colors dark:hover:bg-slate-800 dark:hover:text-red-400"
                            title="Hapus Kupon"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {filteredCoupons.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
            Belum ada kupon promo ditemukan.
          </div>
        ) : (
          filteredCoupons.map((c) => {
            const isExpired = new Date(c.endDate).getTime() < Date.now();
            const isExhausted = c.usedCount >= c.quota;

            return (
              <div
                key={c.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Header: Code & Status */}
                <div className="flex items-center justify-between">
                  <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-mono font-black tracking-wider text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/80 dark:text-amber-300">
                    {c.code}
                  </span>
                  {!c.isActive ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      Nonaktif
                    </span>
                  ) : isExpired ? (
                    <span className="rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 dark:border-rose-800 dark:bg-rose-950/80 dark:text-rose-400">
                      Kadaluarsa
                    </span>
                  ) : isExhausted ? (
                    <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-950/80 dark:text-amber-400">
                      Habis
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400">
                      Aktif
                    </span>
                  )}
                </div>

                {/* Discount Info */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-white">
                    {c.discountType === 'PERCENTAGE' ? (
                      <>
                        <Percent className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                        <span>{c.discountValue}% OFF</span>
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Potongan {formatRupiah(c.discountValue)}</span>
                      </>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {c.minPurchase > 0 ? `Min. ${formatRupiah(c.minPurchase)}` : 'Tanpa Min.'}
                  </div>
                </div>

                {/* Usage Bar & Validity */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Pemakaian</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {c.usedCount} <span className="text-slate-400 dark:text-slate-500 font-normal">/ {c.quota}</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${Math.min(100, (c.usedCount / c.quota) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-0.5">
                    Berlaku s/d {formatIndonesianDateTime(c.endDate).split('pukul')[0]}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:text-white"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                    <span>Ubah</span>
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-colors dark:border-slate-700 dark:bg-slate-800/60 dark:text-rose-400 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingId ? 'Ubah Kupon Promo' : 'Buat Kupon Promo Baru'}
              </h3>
              <button
                onClick={resetForm}
                className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Kode Voucher Promo</label>
                  <input
                    type="text"
                    required
                    placeholder="HEMAT20"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 font-mono uppercase text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tipe Diskon</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  >
                    <option value="PERCENTAGE">Persentase (%)</option>
                    <option value="FIXED">Potongan Tetap (Rp)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {formData.discountType === 'PERCENTAGE' ? 'Nilai Persentase (%)' : 'Nilai Potongan (Rp)'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Maksimal Diskon (Rp - Opsional)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 50000"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Minimal Belanja (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.minPurchase}
                    onChange={(e) => setFormData({ ...formData, minPurchase: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Kuota Pemakaian</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.quota}
                    onChange={(e) => setFormData({ ...formData, quota: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tanggal Berakhir</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="couponActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 bg-white text-amber-500 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-950"
                />
                <label htmlFor="couponActive" className="text-slate-700 dark:text-slate-300">
                  Status Kupon Aktif
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 font-bold text-slate-950 shadow-sm hover:bg-amber-400 disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {editingId ? 'Simpan Perubahan' : 'Buat Kupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
