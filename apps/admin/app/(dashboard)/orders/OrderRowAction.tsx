'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, Check, Edit3, X } from 'lucide-react';

export function OrderRowAction({
  orderId,
  currentStatus,
  hasPhysical,
  currentTrackingNumber,
}: {
  orderId: string;
  currentStatus: string;
  hasPhysical: boolean;
  currentTrackingNumber?: string | null;
}) {
  const router = useRouter();
  const [openModal, setOpenModal] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [trackingNumber, setTrackingNumber] = useState(currentTrackingNumber || '');
  const [courier, setCourier] = useState('JNE');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          status,
          courier,
          trackingNumber: trackingNumber || undefined,
        }),
      });

      if (res.ok) {
        setOpenModal(false);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal update status pesanan.');
      }
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setOpenModal(true)}
        className="rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        Kelola
      </button>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm text-left">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Ubah Status Pesanan</h3>
              <button
                onClick={() => setOpenModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pilih Status Pesanan:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="PENDING">PENDING (Menunggu Pembayaran)</option>
                <option value="PAID">PAID (Pembayaran Lunas)</option>
                <option value="PROCESSING">PROCESSING (Sedang Diproses)</option>
                <option value="SHIPPED">SHIPPED (Dalam Pengiriman)</option>
                <option value="DELIVERED">DELIVERED (Terkirim)</option>
                <option value="COMPLETED">COMPLETED (Selesai)</option>
                <option value="CANCELLED">CANCELLED (Dibatalkan)</option>
              </select>
            </div>

            {hasPhysical && (
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5" />
                  <span>Informasi Logistik Produk Fisik:</span>
                </h4>

                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Nama Kurir</label>
                  <input
                    type="text"
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    placeholder="JNE / J&T / SiCepat"
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Nomor Resi Pengiriman</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Contoh: JNE8291029482"
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleUpdate}
                disabled={loading}
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Perbarui Pesanan'}
              </button>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
