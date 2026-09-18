import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ruang-digital/db';
import { getAdminSession } from '@/lib/auth';
import { generateSlug } from '@ruang-digital/utils';

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    console.error('Admin categories GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, icon, isActive } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi (min. 2 karakter)' }, { status: 400 });
    }

    let slug = body.slug ? generateSlug(body.slug) : generateSlug(name);

    // Check slug uniqueness
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const newCategory = await prisma.category.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        icon: icon?.trim() || 'Layers',
        isActive: isActive !== undefined ? !!isActive : true,
      },
    });

    return NextResponse.json({ success: true, data: newCategory }, { status: 201 });
  } catch (error: any) {
    console.error('Admin categories POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, slug, description, icon, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Category ID diperlukan' }, { status: 400 });
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    let finalSlug = existing.slug;
    if (slug && slug !== existing.slug) {
      finalSlug = generateSlug(slug);
      const duplicate = await prisma.category.findFirst({
        where: { slug: finalSlug, NOT: { id } },
      });
      if (duplicate) {
        finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        slug: finalSlug,
        description: description !== undefined ? description?.trim() : existing.description,
        icon: icon !== undefined ? icon?.trim() : existing.icon,
        isActive: isActive !== undefined ? !!isActive : existing.isActive,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Admin categories PUT error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category ID diperlukan' }, { status: 400 });
    }

    // Check if category has products
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return NextResponse.json(
        { error: `Kategori tidak dapat dihapus karena masih memiliki ${productCount} produk terkait. Pindahkan atau hapus produk terlebih dahulu.` },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (error: any) {
    console.error('Admin categories DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
