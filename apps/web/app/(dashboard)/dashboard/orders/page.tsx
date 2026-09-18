import React from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatRupiah, formatIndonesianDateTime } from '@ruang-digital/utils';
import { ShoppingBag, Truck, Download, ExternalLink } from 'lucide-react';

export default async function CustomerOrdersPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      items: true,
      shipments: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          Riwayat Pesanan Saya
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Daftar seluruh transaksi pembelian produk digital dan pesanan merchandise fisik Anda.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
          <ShoppingBag className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Belum Ada Pesanan
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Anda belum pernah membuat pesanan di Ruang Digital.
          </p>
          <div className="mt-6">
            <Link
              href="/produk"
              className="inline-flex rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
            >
              Belanja Sekarang
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const hasDigital = order.items.some((it) => it.productType === 'DIGITAL');
            const hasPhysical = order.items.some((it) => it.productType === 'PHYSICAL');
            const shipment = order.shipments[0];

            return (
              <div
                key={order.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                      {order.orderNumber}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatIndonesianDateTime(order.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        ['PAID', 'COMPLETED', 'DELIVERED'].includes(order.status)
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : order.status === 'SHIPPED'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2 text-xs">
                  {order.items.map((it) => (
                    <div key={it.id} className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        {it.productType === 'DIGITAL' ? (
                          <Download className="h-3.5 w-3.5 text-indigo-600" />
                        ) : (
                          <Truck className="h-3.5 w-3.5 text-amber-600" />
                        )}
                        <span className="font-semibold">{it.productName}</span>
                        <span className="text-slate-400">× {it.quantity}</span>
                      </div>
                      <span className="font-bold">{formatRupiah(it.subtotal)}</span>
                    </div>
                  ))}
                </div>

                {/* Tracking info if shipped */}
                {shipment && shipment.trackingNumber && (
                  <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                    <strong>Resi Pengiriman ({shipment.courier}):</strong> {shipment.trackingNumber} ({shipment.status})
                  </div>
                )}

                {/* Footer action */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400">Total: </span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {formatRupiah(order.totalAmount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/order/${order.orderNumber}`}
                      className="rounded-lg bg-slate-100 px-3.5 py-2 font-bold text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                    >
                      Lihat Rincian
                    </Link>
                    {hasDigital && ['PAID', 'COMPLETED', 'SHIPPED', 'PROCESSING'].includes(order.status) && (
                      <Link
                        href="/dashboard/products"
                        className="rounded-lg bg-emerald-600 px-3.5 py-2 font-bold text-white hover:bg-emerald-700 shadow-sm"
                      >
                        Akses File Digital
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
