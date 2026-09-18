'use client';

import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react';
import { formatIndonesianDateTime } from '@ruang-digital/utils';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string | Date;
  user: {
    name: string;
  };
}

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [averageRating, setAverageRating] = useState(5.0);
  const [loading, setLoading] = useState(true);

  // Form states
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setReviews(data.data);
        setTotalReviews(data.totalReviews);
        setAverageRating(data.averageRating);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, comment }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim ulasan');
      }

      setSuccessMsg(data.message || 'Ulasan berhasil dikirim!');
      setComment('');
      fetchReviews();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-8">
      {/* Header & Rating Breakdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-600" />
            Ulasan & Kepuasan Pembeli
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ulasan asli dari pelanggan terverifikasi yang telah membeli produk ini.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= Math.round(averageRating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-slate-300 dark:text-slate-700'
                }`}
              />
            ))}
          </div>
          <div className="text-left">
            <span className="text-xl font-black text-slate-900 dark:text-white">{averageRating}</span>
            <span className="text-xs text-slate-400 ml-1">/ 5 ({totalReviews} ulasan)</span>
          </div>
        </div>
      </div>

      {/* Form Submission */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/40 space-y-4">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Tulis Ulasan Anda
        </h4>

        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmitReview} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Rating Penilaian
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  type="button"
                  key={s}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => setRating(s)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      s <= (hoverRating ?? rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-2">
                {rating} dari 5 Bintang
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Ulasan Pengalaman Anda
            </label>
            <textarea
              rows={3}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ceritakan pengalaman Anda menggunakan produk ini..."
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-400">
              * Khusus akun pembeli terverifikasi yang telah menyelesaikan pembayaran.
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Kirim Ulasan
            </button>
          </div>
        </form>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
          <span>Memuat ulasan produk...</span>
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-8 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-700 mb-2" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Belum ada ulasan untuk produk ini.
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Jadilah pembeli pertama yang memberikan penilaian!
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {reviews.map((rev) => (
            <div key={rev.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs">
                    {rev.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {rev.user?.name}
                    </p>
                    <p className="text-[10px] text-slate-400">Pembeli Terverifikasi</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3.5 w-3.5 ${
                        star <= rev.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-slate-300 dark:text-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {rev.comment && (
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-9">
                  {rev.comment}
                </p>
              )}

              <p className="text-[10px] text-slate-400 pl-9">
                {formatIndonesianDateTime(rev.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
