# Theme Standards (Dark Mode & Light Mode)

## 1. Class-Based Dark Mode
- Tailwind CSS disetel ke mode class: `darkMode: 'class'`.
- Elemen `<html className="dark">` atau `<html className="light">` dikelola oleh `ThemeProvider` dari `@ruang-digital/ui`.
- Gunakan inline script anti-FOUC (`<ThemeScript />`) di `<head>` pada setiap aplikasi (`apps/web` dan `apps/admin`).

## 2. Separate Storage Keys
- Customer Storefront & Dashboard (`apps/web`): `ruang-digital-theme`
- Super Admin Operations Console (`apps/admin`): `ruang-digital-admin-theme`
- Ini memastikan preferensi tema di console admin dan storefront tidak saling menimpa saat dibuka di browser yang sama.

## 3. Pairing Invariants (Wajib Pasangan Light/Dark)
Jangan pernah menggunakan class hardcoded slate-900/slate-950 tanpa varian light atau sebaliknya.
Gunakan format standar berikut:
- **Halaman / Background Utama**: `bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100`
- **Card / Panel / Modal**: `border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900`
- **Sub-box / Form Field**: `border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white`
- **Tabel Header**: `border-b border-slate-200 bg-slate-50/80 text-slate-500 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400`
- **Tabel Row Divider & Hover**: `divide-slate-100 hover:bg-slate-50/80 dark:divide-slate-800 dark:hover:bg-slate-800/50`
- **Teks Primer**: `text-slate-900 dark:text-white`
- **Teks Sekunder**: `text-slate-500 dark:text-slate-400`
- **Aksen Primer**: Emerald (`text-emerald-600 dark:text-emerald-500`, `bg-emerald-600 hover:bg-emerald-700`)

## 4. Komponen ThemeToggle
- Gunakan `<ThemeToggle variant="dropdown" />` pada Header desktop.
- Gunakan `<ThemeToggle variant="compact" />` pada toolbar ringkas.
- Gunakan `<ThemeToggle variant="segmented" />` pada mobile drawer atau menu navigasi profil.
