# Panduan Deployment Ruang Digital

Dokumen ini menjelaskan penyebab error saat deploy ke **Cloudflare Workers** dan panduan lengkap cara melakukan deployment yang benar untuk arsitektur monorepo Next.js + Prisma ini.

---

## 1. Analisis Error Cloudflare Workers

### Pesan Error:
```text
X [ERROR] The Cloudflare application detection logic has been run in the root of a workspace instead of targeting a specific project.
Failed: error occurred while running deploy command: npx wrangler deploy
```

### Penyebab:
1. **Struktur Monorepo (Turborepo & pnpm workspace)**:
   Repository ini memiliki dua aplikasi di folder `apps/`:
   - `apps/web`: Web Storefront & Dashboard Customer (Next.js 14)
   - `apps/admin`: Dashboard Admin Operasional (Next.js 14)
   
   Secara default, Cloudflare Workers CI menjalankan perintah deploy `npx wrangler deploy` di direktori **root** (`/`). Karena root adalah monorepo workspace dan tidak memiliki `wrangler.toml` atau `wrangler.json`, Wrangler bingung menentukan aplikasi mana yang hendak dideploy.

2. **Keterbatasan Runtime Cloudflare Workers untuk Next.js + Prisma**:
   Aplikasi Ruang Digital menggunakan **Next.js 14 App Router** dan **Prisma ORM (`@prisma/client`)**.
   - Cloudflare Workers berjalan di atas runtime *V8 Isolate* (`workerd`), bukan Node.js utuh.
   - `@prisma/client` standar membutuhkan native binary engine C++/Rust yang **tidak bisa berjalan di Cloudflare Workers** tanpa adapter khusus (`@prisma/adapter-pg` / Prisma Accelerate) dan adapter `@opennextjs/cloudflare`.

---

## 2. Solusi Rekomendasi: Deploy ke Vercel (Gratis & Kompatibel Penuh)

Sesuai spesifikasi proyek (`Prompt Final — Ruang Digital.md`), arsitektur Turborepo + Next.js + Prisma dirancang khusus untuk **Vercel**. Vercel dibuat oleh tim yang sama dengan Next.js dan Turborepo, sehingga:
- 100% mendukung Turborepo secara otomatis.
- Mendukung runtime Node.js Serverless (Prisma Client + Neon PostgreSQL berjalan langsung tanpa error).
- Mendukung Server Components, Server Actions, Route Handlers, dan Cookies.
- Gratis (Hobby Plan).

### Langkah Deploy ke Vercel:

#### A. Deploy Storefront (`apps/web`)
1. Buka [vercel.com](https://vercel.com) dan login menggunakan akun GitHub Anda.
2. Klik **"Add New..."** > **"Project"**.
3. Pilih repository **`ZubedSA/Ruang-Digital`** lalu klik **Import**.
4. Di bagian **Configure Project**:
   - **Project Name**: `ruang-digital` (atau nama pilihan Anda)
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Klik **Edit** dan pilih `apps/web`.
5. Buka bagian **Environment Variables** dan tambahkan variabel berikut (sesuaikan nilainya dari file `.env` Anda):
   - `DATABASE_URL`: URL PostgreSQL Neon (pooled connection dengan `?sslmode=require&pgbouncer=true`)
   - `DIRECT_URL`: URL PostgreSQL Neon (direct connection)
   - `AUTH_SECRET`: String rahasia JWT (minimal 32 karakter)
   - `SESSION_COOKIE_NAME`: `rd_session`
   - `MIDTRANS_SERVER_KEY`: Server key Midtrans
   - `MIDTRANS_CLIENT_KEY`: Client key Midtrans
   - `MIDTRANS_IS_PRODUCTION`: `false` (atau `true` jika live)
   - `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`: Client key Midtrans
   - `GOOGLE_APPS_SCRIPT_URL`: URL Web App Google Apps Script
   - `GOOGLE_APPS_SCRIPT_SECRET`: Secret token GAS
   - `NEXT_PUBLIC_APP_URL`: Domain URL Vercel untuk web (misal: `https://ruang-digital.vercel.app`)
   - `NEXT_PUBLIC_ADMIN_URL`: Domain URL Vercel untuk admin (misal: `https://ruang-digital-admin.vercel.app`)
6. Klik **Deploy**.
   *Vercel akan otomatis menjalankan Turborepo, melakukan `prisma generate`, me-build Next.js, dan menerbitkan web Anda dalam 1-2 menit.*

---

#### B. Deploy Admin Dashboard (`apps/admin`)
1. Di dashboard Vercel, klik **"Add New..."** > **"Project"** lagi.
2. Pilih repository yang sama: **`ZubedSA/Ruang-Digital`**.
3. Di bagian **Configure Project**:
   - **Project Name**: `ruang-digital-admin`
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Klik **Edit** dan pilih `apps/admin`.
4. Tambahkan Environment Variables yang sama persis seperti pada langkah Storefront di atas.
5. Klik **Deploy**.

---

## 3. Opsi: Jika Tetap Ingin Menggunakan Cloudflare

Jika Anda memiliki kebutuhan khusus untuk menggunakan ekosistem Cloudflare:

1. **Ubah Root Directory di Cloudflare**:
   - Masuk ke Cloudflare Dashboard > **Workers & Pages** > pilih service `ruang-digital`.
   - Buka tab **Settings** > **Builds & deployments**.
   - Cari opsi **Root directory** (atau **Build directory**) dan ubah dari `/` menjadi:
     ```text
     apps/web
     ```
2. **Kustomisasi Build & Deploy Command**:
   - **Build command**: `pnpm run build`
   - **Deploy command**: Jika menggunakan OpenNext, gunakan `npx @opennextjs/cloudflare` atau sesuaikan dengan output worker.
3. **PENTING (Prisma Edge Compatibility)**:
   Karena Cloudflare Workers adalah V8 Isolate, Prisma Client tidak dapat menjalankan binary engine standar. Anda harus:
   - Memasang `@prisma/adapter-pg` dan driver WebSocket Neon (`@neondatabase/serverless`).
   - Mengaktifkan `previewFeatures = ["driverAdapters"]` di `schema.prisma`.
   - Oleh karena itu, **opsi Vercel jauh lebih stabil, cepat, dan tidak memerlukan perubahan kode apapun**.
