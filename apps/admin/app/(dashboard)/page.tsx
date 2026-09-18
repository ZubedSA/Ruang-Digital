import React from 'react';
import Link from 'next/link';
import { prisma } from '@ruang-digital/db';
import { formatRupiah, formatIndonesianDateTime } from '@ruang-digital/utils';
import { DollarSign, ShoppingCart, Users, Package, AlertTriangle, Download, ArrowUpRight } from 'lucide-react';

export default async function AdminDashboardOverview() {
  let totalRevenue = 0;
  let totalOrders = 0;
  let totalCustomers = 0;
  let digitalProductsCount = 0;
  let physicalProductsCount = 0;
  let lowStockProducts: any[] = [];
  let recentOrders: any[] = [];

  try {
    const [
      revenueAggregate,
      orderCount,
      customerCount,
      digitalCount,
      physicalCount,
      lowStock,
      recent,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { status: { in: ['PAID', 'COMPLETED', 'PROCESSING', 'SHIPPED'] } },
        _sum: { totalAmount: true },
      }),
      prisma.order.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.count({ where: { type: 'DIGITAL' } }),
      prisma.product.count({ where: { type: 'PHYSICAL' } }),
      prisma.product.findMany({
        where: { type: 'PHYSICAL', stock: { lte: 10 } },
        take: 5,
      }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: true, items: true },
      }),
    ]);

    totalRevenue = revenueAggregate._sum.totalAmount || 0;
    totalOrders = orderCount;
    totalCustomers = customerCount;
    digitalProductsCount = digitalCount;
    physicalProductsCount = physicalCount;
    lowStockProducts = lowStock;
    recentOrders = recent;
  } catch (err) {
    console.warn('Admin stats error (DB unmigrated or empty):', err);
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">Dashboard Operasional</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Pantau metrik penjualan, performa order digital & logistik pesanan fisik.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total Omset */}
        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 p-4 md:p-5 space-y-2 md:space-y-3 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] md:text-xs font-semibold">Total Pendapatan</span>
            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{formatRupiah(totalRevenue)}</p>
          <p className="text-[10px] md:text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Dari pesanan berstatus lunas</p>
        </div>

        {/* Total Orders */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 p-4 md:p-5 space-y-2 md:space-y-3 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] md:text-xs font-semibold">Total Pesanan</span>
            <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{totalOrders}</p>
          <p className="text-[10px] md:text-[11px] text-slate-500 dark:text-slate-400">Keseluruhan transaksi</p>
        </div>

        {/* Total Customers */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 p-4 md:p-5 space-y-2 md:space-y-3 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] md:text-xs font-semibold">Pelanggan</span>
            <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{totalCustomers}</p>
          <p className="text-[10px] md:text-[11px] text-slate-500 dark:text-slate-400">Akun pembeli aktif</p>
        </div>

        {/* Catalog Breakdown */}
        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 p-4 md:p-5 space-y-2 md:space-y-3 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] md:text-xs font-semibold">Katalog Produk</span>
            <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
              {digitalProductsCount} Digital
            </span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">
              {physicalProductsCount} Fisik
            </span>
          </div>
          <p className="text-[10px] md:text-[11px] text-slate-500 dark:text-slate-400">Satu sistem katalog terpadu</p>
        </div>
      </div>

      {/* Two Columns: Recent Orders & Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 p-4 md:p-6 space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-white">Pesanan Masuk Terkini</h2>
            <Link href="/orders" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
              Kelola Semua →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">Belum ada pesanan masuk.</p>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {recentOrders.map((ord) => (
                  <div key={ord.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{ord.orderNumber}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            ['PAID', 'COMPLETED'].includes(ord.status)
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                              : 'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {ord.user.name} ({ord.user.email}) • {formatIndonesianDateTime(ord.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{formatRupiah(ord.totalAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {recentOrders.map((ord) => (
                  <div key={ord.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 dark:border-slate-800 dark:bg-slate-950/50">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{ord.orderNumber}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          ['PAID', 'COMPLETED'].includes(ord.status)
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                            : 'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate mr-2">{ord.user.name}</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white shrink-0">{formatRupiah(ord.totalAmount)}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">{formatIndonesianDateTime(ord.createdAt)}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 p-4 md:p-6 space-y-4 transition-colors">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Peringatan Stok Rendah</span>
          </div>

          {lowStockProducts.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500">Semua produk fisik memiliki stok aman ({'>'} 10 unit).</p>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-800 dark:text-slate-200 truncate pr-2">{p.name}</span>
                  <span className="rounded bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-400 px-2 py-0.5 font-bold shrink-0">
                    Sisa {p.stock}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
