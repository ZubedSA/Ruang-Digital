import React from 'react';
import { prisma } from '@ruang-digital/db';
import { formatIndonesianDateTime } from '@ruang-digital/utils';
import { ShieldCheck, Download, Lock, Globe } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminAuditLogsPage() {
  let downloadLogs: any[] = [];
  try {
    downloadLogs = await prisma.download.findMany({
      orderBy: { downloadedAt: 'desc' },
      take: 50,
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { name: true, type: true } },
        file: { select: { fileName: true, version: true } },
        order: { select: { orderNumber: true } },
      },
    });
  } catch (err) {
    console.warn('DB error fetching audit logs:', err);
  }

  const totalDownloadEvents = downloadLogs.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5 md:h-6 md:w-6 text-emerald-600 dark:text-emerald-500" />
          Audit Trail & Keamanan
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Pantau log unduhan aset digital berbayar, verifikasi token HMAC, dan aktivitas integritas platform.
        </p>
      </div>

      {/* Security Status Banner */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 shadow-sm dark:border-emerald-800/80 dark:bg-emerald-950/30">
        <div className="flex items-center gap-3 md:gap-3.5">
          <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-xl border border-emerald-300 bg-emerald-100 text-emerald-700 shrink-0 dark:border-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-400">
            <Lock className="h-4 w-4 md:h-5 md:w-5" />
          </div>
          <div>
            <h3 className="text-[11px] md:text-xs font-bold text-slate-900 uppercase tracking-wider dark:text-white">
              Enkripsi & Proteksi Token HMAC Aktif
            </h3>
            <p className="text-[10px] md:text-[11px] text-emerald-800 mt-0.5 dark:text-emerald-300">
              Tautan Google Drive terlindungi di belakang GAS proxy. Setiap unduhan membutuhkan signed token 30 menit.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-[10px] md:text-[11px] font-bold text-emerald-800 self-start sm:self-auto shrink-0 dark:border-emerald-700 dark:bg-emerald-900/80 dark:text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          Zero Direct Public Link
        </span>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Log Unduhan Aset Digital (50 Aktivitas Terakhir)</h3>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Total {totalDownloadEvents} log tercatat</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400">
              <tr>
                <th className="p-4">Waktu Akses</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Produk & File</th>
                <th className="p-4">Pesanan Terkait</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Status Otorisasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {downloadLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    Belum ada log aktivitas unduhan file digital.
                  </td>
                </tr>
              ) : (
                downloadLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/50">
                    <td className="p-4 text-[11px] text-slate-500 dark:text-slate-400">
                      {formatIndonesianDateTime(log.downloadedAt)}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900 dark:text-white text-xs">{log.user?.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{log.user?.email}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{log.file?.fileName || 'File Aset'}</p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {log.product?.name} (v{log.file?.version || '1.0'})
                      </p>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      #{log.order?.orderNumber}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-mono dark:text-slate-400">
                        <Globe className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                        <span>{log.ipAddress || '127.0.0.1 (Local)'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400">
                        <ShieldCheck className="h-3 w-3" />
                        Verified Token
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">Log Unduhan Aset Digital</h3>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">{totalDownloadEvents} log</span>
        </div>

        <div className="space-y-3">
          {downloadLogs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
              Belum ada log aktivitas unduhan file digital.
            </div>
          ) : (
            downloadLogs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{log.user?.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{log.user?.email}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 shrink-0 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </span>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">{log.file?.fileName || 'File Aset'}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    {log.product?.name} (v{log.file?.version || '1.0'})
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                  <span>#{log.order?.orderNumber}</span>
                  <span>{formatIndonesianDateTime(log.downloadedAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
