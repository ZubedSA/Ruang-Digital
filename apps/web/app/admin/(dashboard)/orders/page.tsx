import React from 'react';
import { prisma } from '@ruang-digital/db';
import { formatRupiah, formatIndonesianDateTime } from '@ruang-digital/utils';
import { Truck, Download } from 'lucide-react';
import { OrderRowAction } from './OrderRowAction';

import { getAdminOrdersList } from '@/lib/neon';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  let orders: any[] = [];
  try {
    orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        items: true,
        shipments: true,
        payments: true,
      },
    });
  } catch (err) {
    console.warn('Prisma admin orders query failed, using Neon HTTP fallback:', err);
    try {
      orders = await getAdminOrdersList();
    } catch (neonErr) {
      console.error('Neon admin orders query error:', neonErr);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">Manajemen Pesanan Masuk</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Pantau dan proses pemesanan produk digital dan fulfillment pengiriman produk fisik.
        </p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
              <tr>
                <th className="p-4">No. Pesanan</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Item Snapshot</th>
                <th className="p-4">Total Bayar</th>
                <th className="p-4">Status Pesanan</th>
                <th className="p-4">Pengiriman (Fisik)</th>
                <th className="p-4 text-right">Ubah Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    Belum ada pesanan masuk.
                  </td>
                </tr>
              ) : (
                orders.map((ord: any) => {
                  const shipment = ord.shipments?.[0];
                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/40">
                      <td className="p-4">
                        <span className="font-mono font-bold text-slate-900 dark:text-white block">{ord.orderNumber}</span>
                        <span className="text-[10px] text-slate-500">{formatIndonesianDateTime(ord.createdAt)}</span>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white">{ord.user?.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{ord.user?.email}</div>
                      </td>

                      <td className="p-4">
                        <div className="space-y-1">
                          {ord.items?.map((it: any) => (
                            <div key={it.id} className="flex items-center gap-1.5 text-[11px]">
                              {it.productType === 'DIGITAL' ? (
                                <Download className="h-3 w-3 text-indigo-500 dark:text-indigo-400 shrink-0" />
                              ) : (
                                <Truck className="h-3 w-3 text-amber-500 dark:text-amber-400 shrink-0" />
                              )}
                              <span className="truncate max-w-[180px]">{it.productName} (×{it.quantity})</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="p-4 font-bold text-slate-900 dark:text-white">
                        {formatRupiah(ord.totalAmount)}
                      </td>

                      <td className="p-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            ['PAID', 'COMPLETED', 'DELIVERED'].includes(ord.status)
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                              : ord.status === 'SHIPPED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>

                      <td className="p-4">
                        {shipment ? (
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{shipment.courier}</span>
                            <span className="text-slate-500 block text-[11px]">
                              {shipment.trackingNumber ? `Resi: ${shipment.trackingNumber}` : 'Belum ada resi'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic">Digital (No shipping)</span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <OrderRowAction
                          orderId={ord.id}
                          currentStatus={ord.status}
                          hasPhysical={(ord.shipments?.length ?? 0) > 0}
                          currentTrackingNumber={shipment?.trackingNumber}
                        />
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
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
            Belum ada pesanan masuk.
          </div>
        ) : (
          orders.map((ord: any) => {
            const shipment = ord.shipments?.[0];
            return (
              <div key={ord.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 dark:border-slate-800 dark:bg-slate-900">
                {/* Header: Order number + Status */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{ord.orderNumber}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      ['PAID', 'COMPLETED', 'DELIVERED'].includes(ord.status)
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                        : ord.status === 'SHIPPED'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800'
                        : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800'
                    }`}
                  >
                    {ord.status}
                  </span>
                </div>

                {/* Customer + Amount */}
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{ord.user?.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{ord.user?.email}</p>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white shrink-0 ml-3">{formatRupiah(ord.totalAmount)}</span>
                </div>

                {/* Items */}
                <div className="space-y-1">
                  {ord.items?.map((it: any) => (
                    <div key={it.id} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                      {it.productType === 'DIGITAL' ? (
                        <Download className="h-3 w-3 text-indigo-500 dark:text-indigo-400 shrink-0" />
                      ) : (
                        <Truck className="h-3 w-3 text-amber-500 dark:text-amber-400 shrink-0" />
                      )}
                      <span className="truncate">{it.productName} (×{it.quantity})</span>
                    </div>
                  ))}
                </div>

                {/* Shipping + Date */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>
                    {shipment
                      ? `${shipment.courier} • ${shipment.trackingNumber || 'Belum ada resi'}`
                      : 'Digital (No shipping)'}
                  </span>
                  <span>{formatIndonesianDateTime(ord.createdAt)}</span>
                </div>

                {/* Action */}
                <div>
                  <OrderRowAction
                    orderId={ord.id}
                    currentStatus={ord.status}
                    hasPhysical={(ord.shipments?.length ?? 0) > 0}
                    currentTrackingNumber={shipment?.trackingNumber}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
