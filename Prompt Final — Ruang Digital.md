# RUANG DIGITAL — FULL-STACK E-COMMERCE

Anda bertindak sebagai **Senior Full-Stack Engineer, Software Architect, UI/UX Designer, Database Engineer, dan Security Engineer**.

Saya ingin membangun sebuah platform e-commerce bernama **Ruang Digital**.

Ruang Digital adalah toko online milik sendiri yang menjual dua jenis produk:

1. Produk digital
   - Aplikasi/software
   - Ebook/PDF
   - Template
   - Source code
   - Asset digital
   - File desain
   - License key
   - Produk digital lainnya

2. Produk fisik
   - Barang fisik umum
   - Merchandise
   - Produk dengan stok
   - Produk dengan varian

Platform harus dirancang agar produk digital dan fisik dapat dikelola dalam satu sistem katalog dan satu sistem order.

==================================================
## 1. TUJUAN UTAMA
==================================================

Bangun Ruang Digital sebagai platform yang:

- Mobile-first
- Modern
- Premium
- Clean
- Cepat
- Responsive
- SEO-friendly
- Aman
- Mudah dikembangkan
- Mudah dipelihara
- Memiliki dashboard admin
- Mendukung produk digital dan fisik
- Memiliki sistem pembayaran
- Memiliki sistem download produk digital
- Memiliki sistem order produk fisik

Jangan membuat aplikasi hanya sebagai prototype visual.

Semua fitur utama harus memiliki struktur backend, database, validasi, authorization, dan error handling yang benar.

==================================================
## 2. STACK TEKNOLOGI
==================================================

Gunakan:

Frontend / Web:
- Next.js
- TypeScript
- React
- Tailwind CSS
- Komponen UI yang reusable

Architecture:
- Monorepo
- pnpm
- Turborepo

Database:
- PostgreSQL
- Neon
- Prisma ORM

Authentication:
- Gunakan sistem authentication yang aman dan mudah dikembangkan.
- Role minimal:
  - CUSTOMER
  - ADMIN

Storage:
- Google Drive sebagai penyimpanan file digital
- Google Apps Script sebagai bridge/API antara aplikasi dan Google Drive

Payment:
- Buat payment abstraction layer sehingga provider pembayaran dapat diganti.
- Prioritaskan integrasi Midtrans untuk implementasi awal.
- Payment harus diverifikasi melalui server/webhook, bukan dipercaya dari frontend.

Deployment:
- Struktur harus siap untuk deployment ke Vercel.
- Environment variables harus digunakan untuk seluruh secret/configuration sensitif.

==================================================
## 3. MONOREPO
==================================================

Gunakan struktur monorepo yang rapi.

Contoh:

ruang-digital/

apps/
  web/
  admin/

packages/
  ui/
  db/
  auth/
  types/
  utils/
  config/

scripts/

package.json
pnpm-workspace.yaml
turbo.json
README.md

Penyesuaian struktur diperbolehkan jika secara arsitektur lebih baik.

Prinsip:

- Hindari duplikasi kode.
- Komponen UI reusable.
- Database logic berada di package database.
- Shared types berada di package types.
- Utility umum berada di package utils.
- Jangan mencampur business logic dengan UI secara berantakan.

==================================================
## 4. DATABASE
==================================================

Gunakan Neon PostgreSQL dengan Prisma.

Sebelum membuat UI kompleks, desain database dengan benar.

Minimal entity:

User
Address
Product
Category
ProductVariant
ProductImage
ProductFile
ProductLicense
Cart
CartItem
Order
OrderItem
Payment
Download
Coupon
CouponUsage
Review
Wishlist
Shipment
AuditLog

Gunakan enum untuk status penting.

Contoh:

UserRole:
- CUSTOMER
- ADMIN

ProductType:
- DIGITAL
- PHYSICAL

ProductStatus:
- DRAFT
- ACTIVE
- ARCHIVED

OrderStatus:
- PENDING
- PAID
- PROCESSING
- SHIPPED
- DELIVERED
- COMPLETED
- CANCELLED
- REFUNDED

PaymentStatus:
- PENDING
- PAID
- FAILED
- EXPIRED
- REFUNDED

ShipmentStatus:
- PENDING
- PROCESSING
- SHIPPED
- DELIVERED
- RETURNED

Tambahkan:

- primary key
- foreign key
- unique constraint
- index
- createdAt
- updatedAt
- relation yang tepat

Hindari over-engineering, tetapi database harus siap dikembangkan.

==================================================
## 5. PRODUCT SYSTEM
==================================================

Gunakan satu model Product untuk semua produk.

Product memiliki:

