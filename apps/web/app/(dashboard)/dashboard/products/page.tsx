import React from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createSignedDownloadToken, formatFileSize } from '@ruang-digital/utils';
import { DownloadCloud, Key, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { LicenseKeyCopy } from './LicenseKeyCopy';

const AUTH_SECRET = process.env.AUTH_SECRET || 'ruang-digital-super-secret-auth-key-change-in-prod';

export default async function CustomerDigitalProductsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Retrieve all paid orders belonging to user
  const orders = await prisma.order.findMany({
    where: {
      userId: user.id,
      status: { in: ['PAID', 'COMPLETED', 'PROCESSING', 'SHIPPED'] },
    },
    include: {
      items: {
        where: { productType: 'DIGITAL' },
        include: {
          product: {
            include: {
              files: { where: { isActive: true } },
            },
          },
        },
      },
      licenses: true,
    },
  });

  // Consolidate digital deliverables
  const digitalDeliveries: any[] = [];
  for (const order of orders) {
    for (const item of order.items) {
      const product = item.product;
      const license = order.licenses.find((l) => l.productId === product.id);

      // Generate signed download tokens for each file (valid for 30 minutes)
      const filesWithSignedUrls = (product.files || []).map((file) => {
        const token = createSignedDownloadToken(
          {
            userId: user.id,
            orderId: order.id,
            fileId: file.id,
            expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
          },
          AUTH_SECRET
        );

        return {
          ...file,
          downloadUrl: `/api/downloads/${token}`,
        };
      });

      digitalDeliveries.push({
        orderNumber: order.orderNumber,
        product,
        files: filesWithSignedUrls,
        licenseKey: license ? license.licenseKey : null,
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          Produk Digital & Lisensi Saya
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Unduh software, materi ebook, dan kelola lisensi resmi yang telah Anda beli.
        </p>
      </div>

      {digitalDeliveries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
          <DownloadCloud className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Belum Ada Produk Digital
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Anda belum memiliki produk digital yang lunas. Silakan cek katalog aplikasi dan ebook kami.
          </p>
          <div className="mt-6">
            <Link
              href="/produk?type=DIGITAL"
              className="inline-flex rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
            >
              Jelajahi Produk Digital
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {digitalDeliveries.map((delivery, index) => (
            <div
              key={`${delivery.product.id}-${index}`}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5"
            >
              {/* Product header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <img
                    src={delivery.product.featuredImage}
                    alt={delivery.product.name}
                    className="h-14 w-14 rounded-xl object-cover border border-slate-100 dark:border-slate-800"
                  />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {delivery.product.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      No. Pesanan: <span className="font-semibold text-slate-600">{delivery.orderNumber}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* License Key Box (if available) */}
              {delivery.licenseKey && (
                <LicenseKeyCopy licenseKey={delivery.licenseKey} />
              )}

              {/* Downloadable Files List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  File Siap Unduh (Tautan Terproteksi):
                </h4>

                {delivery.files.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Belum ada file unduhan yang dilampirkan untuk produk ini.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {delivery.files.map((file: any) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-950/60"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText className="h-5 w-5 text-indigo-600 shrink-0" />
                          <div className="truncate">
                            <p className="font-bold truncate text-slate-900 dark:text-white">
                              {file.fileName}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Versi {file.version} • {formatFileSize(file.fileSize)} • Platform: {file.platform || 'All'}
                            </p>
                          </div>
                        </div>

                        <a
                          href={file.downloadUrl}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                        >
                          <DownloadCloud className="h-3.5 w-3.5" />
                          <span>Unduh</span>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Security note */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>
                  Tautan unduhan ditandatangani secara kriptografis dan diverifikasi di server untuk melindungi privasi akun Anda.
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
