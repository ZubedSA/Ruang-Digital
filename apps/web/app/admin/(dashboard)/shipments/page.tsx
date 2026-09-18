import React from 'react';
import { prisma } from '@ruang-digital/db';
import { Truck } from 'lucide-react';

import { getAdminShipmentsList } from '@/lib/neon';

export const dynamic = 'force-dynamic';

export default async function AdminShipmentsPage() {
  let shipments: any[] = [];
  try {
    shipments = await prisma.shipment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          include: {
            user: true,
            shippingAddress: true,
            items: { where: { productType: 'PHYSICAL' } },
          },
        },
      },
    });
  } catch (e) {
    console.warn('Prisma shipments query failed, using Neon fallback:', e);
    try {
      shipments = await getAdminShipmentsList();
    } catch (neonErr) {
      console.error('Neon shipments query error:', neonErr);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">Logistik & Pengiriman Fisik</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Daftar paket barang fisik yang membutuhkan ekspedisi kurir dan pelacakan nomor resi.
        </p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
              <tr>
                <th className="p-4">No. Pesanan</th>
                <th className="p-4">Penerima & Alamat</th>
                <th className="p-4">Item Fisik</th>
                <th className="p-4">Kurir & Resi</th>
                <th className="p-4">Status Pengiriman</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {shipments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    Belum ada pengiriman produk fisik.
                  </td>
                </tr>
              ) : (
                shipments.map((ship: any) => (
                  <tr key={ship.id} className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/40">
                    <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                      {ship.order?.orderNumber}
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-900 dark:text-white">{ship.order?.user?.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {ship.order?.shippingAddress?.street || 'Alamat bawaan profil'}
                        {ship.order?.shippingAddress?.city && `, ${ship.order?.shippingAddress.city}`}
                      </p>
                    </td>

                    <td className="p-4">
                      <div className="space-y-1">
                        {ship.order?.items?.map((it: any) => (
                          <div key={it.id} className="flex items-center gap-1.5 text-[11px]">
                            <Truck className="h-3 w-3 text-amber-500 dark:text-amber-400 shrink-0" />
                            <span>{it.productName} (×{it.quantity})</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="font-bold text-slate-900 dark:text-white">{ship.courier} ({ship.service})</span>
                      <span className="block font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                        {ship.trackingNumber || 'Belum diinput'}
                      </span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          ship.status === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                            : ship.status === 'SHIPPED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800'
                        }`}
                      >
                        {ship.status}
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
      <div className="md:hidden space-y-3">
        {shipments.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
            Belum ada pengiriman produk fisik.
          </div>
        ) : (
          shipments.map((ship: any) => (
            <div key={ship.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 dark:border-slate-800 dark:bg-slate-900">
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{ship.order?.orderNumber}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    ship.status === 'DELIVERED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                      : ship.status === 'SHIPPED'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800'
                      : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800'
                  }`}
                >
                  {ship.status}
                </span>
              </div>

              {/* Recipient */}
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{ship.order?.user?.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {ship.order?.shippingAddress?.street || 'Alamat bawaan profil'}
                  {ship.order?.shippingAddress?.city && `, ${ship.order?.shippingAddress.city}`}
                </p>
              </div>

              {/* Items */}
              <div className="space-y-1">
                {ship.order?.items?.map((it: any) => (
                  <div key={it.id} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                    <Truck className="h-3 w-3 text-amber-500 dark:text-amber-400 shrink-0" />
                    <span className="truncate">{it.productName} (×{it.quantity})</span>
                  </div>
                ))}
              </div>

              {/* Courier */}
              <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-700 dark:text-slate-200">{ship.courier} ({ship.service})</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  {ship.trackingNumber || 'Belum ada resi'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