type:
- DIGITAL
- PHYSICAL

Contoh:

Ebook Trading:
type = DIGITAL

Aplikasi Kasir:
type = DIGITAL

Kaos:
type = PHYSICAL

Produk digital dapat memiliki:

- file
- versi
- platform
- license key
- ukuran file
- format file

Produk fisik dapat memiliki:

- SKU
- stok
- berat
- varian
- ukuran
- warna

Jangan membuat dua sistem produk terpisah jika tidak diperlukan.

==================================================
## 6. GOOGLE DRIVE + GOOGLE APPS SCRIPT
==================================================

Jangan menyimpan file digital langsung di database.

Database hanya menyimpan metadata.

Contoh:

ProductFile:

- id
- productId
- fileName
- fileType
- driveFileId
- version
- fileSize
- isActive
- createdAt
- updatedAt

Google Drive menjadi storage.

Google Apps Script menjadi bridge.

Arsitektur:

Ruang Digital
      ↓
Server
      ↓
Google Apps Script
      ↓
Google Drive

Buat API bridge yang aman.

Minimal operasi:

POST /upload
POST /download
POST /delete
GET /file

Jangan expose Google Drive URL secara langsung kepada customer.

Customer hanya dapat mengakses file jika:

1. User sudah login.
2. Order valid.
3. Payment status = PAID.
4. User memang memiliki produk tersebut.
5. File masih aktif.

Download harus melalui server-side authorization.

==================================================
## 7. DIGITAL DOWNLOAD SYSTEM
==================================================

Setelah pembayaran berhasil:

Order:
PENDING
↓
PAID
↓
Customer mendapatkan akses produk.

Customer dapat membuka:

/dashboard/products

Contoh:

Aplikasi Kasir Pro
Version 1.4.2

[Download Windows]
[Download Android]

atau:

Ebook Trading
Version 2.0

[Download Ebook]

Sistem harus mencatat:

- userId
- productId
- orderId
- fileId
- download time
- IP jika diperlukan
- user agent jika diperlukan

Buat model Download.

Pertimbangkan signed token atau mekanisme akses sementara agar file tidak mudah dibagikan.

==================================================
## 8. LICENSE SYSTEM
==================================================

Produk digital tertentu dapat menggunakan license key.

Contoh:

ProductLicense:

- id
- productId
- orderId
- userId
- licenseKey
- status
- createdAt
- expiresAt

Status:

- ACTIVE
- REVOKED
- EXPIRED

Jangan wajibkan semua produk menggunakan license.

License hanya digunakan jika produk memerlukannya.

==================================================
## 9. CART
==================================================

Customer dapat:

- menambah produk
- mengurangi quantity
- menghapus produk
- melihat subtotal
- melihat total

Pastikan produk digital dan fisik dapat berada dalam sistem cart yang sama.

Validasi:

- produk masih aktif
- stok tersedia untuk produk fisik
- quantity valid
- harga dihitung ulang di server

Jangan percaya total harga yang dikirim frontend.

==================================================
## 10. CHECKOUT
==================================================

Checkout harus memiliki flow:

Cart
↓
Checkout
↓
Customer information
↓
Address jika ada produk fisik
↓
Payment
↓
Payment verification
↓
Order confirmation

Jika order hanya berisi produk digital:

Alamat tidak wajib.

Jika order mengandung produk fisik:

Alamat wajib.

Harga final harus dihitung server-side.

==================================================
## 11. PAYMENT
==================================================

Gunakan abstraction:

PaymentService

Contoh:

createPayment()
verifyPayment()
handleWebhook()
refundPayment()

Jangan membuat business logic terlalu bergantung kepada Midtrans.

Midtrans adalah provider pertama.

Webhook:

Payment Gateway
↓
Webhook
↓
Server
↓
Verify transaction
↓
Update Payment
↓
Update Order
↓
Grant Digital Access

Jangan mengubah order menjadi PAID hanya karena frontend mengatakan pembayaran berhasil.

Webhook harus idempotent agar tidak memproses transaksi dua kali.

==================================================
## 12. ORDER SYSTEM
==================================================

Order harus mendukung digital dan physical.

Contoh digital:

PENDING
↓
PAID
↓
COMPLETED

Contoh physical:

PENDING
↓
PAID
↓
PROCESSING
↓
SHIPPED
↓
DELIVERED
↓
COMPLETED

OrderItem menyimpan snapshot penting:

- product name
- SKU
- price
- quantity
- subtotal

Jangan bergantung sepenuhnya pada data Product saat membaca order lama.

==================================================
## 13. SHIPPING
==================================================

Untuk MVP, jangan membuat sistem logistik terlalu kompleks.

