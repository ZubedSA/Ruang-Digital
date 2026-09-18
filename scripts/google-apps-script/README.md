# Panduan Setup Google Drive + Google Apps Script (Bridge)

File [Code.gs](file:///d:/WEB/Ruang%20Digital/scripts/google-apps-script/Code.gs) adalah script jembatan (API bridge) resmi untuk menghubungkan **Ruang Digital** dengan **Google Drive**.

Script ini menangani:
1. **Upload Foto Produk**: Otomatis disimpan ke folder *"Ruang Digital - Storage"* di Google Drive dengan hak akses publik (*Anyone with link can view*) sehingga foto dapat ditampilkan di website.
2. **Penyimpanan File Digital**: Berkas software (.exe, .apk), ebook (.pdf), dan template (.zip) disimpan secara privat.
3. **Pengunduhan Terverifikasi**: Hanya pembeli berstatus `PAID` yang dapat mengunduh berkas melalui signed token HMAC 30 menit.

---

## 🚀 Langkah Deploy (Hanya 2 Menit)

### 1. Buat Script di Google Apps Script
1. Buka browser dan kunjungi: **[https://script.google.com](https://script.google.com)**
2. Klik tombol **"+ Proyek Baru" (New Project)**.
3. Beri nama proyek di kiri atas, misalnya: `Ruang Digital Drive Bridge`.

### 2. Pasang Kode
1. Hapus kode default `function myFunction() {}`.
2. Buka file [Code.gs](file:///d:/WEB/Ruang%20Digital/scripts/google-apps-script/Code.gs) di project ini, salin (*copy*) seluruh isinya, lalu tempel (*paste*) ke editor Google Apps Script.
3. Di baris ke-14:
   ```javascript
   var SHARED_SECRET = "your-gas-hmac-shared-secret-token";
   ```
   Ganti dengan kata kunci rahasia Anda sendiri (samakan dengan nilai `GOOGLE_APPS_SCRIPT_SECRET` di `.env` Anda).
4. Klik ikon **Simpan (Save / Ctrl+S)**.

### 3. Deploy sebagai Web App
1. Klik tombol **Terapkan (Deploy)** di pojok kanan atas $\rightarrow$ Pilih **"Penerapan baru" (New deployment)**.
2. Klik ikon gerigi di samping *Pilih jenis* $\rightarrow$ Pilih **"Aplikasi web" (Web app)**.
3. Isi konfigurasi berikut:
   - **Deskripsi**: `Ruang Digital Storage API v1`
   - **Jalankan sebagai (Execute as)**: `Saya (email@gmail.com)` *(PENTING: pilih akun Google Anda)*
   - **Siapa yang memiliki akses (Who has access)**: **`Siapa saja (Anyone)`** *(PENTING: agar Next.js server dapat mengirim file)*
4. Klik tombol **Terapkan (Deploy)**.
5. Jika muncul permintaan izin (*Authorize Access*):
   - Klik **Beri Akses (Authorize Access)**.
   - Pilih akun Google Anda $\rightarrow$ Klik **Lanjutan (Advanced)** $\rightarrow$ Klik **Buka Ruang Digital (tidak aman)** $\rightarrow$ Klik **Izinkan (Allow)**.

### 4. Salin URL Web App ke `.env`
1. Setelah deploy selesai, Anda akan mendapatkan **URL Aplikasi Web**, contoh:
   `https://script.google.com/macros/s/AKfycbxAbCdEf123456789.../exec`
2. Buka file `.env` di proyek Ruang Digital Anda, lalu masukkan:
   ```env
   GOOGLE_APPS_SCRIPT_URL="https://script.google.com/macros/s/AKfycbxAbCdEf123456789.../exec"
   GOOGLE_APPS_SCRIPT_SECRET="your-gas-hmac-shared-secret-token"
   ```
3. Selesai! Sekarang:
   - Setiap foto produk yang Anda upload via panel admin akan otomatis terkirim dan disimpan di Google Drive Anda.
   - URL foto akan langsung menggunakan URL CDN Google: `https://lh3.googleusercontent.com/d/{fileId}` yang super cepat dan hemat bandwidth hosting!
