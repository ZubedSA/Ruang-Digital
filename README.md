# Ruang Digital — Full-Stack E-Commerce

Ruang Digital adalah platform e-commerce modern, mobile-first, dan premium untuk produk **digital** (software, source code, ebook, template, lisensi) dan **fisik** (merchandise, produk dengan stok, varian, dan pengiriman) dalam satu katalog dan sistem checkout terpadu.

## 🚀 Fitur Utama

- **Unified Catalog**: Satu model produk yang mendukung jenis `DIGITAL` dan `PHYSICAL`.
- **Pengiriman File Digital Aman**: Integrasi Google Drive via Google Apps Script (GAS) API bridge. Customer hanya dapat mengunduh file setelah order `PAID` melalui URL streaming bertoken sementara yang dicatat di tabel audit `Download`.
- **Payment Abstraction**: Desain modular untuk gateway pembayaran dengan implementasi awal **Midtrans** (Snap popup & webhook idempotent).
- **Physical Order & Shipment**: Dukungan varian produk, SKU, stok, berat, dan pencatatan nomor resi kurir.
- **Customer Dashboard**: Riwayat transaksi, daftar file digital yang dimiliki, license key generator/viewer, dan manajemen alamat pengiriman.
- **Admin Dashboard**: Analitik penjualan, manajemen katalog produk, approval ulasan, tracking pengiriman fisik, dan audit logs.
- **Keamanan & Otorisasi Ketat**: Server-side RBAC (`CUSTOMER` & `ADMIN`), password hashing, zero frontend trust untuk nominal harga.

## 📂 Struktur Monorepo

```
ruang-digital/
├── apps/
│   ├── web/           # Customer Storefront & Customer Dashboard (Next.js 14 App Router)
│   └── admin/         # Operational Admin Dashboard (Next.js 14 App Router)
└── packages/
    ├── db/            # Prisma ORM & Neon PostgreSQL client
    ├── ui/            # Shared design system components & Tailwind presets
    ├── auth/          # RBAC, secure sessions, password hashing
    ├── types/         # Shared TypeScript interfaces & DTOs
    ├── utils/         # IDR currency formatter, slug generator, crypto helpers
    └── config/        # Shared ESLint, TSConfig, dan Tailwind config
```

## 🛠️ Panduan Memulai

1. Salin file `.env.example` ke `.env`:
   ```bash
   cp .env.example .env
   ```
2. Pasang dependensi monorepo:
   ```bash
   pnpm install
   ```
3. Generate Prisma Client dan jalankan migration:
   ```bash
   pnpm db:generate
   pnpm db:push
   pnpm db:seed
   ```
4. Jalankan development server:
   ```bash
   pnpm dev
   ```
   - Storefront Customer: `http://localhost:3000`
   - Dashboard Admin: `http://localhost:3001`
