import React from 'react';
import { prisma } from '@ruang-digital/db';
import { formatRupiah, formatIndonesianDateTime } from '@ruang-digital/utils';
import { DollarSign, CheckCircle2, Clock, XCircle, AlertTriangle, ShieldCheck, CreditCard } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminPaymentsPage() {
  let payments: any[] = [];
  try {
    payments = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          include: {
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });
  } catch (err) {
    console.warn('DB error fetching payments:', err);
  }

  const paidPayments = payments.filter((p) => p.status === 'PAID');
  const pendingPayments = payments.filter((p) => p.status === 'PENDING');
  const failedPayments = payments.filter((p) => p.status === 'FAILED' || p.status === 'EXPIRED');

  const totalPaidRevenue = paidPayments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-emerald-600 dark:text-emerald-500" />
          Buku Besar Pembayaran
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Rekonsiliasi transaksi pembayaran Midtrans & audit status gateway secara real-time.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm space-y-2 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 text-[11px] md:text-xs font-semibold dark:text-slate-400">
            <span>Total Penerimaan Lunas</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{formatRupiah(totalPaidRevenue)}</p>
          <p className="text-[10px] md:text-[11px] text-emerald-600 dark:text-emerald-400">{paidPayments.length} transaksi berhasil diverifikasi</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm space-y-2 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 text-[11px] md:text-xs font-semibold dark:text-slate-400">
            <span>Menunggu Pembayaran</span>
            <Clock className="h-4 w-4 text-amber-500 dark:text-amber-400" />
          </div>
          <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{pendingPayments.length}</p>
          <p className="text-[10px] md:text-[11px] text-amber-600 dark:text-amber-400">Menunggu penyelesaian di Midtrans</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm space-y-2 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 text-[11px] md:text-xs font-semibold dark:text-slate-400">
            <span>Gagal / Kadaluarsa</span>
            <XCircle className="h-4 w-4 text-rose-500 dark:text-rose-400" />
          </div>
          <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{failedPayments.length}</p>
          <p className="text-[10px] md:text-[11px] text-slate-400 dark:text-slate-500">Batal atau waktu pembayaran habis</p>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400">
              <tr>
                <th className="p-4">Pesanan & Pelanggan</th>
                <th className="p-4">Provider Gateway</th>
                <th className="p-4">Metode Bayar</th>
                <th className="p-4">Nominal</th>
                <th className="p-4">Status</th>
                <th className="p-4">Waktu Transaksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    Belum ada catatan pembayaran.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  let statusBadge = (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {p.status}
                    </span>
                  );

                  if (p.status === 'PAID') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Lunas
                      </span>
                    );
                  } else if (p.status === 'PENDING') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200 dark:border-amber-800 dark:bg-amber-950/80 dark:text-amber-400">
                        <Clock className="h-3 w-3" />
                        Menunggu
                      </span>
                    );
                  } else if (p.status === 'FAILED' || p.status === 'EXPIRED') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200 dark:border-rose-800 dark:bg-rose-950/80 dark:text-rose-400">
                        <XCircle className="h-3 w-3" />
                        {p.status}
                      </span>
                    );
                  }

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/50">
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 dark:text-white text-xs">
                            #{p.order?.orderNumber || 'ORD-UNKNOWN'}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {p.order?.user?.name} ({p.order?.user?.email})
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                          <CreditCard className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" />
                          {p.provider}
                        </span>
                        {p.transactionId && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate max-w-[160px]">
                            {p.transactionId}
                          </p>
                        )}
                      </td>
                      <td className="p-4 font-mono text-[11px] text-slate-600 dark:text-slate-300 uppercase">
                        {p.paymentMethod || 'SNAP-VA'}
                      </td>
                      <td className="p-4 font-bold text-slate-900 dark:text-white">
                        {formatRupiah(p.amount)}
                      </td>
                      <td className="p-4">{statusBadge}</td>
                      <td className="p-4 text-[11px] text-slate-500 dark:text-slate-400">
                        {p.paidAt
                          ? formatIndonesianDateTime(p.paidAt)
                          : formatIndonesianDateTime(p.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {payments.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
            Belum ada catatan pembayaran.
          </div>
        ) : (
          payments.map((p) => {
            let statusBadge = (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {p.status}
              </span>
            );
            if (p.status === 'PAID') {
              statusBadge = (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> Lunas
                </span>
              );
            } else if (p.status === 'PENDING') {
              statusBadge = (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200 dark:border-amber-800 dark:bg-amber-950/80 dark:text-amber-400">
                  <Clock className="h-3 w-3" /> Menunggu
                </span>
              );
            } else if (p.status === 'FAILED' || p.status === 'EXPIRED') {
              statusBadge = (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200 dark:border-rose-800 dark:bg-rose-950/80 dark:text-rose-400">
                  <XCircle className="h-3 w-3" /> {p.status}
                </span>
              );
            }

            return (
              <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2.5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">#{p.order?.orderNumber || 'ORD-UNKNOWN'}</span>
                  {statusBadge}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate mr-2">{p.order?.user?.name}</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white shrink-0">{formatRupiah(p.amount)}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    <span>{p.provider} • {p.paymentMethod || 'SNAP-VA'}</span>
                  </div>
                  <span>{p.paidAt ? formatIndonesianDateTime(p.paidAt) : formatIndonesianDateTime(p.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
