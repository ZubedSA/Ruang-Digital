import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ruang-digital/db';
import { generateSlug } from '@ruang-digital/utils';
import { getAdminProductsList, neonQuery } from '@/lib/neon';

export async function GET() {
  try {
    let products: any[] = [];
    try {
      products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          files: true,
          variants: true,
        },
      });
    } catch (prismaErr) {
      console.warn('Prisma admin products GET failed, using Neon fallback:', prismaErr);
      products = await getAdminProductsList();
    }

    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    try {
      const products = await getAdminProductsList();
      return NextResponse.json({ success: true, data: products });
    } catch (err: any) {
      return NextResponse.json({ error: error.message || 'Gagal memuat produk' }, { status: 500 });
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      description,
      shortDescription,
      type,
      basePrice,
      discountPrice,
      categoryId,
      featuredImage,
      images,
      stock,
      weightInGrams,
      sku,
      fileName,
      driveFileId,
      fileVersion,
      platform,
    } = body;

    if (!name || !type || !basePrice || !categoryId) {
      return NextResponse.json(
        { error: 'Nama produk, tipe, harga, dan kategori wajib diisi.' },
        { status: 400 }
      );
    }

    const slug = generateSlug(name) + '-' + Math.floor(100 + Math.random() * 900);
    const coverImage = (images && images.length > 0 ? images[0] : featuredImage) || 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800';

    let product: any = null;
    try {
      product = await prisma.product.create({
        data: {
          name,
          slug,
          description: description || name,
          shortDescription: shortDescription || null,
          type,
          status: 'ACTIVE',
          basePrice: parseInt(basePrice, 10),
          discountPrice: discountPrice ? parseInt(discountPrice, 10) : null,
          categoryId,
          featuredImage: coverImage,
          stock: type === 'PHYSICAL' ? parseInt(stock || 0, 10) : 0,
          weightInGrams: type === 'PHYSICAL' ? parseInt(weightInGrams || 200, 10) : null,
          sku: sku || null,
          images:
            images && Array.isArray(images) && images.length > 0
              ? {
                  create: images.map((url: string, index: number) => ({
                    url,
                    sortOrder: index,
                  })),
                }
              : undefined,
          files:
            type === 'DIGITAL' && fileName && driveFileId
              ? {
                  create: {
                    fileName,
                    fileType: fileName.split('.').pop() || 'zip',
                    driveFileId,
                    version: fileVersion || '1.0.0',
                    platform: platform || 'All',
                    fileSize: 1024 * 1024,
                  },
                }
              : undefined,
        },
        include: {
          images: true,
          files: true,
        },
      });
    } catch (prismaErr) {
      console.warn('Prisma create product failed, using Neon HTTP fallback:', prismaErr);
      const newId = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const parsedBasePrice = parseInt(basePrice, 10);
      const parsedDiscountPrice = discountPrice ? parseInt(discountPrice, 10) : null;
      const parsedStock = type === 'PHYSICAL' ? parseInt(stock || 0, 10) : 0;
      const parsedWeight = type === 'PHYSICAL' ? parseInt(weightInGrams || 200, 10) : null;

      await neonQuery(
        `INSERT INTO "Product" (
          id, name, slug, description, "shortDescription", type, status,
          "basePrice", "discountPrice", "categoryId", "featuredImage", "isFeatured",
          stock, "weightInGrams", sku, "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'ACTIVE',
          $7, $8, $9, $10, false,
          $11, $12, $13, NOW(), NOW()
        )`,
        [
          newId,
          name,
          slug,
          description || name,
          shortDescription || null,
          type,
          parsedBasePrice,
          parsedDiscountPrice,
          categoryId,
          coverImage,
          parsedStock,
          parsedWeight,
          sku || null,
        ]
      );

      if (images && Array.isArray(images) && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const imgId = `img-${newId}-${i}-${Date.now().toString().slice(-4)}`;
          await neonQuery(
            'INSERT INTO "ProductImage" (id, "productId", url, "sortOrder", "createdAt") VALUES ($1, $2, $3, $4, NOW())',
            [imgId, newId, images[i], i]
          );
        }
      }

      product = {
        id: newId,
        name,
        slug,
        type,
        basePrice: parsedBasePrice,
        discountPrice: parsedDiscountPrice,
        featuredImage: coverImage,
      };
    }

    // Record system audit log (non-blocking)
    try {
      await prisma.auditLog.create({
        data: {
          action: 'CREATE_PRODUCT',
          entity: 'Product',
          entityId: product.id,
          details: { name: product.name, type: product.type },
        },
      });
    } catch {
      // Ignored
    }

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Admin product create error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menyimpan produk.' },
      { status: 500 }
    );
  }
}
