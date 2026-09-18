import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@ruang-digital/db';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        product: {
          select: { id: true, name: true, slug: true, featuredImage: true },
        },
      },
    });

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

    const updated = await prisma.review.update({
      where: { id },
      data: { isApproved: !!isApproved },
    });

    return NextResponse.json({ success: true, data: updated });
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

    await prisma.review.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Ulasan berhasil dihapus' });
  } catch (error: any) {
    console.error('Admin reviews DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
