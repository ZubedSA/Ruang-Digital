import { PrismaClient, UserRole, ProductType, ProductStatus, DiscountType } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Plain text passwords for seed users (password: 'Admin123!' and 'Customer123!')
function hashPassword(password: string): string {
  return password;
}

async function main() {
  console.log('🌱 Starting Ruang Digital database seeding...');

  // 1. Create Users
  const adminPassword = hashPassword('Admin123!');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ruangdigital.com' },
    update: {
      passwordHash: adminPassword,
    },
    create: {
      email: 'admin@ruangdigital.com',
      passwordHash: adminPassword,
      name: 'Super Admin Ruang Digital',
      phone: '081234567890',
      role: UserRole.ADMIN,
    },
  });

  const customerPassword = hashPassword('Customer123!');
  const customer = await prisma.user.upsert({
    where: { email: 'customer@ruangdigital.com' },
    update: {
      passwordHash: customerPassword,
    },
    create: {
      email: 'customer@ruangdigital.com',
      passwordHash: customerPassword,
      name: 'Budi Santoso',
      phone: '089876543210',
      role: UserRole.CUSTOMER,
      addresses: {
        create: {
          label: 'Rumah',
          recipientName: 'Budi Santoso',
          phone: '089876543210',
          street: 'Jl. Sudirman No. 45 RT 02/05',
          subdistrict: 'Kebayoran Baru',
          city: 'Jakarta Selatan',
          province: 'DKI Jakarta',
          postalCode: '12190',
          isDefault: true,
        },
      },
    },
  });

  console.log('✅ Users seeded:', admin.email, customer.email);

  // 2. Create Categories
  const catAplikasi = await prisma.category.upsert({
    where: { slug: 'aplikasi' },
    update: {},
    create: {
      name: 'Aplikasi & Software',
      slug: 'aplikasi',
      description: 'Aplikasi desktop, mobile, dan sistem POS siap pakai.',
      icon: 'AppWindow',
    },
  });

  const catEbook = await prisma.category.upsert({
    where: { slug: 'ebook' },
    update: {},
    create: {
      name: 'Ebook & Panduan',
      slug: 'ebook',
      description: 'Panduan lengkap bisnis, coding, dan investasi dalam format PDF/EPUB.',
      icon: 'BookOpen',
    },
  });

  const catTemplate = await prisma.category.upsert({
    where: { slug: 'template' },
    update: {},
    create: {
      name: 'Template & Desain',
      slug: 'template',
      description: 'Template Notion, Figma UI Kit, dan source code boilerplate.',
      icon: 'LayoutTemplate',
    },
  });

  const catMerch = await prisma.category.upsert({
    where: { slug: 'merchandise' },
    update: {},
    create: {
      name: 'Merchandise & Fisik',
      slug: 'merchandise',
      description: 'Kaos developer, tumbler, sticker pack, dan aksesoris resmi.',
      icon: 'ShoppingBag',
    },
  });

  console.log('✅ Categories seeded');

  // 3. Create Products (Digital)
  const prodKasir = await prisma.product.upsert({
    where: { slug: 'aplikasi-kasir-pos-pro' },
    update: {},
    create: {
      name: 'Aplikasi Kasir POS Pro',
      slug: 'aplikasi-kasir-pos-pro',
      description: 'Aplikasi kasir lengkap dengan laporan keuangan otomatis, cetak struk bluetooth, dan offline support. Sangat cocok untuk toko retail, UMKM, dan coffee shop.',
      shortDescription: 'Software kasir POS multifungsi untuk Windows & Android dengan lisensi resmi.',
      type: ProductType.DIGITAL,
      status: ProductStatus.ACTIVE,
      basePrice: 349000,
      discountPrice: 249000,
      categoryId: catAplikasi.id,
      featuredImage: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800&auto=format&fit=crop&q=80',
      isFeatured: true,
      files: {
        create: [
          {
            fileName: 'AplikasiKasirPro-Setup-v1.4.exe',
            fileType: 'exe',
            driveFileId: 'drive_file_id_win_kasir_01',
            version: '1.4.2',
            platform: 'Windows',
            fileSize: 45000000, // 45 MB
          },
          {
            fileName: 'AplikasiKasirPro-v1.4.apk',
            fileType: 'apk',
            driveFileId: 'drive_file_id_apk_kasir_02',
            version: '1.4.2',
            platform: 'Android',
            fileSize: 22000000, // 22 MB
          },
        ],
      },
    },
  });

  const prodEbook = await prisma.product.upsert({
    where: { slug: 'ebook-mastering-fullstack-nextjs' },
    update: {},
    create: {
      name: 'Ebook: Mastering Full-Stack Next.js 14 & Prisma',
      slug: 'ebook-mastering-fullstack-nextjs',
      description: 'Panduan step-by-step membangun aplikasi skala enterprise menggunakan Next.js App Router, Turborepo, Prisma, Neon PostgreSQL, dan payment gateway Midtrans.',
      shortDescription: '350+ halaman ebook panduan komprehensif full-stack development modern.',
      type: ProductType.DIGITAL,
      status: ProductStatus.ACTIVE,
      basePrice: 150000,
      discountPrice: 99000,
      categoryId: catEbook.id,
      featuredImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
      isFeatured: true,
      files: {
        create: [
          {
            fileName: 'Mastering-NextJS-14-Fullstack.pdf',
            fileType: 'pdf',
            driveFileId: 'drive_file_id_ebook_nextjs_03',
            version: '2.0.0',
            platform: 'All',
            fileSize: 15800000, // 15.8 MB
          },
        ],
      },
    },
  });

  const prodNotion = await prisma.product.upsert({
    where: { slug: 'ultimate-notion-freelance-os' },
    update: {},
    create: {
      name: 'Ultimate Notion Freelance OS',
      slug: 'ultimate-notion-freelance-os',
      description: 'Sistem manajemen proyek, invoice, CRM klien, dan pelacak keuangan khusus freelancer dan agensi digital dalam 1 template Notion terintegrasi.',
      shortDescription: 'Template Notion terlengkap untuk mengelola klien, proyek, dan keuangan freelance.',
      type: ProductType.DIGITAL,
      status: ProductStatus.ACTIVE,
      basePrice: 120000,
      discountPrice: 79000,
      categoryId: catTemplate.id,
      featuredImage: 'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=800&auto=format&fit=crop&q=80',
      isFeatured: false,
      files: {
        create: [
          {
            fileName: 'Notion-Freelance-OS-Guide-Link.pdf',
            fileType: 'pdf',
            driveFileId: 'drive_file_id_notion_os_04',
            version: '1.1.0',
            platform: 'All',
            fileSize: 3200000,
          },
        ],
      },
    },
  });

  // 4. Create Products (Physical)
  const prodKaos = await prisma.product.upsert({
    where: { slug: 'kaos-developer-commit-push' },
    update: {},
    create: {
      name: 'Kaos Developer "git commit && push"',
      slug: 'kaos-developer-commit-push',
      description: 'Kaos berbahan Premium Cotton Combed 30s reaktif yang lembut, adem, dan nyaman dipakai coding seharian. Sablon discharge awet dan tahan cuci berkali-kali.',
      shortDescription: 'Kaos distro developer premium berbahan Cotton Combed 30s.',
      type: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      basePrice: 135000,
      categoryId: catMerch.id,
      featuredImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      isFeatured: true,
      weightInGrams: 250,
      stock: 50,
      sku: 'RD-TSHIRT-001',
      variants: {
        create: [
          { name: 'Hitam - M', sku: 'RD-TSHIRT-001-BLK-M', price: 135000, stock: 20, attributes: { size: 'M', color: 'Hitam' } },
          { name: 'Hitam - L', sku: 'RD-TSHIRT-001-BLK-L', price: 135000, stock: 20, attributes: { size: 'L', color: 'Hitam' } },
          { name: 'Hitam - XL', sku: 'RD-TSHIRT-001-BLK-XL', price: 145000, stock: 10, attributes: { size: 'XL', color: 'Hitam' } },
        ],
      },
    },
  });

  const prodTumbler = await prisma.product.upsert({
    where: { slug: 'tumbler-stainless-steel-ruang-digital' },
    update: {},
    create: {
      name: 'Tumbler Stainless Steel Ruang Digital (500ml)',
      slug: 'tumbler-stainless-steel-ruang-digital',
      description: 'Tumbler vacuum flask berbahan Stainless Steel SUS 304 food grade ganda. Menjaga suhu kopi panas hingga 8 jam dan minuman dingin hingga 12 jam.',
      shortDescription: 'Tumbler termal elegan tahan panas/dingin berlogo grafir Ruang Digital.',
      type: ProductType.PHYSICAL,
      status: ProductStatus.ACTIVE,
      basePrice: 165000,
      discountPrice: 145000,
      categoryId: catMerch.id,
      featuredImage: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80',
      isFeatured: false,
      weightInGrams: 350,
      stock: 35,
      sku: 'RD-TMBLR-002',
      variants: {
        create: [
          { name: 'Matte Black', sku: 'RD-TMBLR-002-BLK', price: 145000, stock: 20, attributes: { color: 'Matte Black' } },
          { name: 'Silver Chrome', sku: 'RD-TMBLR-002-SLV', price: 145000, stock: 15, attributes: { color: 'Silver Chrome' } },
        ],
      },
    },
  });

  console.log('✅ Products seeded (3 Digital, 2 Physical)');

  // 5. Create Coupons
  await prisma.coupon.upsert({
    where: { code: 'DISKONHEMAT' },
    update: {},
    create: {
      code: 'DISKONHEMAT',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20, // 20%
      minPurchase: 100000,
      maxDiscount: 50000,
      quota: 50,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2027-12-31'),
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'KODEDIGITAL' },
    update: {},
    create: {
      code: 'KODEDIGITAL',
      discountType: DiscountType.FIXED,
      discountValue: 25000, // Rp 25.000
      minPurchase: 50000,
      quota: 100,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2027-12-31'),
      isActive: true,
    },
  });

    console.log('✅ Coupons seeded');

    // 6. Seed Sample Paid Order, License, Download Log, and Review
    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber: 'ORD-DEMO-001' },
    });

    if (!existingOrder) {
      const demoOrder = await prisma.order.create({
        data: {
          orderNumber: 'ORD-DEMO-001',
          userId: customer.id,
          status: 'PAID',
          subtotalAmount: 249000,
          discountAmount: 0,
          shippingFee: 0,
          totalAmount: 249000,
          items: {
            create: [
              {
                productId: prodKasir.id,
                productName: prodKasir.name,
                productType: 'DIGITAL',
                sku: 'RD-POS-001',
                price: 249000,
                quantity: 1,
                subtotal: 249000,
              },
            ],
          },
          payments: {
            create: {
              provider: 'MIDTRANS',
              transactionId: 'TRX-MIDTRANS-DEMO-001',
              paymentMethod: 'qris',
              status: 'PAID',
              amount: 249000,
              paidAt: new Date(),
            },
          },
          licenses: {
            create: {
              productId: prodKasir.id,
              userId: customer.id,
              licenseKey: 'RD-POS-8899-7722-ABCD',
              status: 'ACTIVE',
            },
          },
        },
        include: { items: true },
      });

      // Seed Download audit log
      const kasirFile = await prisma.productFile.findFirst({
        where: { productId: prodKasir.id },
      });
      if (kasirFile) {
        await prisma.download.create({
          data: {
            userId: customer.id,
            productId: prodKasir.id,
            orderId: demoOrder.id,
            fileId: kasirFile.id,
            ipAddress: '127.0.0.1',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          },
        });
      }

      // Seed Sample Review
      if (demoOrder.items[0]) {
        await prisma.review.create({
          data: {
            userId: customer.id,
            productId: prodKasir.id,
            orderItemId: demoOrder.items[0].id,
            rating: 5,
            comment: 'Aplikasi kasir sangat responsif dan mudah digunakan untuk toko saya. Cetak struk bluetooth lancar!',
            isApproved: true,
          },
        });
      }
      console.log('✅ Demo order, license, download log, and reviews seeded');
    }

    console.log('🎉 Seed completed successfully!');
  }

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
