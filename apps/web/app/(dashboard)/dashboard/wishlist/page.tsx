import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { WishlistManager } from './WishlistManager';

export const dynamic = 'force-dynamic';

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?callbackUrl=/dashboard/wishlist');
  }

  const items = await prisma.wishlist.findMany({
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

  return (
    <div className="space-y-6">
      <WishlistManager initialItems={items as any} />
    </div>
  );
}
