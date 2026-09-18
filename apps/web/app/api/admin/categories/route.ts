import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { generateSlug } from '@ruang-digital/utils';
import { getAdminCategoriesList, neonQuery } from '@/lib/neon';

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await getAdminCategoriesList();
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    console.error('Admin categories GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
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
    const existing = await neonQuery<any>('SELECT id FROM "Category" WHERE slug = $1 LIMIT 1', [slug]);
    if (existing && existing.length > 0) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const newId = `cat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const finalIsActive = isActive !== undefined ? !!isActive : true;

    await neonQuery(
      `INSERT INTO "Category" (id, name, slug, description, icon, "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [newId, name.trim(), slug, description?.trim() || null, icon?.trim() || 'Layers', finalIsActive]
    );

    const newCategory = {
      id: newId,
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      icon: icon?.trim() || 'Layers',
      isActive: finalIsActive,
    };

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

    const existingRows = await neonQuery<any>('SELECT * FROM "Category" WHERE id = $1 LIMIT 1', [id]);
    if (!existingRows || existingRows.length === 0) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    const existing = existingRows[0];
    let finalSlug = existing.slug;
    if (slug && slug !== existing.slug) {
      finalSlug = generateSlug(slug);
      const duplicate = await neonQuery<any>(
        'SELECT id FROM "Category" WHERE slug = $1 AND id != $2 LIMIT 1',
        [finalSlug, id]
      );
      if (duplicate && duplicate.length > 0) {
        finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
      }
    }

    const finalName = name !== undefined ? name.trim() : existing.name;
    const finalDesc = description !== undefined ? description?.trim() : existing.description;
    const finalIcon = icon !== undefined ? icon?.trim() : existing.icon;
    const finalIsActive = isActive !== undefined ? !!isActive : existing.isActive;

    await neonQuery(
      `UPDATE "Category" SET 
        name = $1,
        slug = $2,
        description = $3,
        icon = $4,
        "isActive" = $5,
        "updatedAt" = NOW()
      WHERE id = $6`,
      [finalName, finalSlug, finalDesc, finalIcon, finalIsActive, id]
    );

    const updated = {
      id,
      name: finalName,
      slug: finalSlug,
      description: finalDesc,
      icon: finalIcon,
      isActive: finalIsActive,
    };

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
    const productCountRow = await neonQuery<any>(
      'SELECT count(*)::int as count FROM "Product" WHERE "categoryId" = $1',
      [id]
    );
    const productCount = productCountRow[0]?.count || 0;

    if (productCount > 0) {
      return NextResponse.json(
        {
          error: `Kategori tidak dapat dihapus karena masih memiliki ${productCount} produk terkait. Pindahkan atau hapus produk terlebih dahulu.`,
        },
        { status: 400 }
      );
    }

    await neonQuery('DELETE FROM "Category" WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (error: any) {
    console.error('Admin categories DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
