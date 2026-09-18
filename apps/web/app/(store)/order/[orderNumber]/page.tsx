import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { formatRupiah, formatIndonesianDateTime } from '@ruang-digital/utils';
import { CheckCircle2, Clock, Truck, Download, AlertCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { PaymentActionBox } from './PaymentActionBox';

interface Props {
  params: { orderNumber: string };
  searchParams: { token?: string };
}

export default async function OrderStatusPage({ params, searchParams }: Props) {
  const order = await prisma.order.findUnique({
    where: { orderNumber: params.orderNumber },
    include: {
      items: true,
      shipments: true,
      payments: true,
      licenses: true,
      user: true,
    },
  });

  if (!order) notFound();

  const isPaid = order.status === 'PAID' || order.status === 'COMPLETED' || order.status === 'PROCESSING' || order.status === 'SHIPPED';
  const hasDigital = order.items.some((it) => it.productType === 'DIGITAL');
  const hasPhysical = order.items.some((it) => it.productType === 'PHYSICAL');

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Order Status Banner */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-center space-y-4">
        {isPaid ? (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <CheckCircle2 className="h-10 w-10" />
          </div>
        ) : (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400">
            <Clock className="h-10 w-10" />
          </div>
        )}

        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Nomor Pesanan: {order.orderNumber}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {isPaid ? 'Pembayaran Berhasil Dikonfirmasi!' : 'Menunggu Pembayaran'}
          </h1>
          <p className="text-xs text-slate-500">
            Dibuat pada {formatIndonesianDateTime(order.createdAt)}
          </p>
        </div>

        {/* Action Button if PENDING or PAID */}
        {!isPaid ? (
          <PaymentActionBox
            orderId={order.id}
            orderNumber={order.orderNumber}
            amount={order.totalAmount}
            snapToken={searchParams.token}
          />
        ) : (
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            {hasDigital && (
              <Link
                href="/dashboard/products"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Buka & Unduh Produk Digital</span>
              </Link>
            )}
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white transition-colors"
            >
              <span>Riwayat Pesanan</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Order Details & Summary */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Rincian Item Pesanan
        </h2>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {order.items.map((item) => (
            <div key={item.id} className="py-4 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">{item.productName}</p>
                <p className="text-slate-400 mt-0.5">
                  Tipe: {item.productType} | Qty: {item.quantity} × {formatRupiah(item.price)}
                </p>
              </div>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {formatRupiah(item.subtotal)}
              </span>
            </div>
          ))}
        </div>

        {/* Total calculation breakdown */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span>
            <span>{formatRupiah(order.subtotalAmount)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Diskon</span>
              <span>- {formatRupiah(order.discountAmount)}</span>
            </div>
          )}
          {order.shippingFee > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>Ongkos Kirim</span>
              <span>{formatRupiah(order.shippingFee)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-100">
            <span>Total Pembayaran</span>
            <span className="text-emerald-600">{formatRupiah(order.totalAmount)}</span>
          </div>
        </div>

        {/* Physical Shipment status (if any) */}
        {hasPhysical && order.shipments.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-xs dark:border-amber-900/40 dark:bg-amber-950/20">
            <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
              <Truck className="h-4 w-4" />
              <span>Status Pengiriman: {order.shipments[0].status}</span>
            </div>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              Kurir: {order.shipments[0].courier} ({order.shipments[0].service})
              {order.shipments[0].trackingNumber
                ? ` — No. Resi: ${order.shipments[0].trackingNumber}`
                : ' — No. Resi akan diinput oleh admin saat paket diserahkan ke kurir.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
