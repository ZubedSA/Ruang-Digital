import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wishlists = await prisma.wishlist.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: wishlists });
  } catch (error: any) {
    console.error('Wishlist GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Harap masuk (login) terlebih dahulu untuk menyimpan wishlist' }, { status: 401 });
    }

    const body = await req.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID diperlukan' }, { status: 400 });
    }

    // Check if already in wishlist
    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    if (existing) {
      await prisma.wishlist.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ success: true, isWishlisted: false, message: 'Dihapus dari wishlist' });
    } else {
      await prisma.wishlist.create({
        data: {
          userId: user.id,
          productId,
        },
      });
      return NextResponse.json({ success: true, isWishlisted: true, message: 'Ditambahkan ke wishlist' });
    }
  } catch (error: any) {
    console.error('Wishlist POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID diperlukan' }, { status: 400 });
    }

    await prisma.wishlist.deleteMany({
      where: {
        userId: user.id,
        productId,
      },
    });

    return NextResponse.json({ success: true, message: 'Item berhasil dihapus dari wishlist' });
  } catch (error: any) {
    console.error('Wishlist DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
