import React from 'react';
import { prisma } from '@ruang-digital/db';
import { formatRupiah, formatIndonesianDateTime } from '@ruang-digital/utils';
import { Users, ShoppingCart, DollarSign, Key, Mail, Phone, Calendar, Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage() {
  let customers: any[] = [];
  try {
    customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      orderBy: { createdAt: 'desc' },
      include: {
        orders: {
          where: { status: { in: ['PAID', 'COMPLETED', 'PROCESSING', 'SHIPPED'] } },
          select: { id: true, totalAmount: true },
        },
        licenses: {
          where: { status: 'ACTIVE' },
          select: { id: true },
        },
        _count: {
          select: { orders: true, downloads: true },
        },
      },
    });
  } catch (err) {
    console.warn('DB error fetching customers:', err);
  }

  const totalCustomers = customers.length;
  const activeBuyersCount = customers.filter((c) => c.orders.length > 0).length;
  const totalCustomerSpending = customers.reduce((acc, c) => {
    return acc + c.orders.reduce((sub: number, ord: any) => sub + ord.totalAmount, 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <Users className="h-5 w-5 md:h-6 md:w-6 text-purple-600 dark:text-purple-400" />
          Direktori Pelanggan
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Pantau basis pembeli, riwayat transaksi, dan kepemilikan lisensi akun customer.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm space-y-2 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 text-[11px] md:text-xs font-semibold dark:text-slate-400">
            <span>Total Pelanggan Terdaftar</span>
            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{totalCustomers}</p>
          <p className="text-[10px] md:text-[11px] text-slate-400 dark:text-slate-500">Akun dengan peran CUSTOMER</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm space-y-2 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 text-[11px] md:text-xs font-semibold dark:text-slate-400">
            <span>Pembeli Aktif (Berbayar)</span>
            <ShoppingCart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{activeBuyersCount}</p>
          <p className="text-[10px] md:text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            {totalCustomers > 0
              ? `${((activeBuyersCount / totalCustomers) * 100).toFixed(1)}% Conversion Rate`
              : '0%'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm space-y-2 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 text-[11px] md:text-xs font-semibold dark:text-slate-400">
            <span>Total Akumulasi Pembelian</span>
            <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{formatRupiah(totalCustomerSpending)}</p>
          <p className="text-[10px] md:text-[11px] text-slate-400 dark:text-slate-500">Nilai transaksi berhasil dari pelanggan</p>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400">
              <tr>
                <th className="p-4">Pelanggan</th>
                <th className="p-4">Kontak</th>
                <th className="p-4">Pesanan Selesai</th>
                <th className="p-4">Total Belanja</th>
                <th className="p-4">Lisensi Aktif</th>
                <th className="p-4">Terdaftar Sejak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    Belum ada pelanggan terdaftar.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const spent = customer.orders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);
                  const initial = customer.name?.charAt(0).toUpperCase() || 'C';

                  return (
                    <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 border border-purple-200 font-bold shrink-0 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">
                            {initial}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-xs">{customer.name}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                            <Phone className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                            <span>{customer.phone || '-'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {customer.orders.length} order lunas
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-900 dark:text-white">
                        {formatRupiah(spent)}
                      </td>
                      <td className="p-4">
                        {customer.licenses.length > 0 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-400 dark:border-emerald-800">
                            <Key className="h-3 w-3" />
                            {customer.licenses.length} Lisensi
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="p-4 text-[11px] text-slate-500 dark:text-slate-400">
                        {formatIndonesianDateTime(customer.createdAt)}
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
        {customers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500">
            Belum ada pelanggan terdaftar.
          </div>
        ) : (
          customers.map((customer) => {
            const spent = customer.orders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);
            const initial = customer.name?.charAt(0).toUpperCase() || 'C';

            return (
              <div key={customer.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 dark:border-slate-800 dark:bg-slate-900">
                {/* Avatar + Name */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 border border-purple-200 font-bold text-sm shrink-0 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{customer.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{customer.email}</p>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center dark:border-transparent dark:bg-slate-950/60">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{customer.orders.length}</p>
                    <p className="text-[10px] text-slate-500">Order</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center dark:border-transparent dark:bg-slate-950/60">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{formatRupiah(spent)}</p>
                    <p className="text-[10px] text-slate-500">Belanja</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center dark:border-transparent dark:bg-slate-950/60">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{customer.licenses.length}</p>
                    <p className="text-[10px] text-slate-500">Lisensi</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>{customer.phone || '-'}</span>
                  </div>
                  <span>{formatIndonesianDateTime(customer.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
