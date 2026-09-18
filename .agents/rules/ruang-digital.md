# Ruang Digital — Development & Architectural Invariants

## Language Conventions
- **User Interface (UI)**: Gunakan Bahasa Indonesia untuk seluruh label, button, placeholder, error message, toast, dan konten halaman.
- **Source Code**: Gunakan Bahasa Inggris untuk penamaan variabel, fungsi, database models, fields, types, dan nama file kode.

## Tech Stack & Structure
- **Architecture**: Monorepo dengan `pnpm` workspaces dan `Turborepo`.
- **Apps**: 
  - `apps/web`: Customer storefront dan customer dashboard (Next.js 14 App Router).
  - `apps/admin`: Operational dashboard admin (Next.js 14 App Router).
- **Packages**:
  - `packages/db`: Prisma ORM client & Neon PostgreSQL connection.
  - `packages/ui`: Shared Tailwind CSS component library & design system.
  - `packages/auth`: RBAC (`CUSTOMER`, `ADMIN`), sessions, password hashing, and guards.
  - `packages/types`: Shared TypeScript interfaces, DTOs, enums, and API contracts.
  - `packages/utils`: IDR currency formatter, slug generator, date formatting, and crypto helpers.
  - `packages/config`: Shared configurations (TSConfig, ESLint, Tailwind).

## Security & Business Logic Invariants
- **Zero Frontend Trust**: Harga final, kupon, ongkos kirim, dan ketersediaan stok wajib dihitung ulang di server. Frontend tidak pernah dipercaya untuk nominal transaksi atau status order.
- **Digital Delivery**: File digital disimpan di Google Drive melalui bridge Google Apps Script. Jangan pernah memberikan direct URL Google Drive kepada customer. Akses download wajib melalui server-side authorization (User login, Order status = PAID, verifikasi kepemilikan produk) dengan signed token sementara. Catat setiap unduhan di tabel `Download`.
- **Payment & Webhook**: Payment abstraction layer dengan Midtrans. Webhook wajib diverifikasi melalui hash signature server-side dan bersifat idempotent.
- **Phased Execution**: Ikuti roadmap implementasi 11 fase secara berurutan. Setiap fase wajib diverifikasi sebelum lanjut ke fase berikutnya.
