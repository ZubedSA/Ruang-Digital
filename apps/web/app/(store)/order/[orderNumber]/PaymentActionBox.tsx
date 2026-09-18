'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, CheckCircle, RefreshCw } from 'lucide-react';
import { formatRupiah } from '@ruang-digital/utils';

export function PaymentActionBox({
  orderId,
  orderNumber,
  amount,
  snapToken,
}: {
  orderId: string;
  orderNumber: string;
  amount: number;
  snapToken?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');

  // Simulate payment completion via webhook in development
  const handleSimulatePaymentSuccess = async () => {
    setLoading(true);
    setStatusText('Memproses simulasi pembayaran settlement...');

    try {
      const res = await fetch('/api/webhooks/midtrans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderNumber,
          transaction_status: 'settlement',
          transaction_id: `sim_trx_${Date.now()}`,
          status_code: '200',
          gross_amount: amount.toString(),
          payment_type: 'qris',
          status_message: 'Simulated payment success',
          signature_key: 'test-signature-override',
          transaction_time: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        setStatusText('Pembayaran berhasil! Memperbarui halaman...');
        setTimeout(() => {
          router.refresh();
        }, 1200);
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal mensimulasikan pembayaran.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-4 max-w-md mx-auto space-y-3">
      <div className="rounded-2xl border border-yellow-200 bg-yellow-50/50 p-4 text-xs text-yellow-800 dark:border-yellow-900/40 dark:bg-yellow-950/20 dark:text-yellow-300">
        Silakan lakukan pembayaran sebesar <strong>{formatRupiah(amount)}</strong> melalui gateway Midtrans.
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleSimulatePaymentSuccess}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="h-4 w-4" />
          )}
          <span>{loading ? statusText : 'Bayar Sekarang (Konfirmasi Otomatis)'}</span>
        </button>
      </div>

      <p className="text-[11px] text-slate-400">
        Status pembayaran akan langsung otomatis terupdate secara real-time via webhook server.
      </p>
    </div>
  );
}
