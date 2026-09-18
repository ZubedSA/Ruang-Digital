import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID diperlukan' }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: { productId, isApproved: true },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    const averageRating =
      reviews.length > 0
        ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
        : 5.0;

    return NextResponse.json({
      success: true,
      data: reviews,
      totalReviews: reviews.length,
      averageRating,
    });
  } catch (error: any) {
    console.error('Reviews GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Harap login terlebih dahulu untuk memberikan ulasan' }, { status: 401 });
    }

    const body = await req.json();
    const { productId, rating, comment } = body;

    if (!productId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating (1-5) dan Produk wajib diisi' }, { status: 400 });
    }

    // Check if user has purchased this product
    const eligibleOrderItem = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: user.id,
          status: { in: ['PAID', 'COMPLETED', 'SHIPPED', 'DELIVERED'] },
        },
      },
    });

    if (!eligibleOrderItem) {
      return NextResponse.json(
        { error: 'Hanya pembeli terverifikasi yang dapat memberikan ulasan untuk produk ini' },
        { status: 403 }
      );
    }

    // Check if already reviewed for this orderItem
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: user.id,
        productId,
      },
    });

    if (existingReview) {
      const updated = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: Number(rating),
          comment: comment?.trim() || null,
        },
      });
      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Ulasan Anda berhasil diperbarui!',
      });
    }

    const newReview = await prisma.review.create({
      data: {
        userId: user.id,
        productId,
        orderItemId: eligibleOrderItem.id,
        rating: Number(rating),
        comment: comment?.trim() || null,
        isApproved: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: newReview,
      message: 'Terima kasih atas ulasan Anda!',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Review submission error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
