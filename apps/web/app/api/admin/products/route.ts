import { NextRequest, NextResponse } from 'next/server';
import { generateSlug } from '@ruang-digital/utils';
import { getAdminProductsList, neonQuery } from '@/lib/neon';

export async function GET() {
  try {
    const products = await getAdminProductsList();
    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    console.error('Admin products GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memuat produk' },
      { status: 500 }
    );
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
        $1, $2, $3, $4, $5, $6::"ProductType", 'ACTIVE'::"ProductStatus",
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

    // Save Product Images
    if (images && Array.isArray(images) && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const imgId = `img-${newId}-${i}-${Date.now().toString().slice(-4)}`;
        await neonQuery(
          'INSERT INTO "ProductImage" (id, "productId", url, "sortOrder", "createdAt") VALUES ($1, $2, $3, $4, NOW())',
          [imgId, newId, images[i], i]
        );
      }
    }

    // Save Product File if digital
    if (type === 'DIGITAL' && fileName && driveFileId) {
      const fileId = `file-${newId}-${Date.now().toString().slice(-4)}`;
      const fileExt = fileName.split('.').pop() || 'zip';
      await neonQuery(
        `INSERT INTO "ProductFile" (
          id, "productId", "fileName", "fileType", "driveFileId", version, platform, "fileSize", "isActive", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 1048576, true, NOW(), NOW()
        )`,
        [
          fileId,
          newId,
          fileName,
          fileExt,
          driveFileId,
          fileVersion || '1.0.0',
          platform || 'All',
        ]
      );
    }

    const product = {
      id: newId,
      name,
      slug,
      type,
      basePrice: parsedBasePrice,
      discountPrice: parsedDiscountPrice,
      featuredImage: coverImage,
    };

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Admin product create error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menyimpan produk.' },
      { status: 500 }
    );
  }
}
