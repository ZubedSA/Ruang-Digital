import React from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatRupiah, formatIndonesianDateTime } from '@ruang-digital/utils';
import { ShoppingBag, DownloadCloud, Key, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';

export default async function CustomerDashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  let orderCount = 0;
  let digitalFileCount = 0;
  let recentOrders: any[] = [];

  try {
    orderCount = await prisma.order.count({ where: { userId: user.id } });

    recentOrders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { items: true },
    });

    // Count paid orders containing digital files
    const paidDigitalOrders = await prisma.order.findMany({
      where: {
        userId: user.id,
        status: { in: ['PAID', 'COMPLETED', 'PROCESSING', 'SHIPPED'] },
      },
      include: {
        items: {
          where: { productType: 'DIGITAL' },
          include: {
            product: {
              include: { files: true },
            },
          },
        },
      },
    });

    digitalFileCount = paidDigitalOrders.reduce(
      (acc, ord) => acc + ord.items.reduce((sum, it) => sum + (it.product.files?.length || 0), 0),
      0
    );
  } catch (e) {
    console.warn('Error querying dashboard data', e);
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-emerald-500/10 via-slate-50 to-white p-6 sm:p-8 dark:border-slate-800 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          Selamat Datang, {user.name}!
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
          Kelola pembelian, unduh aplikasi & materi digital yang telah Anda miliki, serta pantau nomor resi produk fisik Anda di sini.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Pesanan</span>
            <p className="text-xl font-black text-slate-900 dark:text-white">{orderCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <DownloadCloud className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">File Digital Siap Unduh</span>
            <p className="text-xl font-black text-slate-900 dark:text-white">{digitalFileCount}</p>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Pesanan Terkini</h2>
          <Link href="/dashboard/orders" className="text-xs font-semibold text-emerald-600 hover:underline">
            Semua Pesanan →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Belum ada riwayat pesanan. Mulai belanja produk digital atau fisik Anda sekarang.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentOrders.map((ord) => (
              <div key={ord.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{ord.orderNumber}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        ['PAID', 'COMPLETED', 'SHIPPED', 'PROCESSING'].includes(ord.status)
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-yellow-50 text-yellow-700'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>
                  <p className="text-slate-400 mt-1">
                    {formatIndonesianDateTime(ord.createdAt)} • {ord.items.length} item
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {formatRupiah(ord.totalAmount)}
                  </span>
                  <Link
                    href={`/order/${ord.orderNumber}`}
                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold hover:bg-slate-200 dark:bg-slate-800"
                  >
                    Detail
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
