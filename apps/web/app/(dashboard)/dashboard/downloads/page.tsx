import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatIndonesianDateTime, formatFileSize, createSignedDownloadToken } from '@ruang-digital/utils';
import { DownloadCloud, History, ArrowDownToLine, FileCode, CheckCircle2, ShieldCheck, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

const AUTH_SECRET = process.env.AUTH_SECRET || 'ruang-digital-super-secret-auth-key-change-in-prod';

export default async function CustomerDownloadsHistoryPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?callbackUrl=/dashboard/downloads');
  }

  const downloads = await prisma.download.findMany({
    where: { userId: user.id },
    orderBy: { downloadedAt: 'desc' },
    include: {
      product: {
        select: { id: true, name: true, slug: true, featuredImage: true },
      },
      file: true,
      order: {
        select: { id: true, orderNumber: true },
      },
    },
  });

  const totalDownloads = downloads.length;
  const uniqueFilesCount = new Set(downloads.map((d: any) => d.fileId)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <History className="h-6 w-6 text-emerald-600" />
          Riwayat Unduhan Digital
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Catatan riwayat berkas software, ebook, dan template yang telah Anda unduh ke perangkat Anda.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Log Unduhan</span>
            <DownloadCloud className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{totalDownloads}</p>
          <p className="text-[11px] text-emerald-600 mt-1">Audit log terverifikasi server</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>File Berbeda Diunduh</span>
            <FileCode className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{uniqueFilesCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Aset digital aktif Anda</p>
        </div>
      </div>

      {/* Downloads List */}
      {downloads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center">
          <DownloadCloud className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Belum Ada Riwayat Unduhan</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Anda belum pernah mengunduh file digital dari pesanan Anda. File digital dapat diunduh melalui menu Produk Digital.
          </p>
          <div className="mt-5">
            <Link
              href="/dashboard/products"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
            >
              Lihat Produk Digital Saya
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Log Unduhan Terbaru
            </h3>
            <span className="text-[11px] text-slate-400">
              Menampilkan {downloads.length} aktivitas
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {downloads.map((dl: any) => {
              // Generate fresh download token (valid for 30 minutes)
              const token = createSignedDownloadToken(
                {
                  userId: user.id,
                  orderId: dl.orderId,
                  fileId: dl.fileId,
                  expiresAt: Date.now() + 30 * 60 * 1000,
                },
                AUTH_SECRET
              );
              const downloadUrl = `/api/downloads/${token}`;

              return (
                <div
                  key={dl.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 shrink-0 mt-0.5">
                      <ArrowDownToLine className="h-5 w-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {dl.file?.fileName || 'File Digital'}
                        </span>
                        {dl.file?.version && (
                          <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                            v{dl.file.version}
                          </span>
                        )}
                        {dl.file?.platform && (
                          <span className="rounded bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                            {dl.file.platform}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Produk: <span className="font-semibold text-slate-700 dark:text-slate-300">{dl.product?.name}</span> • Order #{dl.order?.orderNumber}
                      </p>

                      <p className="text-[10px] text-slate-400">
                        Waktu unduh: {formatIndonesianDateTime(dl.downloadedAt)}
                        {dl.file?.fileSize && ` • ${formatFileSize(dl.file.fileSize)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <a
                      href={downloadUrl}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                    >
                      <ArrowDownToLine className="h-3.5 w-3.5" />
                      <span>Unduh Lagi</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
