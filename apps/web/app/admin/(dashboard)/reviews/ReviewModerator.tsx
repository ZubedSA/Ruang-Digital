'use client';

import React, { useState } from 'react';
import { Star, Trash2, Search, Check, EyeOff } from 'lucide-react';
import { formatIndonesianDateTime } from '@ruang-digital/utils';

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  createdAt: string | Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
  product: {
    id: string;
    name: string;
    slug: string;
  };
}

interface ReviewModeratorProps {
  initialReviews: ReviewItem[];
}

export function ReviewModerator({ initialReviews }: ReviewModeratorProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggleApproval = async (id: string, currentStatus: boolean) => {
    setLoadingId(id);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isApproved: !currentStatus }),
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isApproved: !currentStatus } : r))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus ulasan ini?')) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  const filteredReviews = reviews.filter(
    (r) =>
      r.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.comment && r.comment.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Star className="h-6 w-6 text-yellow-400 fill-yellow-400" />
            Moderasi Ulasan & Rating Pembeli
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pantau dan setujui ulasan yang diberikan pelanggan untuk menjaga kualitas toko.
          </p>
        </div>

        <div className="relative max-w-sm w-full">
          <input
            type="text"
            placeholder="Cari pembeli, produk, isi ulasan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 pl-9 text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-500"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
        </div>
      </div>

      {/* Table — Desktop Only */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400">
              <tr>
                <th className="p-4">Produk</th>
                <th className="p-4">Pelanggan</th>
                <th className="p-4">Rating & Komentar</th>
                <th className="p-4">Waktu</th>
                <th className="p-4">Status Tampil</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    Belum ada ulasan yang masuk.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/50">
                    <td className="p-4 font-bold text-slate-900 dark:text-white text-xs max-w-[200px] truncate">
                      {rev.product?.name}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-200">{rev.user?.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{rev.user?.email}</p>
                    </td>
                    <td className="p-4 max-w-sm">
                      <div className="flex items-center gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3.5 w-3.5 ${
                              star <= rev.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-slate-200 dark:text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-slate-700 text-[11px] leading-relaxed italic dark:text-slate-300">
                        &quot;{rev.comment || 'Tidak ada komentar tertulis'}&quot;
                      </p>
                    </td>
                    <td className="p-4 text-[11px] text-slate-500 dark:text-slate-400">
                      {formatIndonesianDateTime(rev.createdAt)}
                    </td>
                    <td className="p-4">
                      {rev.isApproved ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400">
                          <Check className="h-3 w-3" />
                          Disetujui
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          <EyeOff className="h-3 w-3" />
                          Disembunyikan
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleApproval(rev.id, rev.isApproved)}
                          disabled={loadingId === rev.id}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                            rev.isApproved
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                              : 'bg-emerald-600 text-white hover:bg-emerald-500'
                          }`}
                        >
                          {rev.isApproved ? 'Sembunyikan' : 'Setujui'}
                        </button>
                        <button
                          onClick={() => handleDelete(rev.id)}
                          disabled={loadingId === rev.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-red-600 transition-colors dark:hover:bg-slate-800 dark:hover:text-red-400"
                          title="Hapus Ulasan"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {filteredReviews.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
            Belum ada ulasan yang masuk.
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs line-clamp-1">{rev.product?.name}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{rev.user?.name} ({rev.user?.email})</p>
                </div>
                {rev.isApproved ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 shrink-0 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400">
                    <Check className="h-3 w-3" />
                    Disetujui
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 shrink-0 dark:bg-slate-800 dark:text-slate-400">
                    <EyeOff className="h-3 w-3" />
                    Disembunyikan
                  </span>
                )}
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-1.5 dark:border-slate-800/80 dark:bg-slate-950/50">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3.5 w-3.5 ${
                        star <= rev.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-slate-200 dark:text-slate-700'
                      }`}
                    />
                  ))}
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-1.5">
                    {formatIndonesianDateTime(rev.createdAt).split('pukul')[0]}
                  </span>
                </div>
                <p className="text-slate-700 text-xs italic dark:text-slate-300">
                  &quot;{rev.comment || 'Tidak ada komentar tertulis'}&quot;
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleToggleApproval(rev.id, rev.isApproved)}
                  disabled={loadingId === rev.id}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                    rev.isApproved
                      ? 'border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500'
                  }`}
                >
                  {rev.isApproved ? 'Sembunyikan' : 'Setujui'}
                </button>
                <button
                  onClick={() => handleDelete(rev.id)}
                  disabled={loadingId === rev.id}
                  className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 transition-colors dark:border-slate-700 dark:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-red-400"
                  title="Hapus Ulasan"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
