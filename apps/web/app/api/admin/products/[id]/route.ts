import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ruang-digital/db';
import { generateSlug } from '@ruang-digital/utils';

// GET: Fetch single product details for editing
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        files: true,
        variants: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

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

    const existing = await prisma.product.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Produk tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Determine final slug
    let finalSlug = existing.slug;
    if (slug && slug.trim() && slug.trim() !== existing.slug) {
      finalSlug = generateSlug(slug.trim());
      // Check if slug is taken by another product
      const slugCheck = await prisma.product.findFirst({
        where: { slug: finalSlug, NOT: { id } },
      });
      if (slugCheck) {
        finalSlug = `${finalSlug}-${Math.floor(100 + Math.random() * 900)}`;
      }
    } else if (name && name !== existing.name && !slug) {
      finalSlug = generateSlug(name) + '-' + Math.floor(100 + Math.random() * 900);
    }

    // Handle digital files update or creation
    let filesOperation = undefined;
    if (type === 'DIGITAL') {
      if (fileName && driveFileId) {
        if (existing.files.length > 0) {
          // Update the first file
          filesOperation = {
            update: {
              where: { id: existing.files[0].id },
              data: {
                fileName,
                fileType: fileName.split('.').pop() || 'zip',
                driveFileId,
                version: fileVersion || '1.0.0',
                platform: platform || 'All',
              },
            },
          };
        } else {
          // Create new file
          filesOperation = {
            create: {
              fileName,
              fileType: fileName.split('.').pop() || 'zip',
              driveFileId,
              version: fileVersion || '1.0.0',
              platform: platform || 'All',
              fileSize: 1024 * 1024,
            },
          };
        }
      }
    }

    // Handle Product Images update
    let finalFeaturedImage = featuredImage !== undefined ? featuredImage : existing.featuredImage;
    if (images !== undefined && Array.isArray(images)) {
      if (images.length > 0) {
        finalFeaturedImage = images[0];
      }
      // Hapus gambar lama dan ganti dengan urutan gambar baru
      await prisma.productImage.deleteMany({ where: { productId: id } });
      if (images.length > 0) {
        await prisma.productImage.createMany({
          data: images.map((url: string, index: number) => ({
            productId: id,
            url,
            sortOrder: index,
          })),
        });
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        slug: finalSlug,
        description: description !== undefined ? description : existing.description,
        shortDescription: shortDescription !== undefined ? shortDescription : existing.shortDescription,
        type: type !== undefined ? type : existing.type,
        status: status !== undefined ? status : existing.status,
        basePrice: basePrice !== undefined ? parseInt(basePrice, 10) : existing.basePrice,
        discountPrice: discountPrice ? parseInt(discountPrice, 10) : null,
        categoryId: categoryId !== undefined ? categoryId : existing.categoryId,
        featuredImage: finalFeaturedImage,
        isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : existing.isFeatured,
        stock: type === 'PHYSICAL' ? parseInt(stock || 0, 10) : 0,
        weightInGrams: type === 'PHYSICAL' ? parseInt(weightInGrams || 0, 10) : null,
        sku: sku !== undefined ? sku : existing.sku,
        files: filesOperation,
      },
      include: {
        category: true,
        files: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    // Record system audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_PRODUCT',
        entity: 'Product',
        entityId: updatedProduct.id,
        details: {
          name: updatedProduct.name,
          basePrice: updatedProduct.basePrice,
          status: updatedProduct.status,
          updatedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error: any) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memperbarui data produk.' },
      { status: 500 }
    );
  }
}

// DELETE: Remove product
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const existing = await prisma.product.findUnique({
      where: { id },
      include: { orderItems: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Produk tidak ditemukan.' },
        { status: 404 }
      );
    }

    // If product has been ordered, archive instead of hard delete to preserve financial records
    if (existing.orderItems.length > 0) {
      await prisma.product.update({
        where: { id },
        data: { status: 'ARCHIVED' },
      });

      await prisma.auditLog.create({
        data: {
          action: 'ARCHIVE_PRODUCT',
          entity: 'Product',
          entityId: id,
          details: { reason: 'Has order items, set to ARCHIVED', name: existing.name },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Produk memiliki riwayat pesanan, sehingga otomatis diarsipkan (ARCHIVED).',
      });
    }

    // Hard delete related files and product
    await prisma.productFile.deleteMany({ where: { productId: id } });
    await prisma.productVariant.deleteMany({ where: { productId: id } });
    await prisma.productImage.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE_PRODUCT',
        entity: 'Product',
        entityId: id,
        details: { name: existing.name },
      },
    });

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
