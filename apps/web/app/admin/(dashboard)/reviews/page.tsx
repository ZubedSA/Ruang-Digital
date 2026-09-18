import React from 'react';
import { prisma } from '@ruang-digital/db';
import { ReviewModerator } from './ReviewModerator';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  let reviews: any[] = [];
  try {
    reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        product: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  } catch (err) {
    console.warn('DB error fetching reviews:', err);
  }

  return (
    <div className="space-y-6">
      <ReviewModerator initialReviews={reviews as any} />
    </div>
  );
}