Minimal:

Shipment:

- orderId
- courier
- service
- trackingNumber
- status
- shippedAt
- deliveredAt

Admin dapat mengubah status dan memasukkan nomor resi.

Integrasi courier dapat dibuat pada fase berikutnya.

==================================================
## 14. CUSTOMER DASHBOARD
==================================================

Customer memiliki:

/dashboard

Menu:

- Overview
- Orders
- Products
- Downloads
- Wishlist
- Reviews
- Addresses
- Profile

Untuk produk digital:

Customer dapat melihat semua produk digital yang sudah dibeli.

Untuk order fisik:

Customer dapat melihat status pengiriman.

==================================================
## 15. ADMIN DASHBOARD
==================================================

Admin memiliki:

/admin

Dashboard:

- Revenue
- Orders
- Customers
- Products
- Digital products
- Physical products
- Low stock
- Recent orders
- Sales analytics

Menu:

Products
Categories
Orders
Customers
Payments
Shipments
Digital Files
Coupons
Reviews
Banners
Settings
Audit Logs

Admin harus menggunakan authorization server-side.

Jangan hanya menyembunyikan menu admin dari frontend.

==================================================
## 16. PRODUCT MANAGEMENT
==================================================

Admin dapat:

- create product
- edit product
- delete/archive product
- upload image
- upload digital file
- set price
- set discount
- set category
- set stock
- set SKU
- set variant
- set product status

Untuk digital product:

- upload file
- version
- platform
- license setting

Untuk physical product:

- stock
- SKU
- weight
- variant

==================================================
## 17. HOMEPAGE
==================================================

Homepage harus terasa seperti toko digital modern.

Mobile-first.

Struktur:

Header
↓
Hero
↓
Search
↓
Categories
↓
Featured Products
↓
Best Sellers
↓
Latest Products
↓
Digital Products
↓
Physical Products
↓
CTA
↓
Footer

Bottom navigation pada mobile dapat digunakan:

Home
Products
Cart
Orders
Profile

Jangan membuat UI terlalu ramai.

==================================================
## 18. DESIGN SYSTEM
==================================================

Ruang Digital harus memiliki identitas visual sendiri.

Karakter:

- modern
- premium
- clean
- minimal
- profesional
- trustworthy

Prioritaskan:

- typography
- spacing
- hierarchy
- card design
- button consistency
- responsive layout
- accessibility

Jangan membuat desain seperti dashboard template generik.

Jangan menggunakan terlalu banyak gradient, shadow, animasi, atau elemen dekoratif yang tidak memiliki fungsi.

Mobile harus menjadi prioritas pertama.

==================================================
## 19. SEARCH & CATEGORY
==================================================

Customer dapat:

- search produk
- filter kategori
- filter tipe
- sort harga
- sort terbaru
- sort terlaris

URL harus SEO-friendly.

Contoh:

/produk
/produk/ebook
/produk/aplikasi
/produk/template
/produk/nama-produk

Gunakan slug.

==================================================
## 20. SEO
==================================================

Setiap product memiliki:

- title
- description
- slug
- metadata
- Open Graph
- canonical URL
- structured data jika sesuai

Gunakan SEO server-side Next.js.

Pastikan halaman produk dapat di-index search engine.

==================================================
## 21. SECURITY
==================================================

Security adalah bagian inti.

Implementasikan:

- authentication
- authorization
- role-based access control
- server-side validation
- input validation
- secure webhook
- rate limiting jika diperlukan
- CSRF protection sesuai architecture
- secure cookies/session
- environment variables
- secret management
- download authorization
- payment verification
- idempotent webhook
- audit log untuk aktivitas admin

Jangan pernah:

- expose database credentials
- expose API secrets
- expose Google credentials
- expose payment secret
- percaya harga dari frontend
- percaya status payment dari frontend
- memberikan public Google Drive link untuk file premium

==================================================
## 22. ENVIRONMENT VARIABLES
==================================================

Buat .env.example.

Contoh:

DATABASE_URL=
DIRECT_URL=

AUTH_SECRET=

MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=

GOOGLE_APPS_SCRIPT_URL=
GOOGLE_APPS_SCRIPT_SECRET=

NEXT_PUBLIC_APP_URL=

Jangan commit .env.

==================================================
## 23. ERROR HANDLING
==================================================

Semua bagian penting harus memiliki:

- loading state
- error state
- empty state
- success state
- validation message

Contoh:

Cart kosong:
"Keranjang masih kosong."

Order gagal:
"Pesanan tidak dapat diproses."

Download gagal:
"File tidak dapat diakses. Silakan coba lagi."

Gunakan error handling yang jelas.

