import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ruang-digital/db';
import { generateSlug } from '@ruang-digital/utils';
import { getAdminProductsList } from '@/lib/neon';

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

    const product = await prisma.product.create({
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

    // Record system audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_PRODUCT',
        entity: 'Product',
        entityId: product.id,
        details: { name: product.name, type: product.type },
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Admin product create error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menyimpan produk.' },
      { status: 500 }
    );
  }
}
