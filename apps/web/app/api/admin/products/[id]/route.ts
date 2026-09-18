import { NextRequest, NextResponse } from 'next/server';
import { generateSlug } from '@ruang-digital/utils';
import { getAdminProductById, neonQuery } from '@/lib/neon';

// GET: Fetch single product details for editing
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const product = await getAdminProductById(id);

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produk tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    console.error('Fetch product error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil data produk.' },
      { status: 500 }
    );
  }
}

// PUT: Update product details
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const {
      name,
      slug,
      description,
      shortDescription,
      type,
      status,
      basePrice,
      discountPrice,
      categoryId,
      featuredImage,
      images,
      isFeatured,
      stock,
      weightInGrams,
      sku,
      fileName,
      driveFileId,
      fileVersion,
      platform,
    } = body;

    // Fetch existing product via Neon HTTP
    const existingRows = await neonQuery<any>(
      'SELECT * FROM "Product" WHERE id = $1 LIMIT 1',
      [id]
    );

    if (!existingRows || existingRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Produk tidak ditemukan.' },
        { status: 404 }
      );
    }

    const existing = existingRows[0];

    // Determine final slug
    let finalSlug = existing.slug;
    if (slug && slug.trim() && slug.trim() !== existing.slug) {
      finalSlug = generateSlug(slug.trim());
      const duplicateCheck = await neonQuery<any>(
        'SELECT id FROM "Product" WHERE slug = $1 AND id != $2 LIMIT 1',
        [finalSlug, id]
      );
      if (duplicateCheck && duplicateCheck.length > 0) {
        finalSlug = `${finalSlug}-${Math.floor(100 + Math.random() * 900)}`;
      }
    } else if (name && name !== existing.name && !slug) {
      finalSlug = generateSlug(name) + '-' + Math.floor(100 + Math.random() * 900);
    }

    // Determine featured image
    let finalFeaturedImage = featuredImage !== undefined ? featuredImage : existing.featuredImage;
    if (images !== undefined && Array.isArray(images) && images.length > 0) {
      finalFeaturedImage = images[0];
    }

    // Parse numbers & booleans
    const parsedBasePrice = basePrice !== undefined ? parseInt(basePrice, 10) : existing.basePrice;
    const parsedDiscountPrice = discountPrice ? parseInt(discountPrice, 10) : null;
    const parsedStock = type === 'PHYSICAL' ? parseInt(stock || 0, 10) : 0;
    const parsedWeight = type === 'PHYSICAL' ? parseInt(weightInGrams || 0, 10) : null;
    const parsedIsFeatured = isFeatured !== undefined ? Boolean(isFeatured) : existing.isFeatured;
    const finalType = type !== undefined ? type : existing.type;
    const finalStatus = status !== undefined ? status : existing.status;
    const finalCategoryId = categoryId !== undefined ? categoryId : existing.categoryId;

    // Update Product record in Neon
    await neonQuery(
      `UPDATE "Product" SET 
        name = $1,
        slug = $2,
        description = $3,
        "shortDescription" = $4,
        type = $5::"ProductType",
        status = $6::"ProductStatus",
        "basePrice" = $7,
        "discountPrice" = $8,
        "categoryId" = $9,
        "featuredImage" = $10,
        "isFeatured" = $11,
        stock = $12,
        "weightInGrams" = $13,
        sku = $14,
        "updatedAt" = NOW()
      WHERE id = $15`,
      [
        name !== undefined ? name : existing.name,
        finalSlug,
        description !== undefined ? description : existing.description,
        shortDescription !== undefined ? shortDescription : existing.shortDescription,
        finalType,
        finalStatus,
        parsedBasePrice,
        parsedDiscountPrice,
        finalCategoryId,
        finalFeaturedImage,
        parsedIsFeatured,
        parsedStock,
        parsedWeight,
        sku !== undefined ? sku : existing.sku,
        id,
      ]
    );

    // Update Product Images if provided
    if (images !== undefined && Array.isArray(images)) {
      await neonQuery('DELETE FROM "ProductImage" WHERE "productId" = $1', [id]);
      for (let i = 0; i < images.length; i++) {
        const imgId = `img-${id}-${i}-${Date.now().toString().slice(-4)}`;
        await neonQuery(
          'INSERT INTO "ProductImage" (id, "productId", url, "sortOrder", "createdAt") VALUES ($1, $2, $3, $4, NOW())',
          [imgId, id, images[i], i]
        );
      }
    }

    // Update Product File if digital product
    if (finalType === 'DIGITAL' && fileName && driveFileId) {
      const existingFiles = await neonQuery<any>(
        'SELECT id FROM "ProductFile" WHERE "productId" = $1 LIMIT 1',
        [id]
      );
      const fileExt = fileName.split('.').pop() || 'zip';

      if (existingFiles && existingFiles.length > 0) {
        await neonQuery(
          `UPDATE "ProductFile" SET 
            "fileName" = $1,
            "fileType" = $2,
            "driveFileId" = $3,
            version = $4,
            platform = $5,
            "updatedAt" = NOW()
          WHERE id = $6`,
          [
            fileName,
            fileExt,
            driveFileId,
            fileVersion || '1.0.0',
            platform || 'All',
            existingFiles[0].id,
          ]
        );
      } else {
        const fileId = `file-${id}-${Date.now().toString().slice(-4)}`;
        await neonQuery(
          `INSERT INTO "ProductFile" (
            id, "productId", "fileName", "fileType", "driveFileId", version, platform, "fileSize", "isActive", "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, 1048576, true, NOW(), NOW()
          )`,
          [
            fileId,
            id,
            fileName,
            fileExt,
            driveFileId,
            fileVersion || '1.0.0',
            platform || 'All',
          ]
        );
      }
    }

    // Return the updated product
    const updatedProduct = await getAdminProductById(id);
    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error: any) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memperbarui data produk.' },
      { status: 500 }
    );
  }
}

// DELETE: Remove or archive product
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const existingRows = await neonQuery<any>(
      'SELECT id, name FROM "Product" WHERE id = $1 LIMIT 1',
      [id]
    );

    if (!existingRows || existingRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Produk tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Check if product has been ordered
    const orderItemsCount = await neonQuery<any>(
      'SELECT count(*)::int as count FROM "OrderItem" WHERE "productId" = $1',
      [id]
    );

    const hasOrders = (orderItemsCount[0]?.count || 0) > 0;

    if (hasOrders) {
      // Archive instead of hard delete to preserve financial records
      await neonQuery(
        'UPDATE "Product" SET status = \'ARCHIVED\', "updatedAt" = NOW() WHERE id = $1',
        [id]
      );
      return NextResponse.json({
        success: true,
        message: 'Produk memiliki riwayat pesanan, sehingga otomatis diarsipkan (ARCHIVED).',
      });
    }

    // Hard delete related entities
    await neonQuery('DELETE FROM "ProductFile" WHERE "productId" = $1', [id]);
    await neonQuery('DELETE FROM "ProductVariant" WHERE "productId" = $1', [id]);
    await neonQuery('DELETE FROM "ProductImage" WHERE "productId" = $1', [id]);
    await neonQuery('DELETE FROM "Product" WHERE id = $1', [id]);

    return NextResponse.json({
      success: true,
      message: 'Produk berhasil dihapus secara permanen.',
    });
  } catch (error: any) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal menghapus produk.' },
      { status: 500 }
    );
  }
}
