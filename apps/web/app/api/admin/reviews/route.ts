import { NextRequest, NextResponse } from 'next/server';
import { neonQuery } from '@/lib/neon';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reviews = await neonQuery<any>(`
      SELECT 
        r.*,
        json_build_object('id', u.id, 'name', u.name, 'email', u.email) as user,
        json_build_object('id', p.id, 'name', p.name, 'slug', p.slug, 'featuredImage', p."featuredImage") as product
      FROM "Review" r
      LEFT JOIN "User" u ON r."userId" = u.id
      LEFT JOIN "Product" p ON r."productId" = p.id
      ORDER BY r."createdAt" DESC
    `);

    return NextResponse.json({ success: true, data: reviews });
  } catch (error: any) {
    console.error('Admin reviews GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, isApproved } = body;

    if (!id) {
      return NextResponse.json({ error: 'Review ID diperlukan' }, { status: 400 });
    }

    const rows = await neonQuery<any>(
      `UPDATE "Review" SET "isApproved" = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *`,
      [Boolean(isApproved), id]
    );

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error: any) {
    console.error('Admin reviews PATCH error:', error);
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
      return NextResponse.json({ error: 'Review ID diperlukan' }, { status: 400 });
    }

    await neonQuery('DELETE FROM "Review" WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Ulasan berhasil dihapus' });
  } catch (error: any) {
    console.error('Admin reviews DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