Jangan menampilkan stack trace atau secret kepada customer.

==================================================
## 24. CODE QUALITY
==================================================

Gunakan:

- TypeScript strict
- reusable components
- clean architecture
- meaningful naming
- separation of concerns
- server/client boundary yang jelas
- validation schema
- database transactions jika diperlukan

Hindari:

- any berlebihan
- duplicate code
- hardcoded secret
- business logic di component UI
- giant component
- unnecessary abstraction
- premature optimization

==================================================
## 25. DEVELOPMENT PHASE
==================================================

Jangan langsung membangun seluruh sistem sekaligus.

Gunakan fase berikut.

PHASE 1 — FOUNDATION

Bangun:

- monorepo
- pnpm
- Turborepo
- Next.js
- TypeScript
- Tailwind
- shared UI
- Prisma
- Neon connection
- environment configuration
- basic linting/formatting

Output harus bisa dijalankan.

PHASE 2 — DATABASE

Bangun:

- Prisma schema
- relations
- enums
- indexes
- migration
- seed data

Pastikan database valid.

PHASE 3 — AUTH

Bangun:

- register
- login
- logout
- session
- customer
- admin
- authorization

PHASE 4 — PRODUCT

Bangun:

- category
- product
- product detail
- product listing
- search
- filtering
- admin CRUD

PHASE 5 — CART & CHECKOUT

Bangun:

- cart
- checkout
- server-side price calculation
- order creation

PHASE 6 — PAYMENT

Bangun:

- payment service
- Midtrans
- webhook
- verification
- idempotency

PHASE 7 — DIGITAL DELIVERY

Bangun:

- Google Apps Script bridge
- Google Drive
- digital file metadata
- ownership
- secure download
- download history

PHASE 8 — PHYSICAL PRODUCT

Bangun:

- stock
- SKU
- variant
- address
- shipment
- tracking number

PHASE 9 — CUSTOMER DASHBOARD

Bangun:

- orders
- purchased products
- downloads
- profile
- addresses

PHASE 10 — ADMIN

Bangun:

- dashboard
- orders
- products
- customers
- payments
- digital files
- shipment

PHASE 11 — POLISH

Bangun:

- SEO
- loading state
- error state
- empty state
- accessibility
- responsive refinement
- performance optimization

==================================================
## 26. DEVELOPMENT RULE
==================================================

Setiap fase harus:

1. Menjelaskan apa yang dibuat.
2. Membuat file yang diperlukan.
3. Menjalankan migration/build/typecheck/lint jika tersedia.
4. Memperbaiki error.
5. Memastikan fitur dapat dijalankan.
6. Baru melanjutkan ke fase berikutnya.

Jangan mengatakan "sudah selesai" jika kode belum diverifikasi.

Jika menemukan keputusan arsitektur yang ambigu, pilih solusi yang:

- sederhana
- aman
- scalable
- mudah dipelihara
- sesuai dengan stack yang telah ditentukan

Jangan menambahkan teknologi baru tanpa alasan yang jelas.

==================================================
## 27. IMPORTANT
==================================================

Jangan membuat mockup yang terlihat selesai tetapi backend kosong.

Ruang Digital harus dibangun sebagai aplikasi nyata.

Prioritas:

1. Architecture
2. Database
3. Security
4. Business logic
5. API/server
6. UI
7. Polish

Namun UI tetap harus terlihat profesional sejak MVP.

Gunakan dummy/seed data hanya untuk development.

Pisahkan development data dan production data.

==================================================
## 28. OUTPUT PERTAMA
==================================================

Untuk tahap pertama, JANGAN langsung membuat seluruh aplikasi.

Mulai dengan:

1. Analisis requirement.
2. Finalisasi architecture.
3. Tentukan struktur monorepo.
4. Buat database ERD secara konseptual.
5. Buat Prisma schema lengkap.
6. Jelaskan relationship antar model.
7. Buat struktur folder.
8. Buat roadmap implementasi.
9. Setelah itu baru mulai Phase 1.

Setelah setiap fase selesai, tampilkan:

- apa yang dibuat
- file penting yang dibuat/diubah
- database changes
- command yang dijalankan
- hasil verification
- masalah yang ditemukan
- solusi
- langkah berikutnya

Jangan melompati fondasi.

Nama project:

RUANG DIGITAL

Tagline sementara:

"Tempat Produk Digital & Fisik"

Gunakan bahasa Indonesia untuk teks UI, tetapi gunakan bahasa Inggris untuk nama variable, function, database model, dan source code.

Mulai sekarang dengan **Architecture + Database Blueprint**, bukan langsung membuat halaman homepage.