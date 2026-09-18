import React from 'react';
import { prisma } from '@ruang-digital/db';
import { CouponManager } from './CouponManager';

export const dynamic = 'force-dynamic';

export default async function AdminCouponsPage() {
  let coupons: any[] = [];
  try {
    coupons = await prisma.coupon.findMany({
      include: {
        _count: {
          select: { usages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.warn('DB error fetching coupons:', err);
  }

  return (
    <div className="space-y-6">
      <CouponManager initialCoupons={coupons as any} />
    </div>
  );
}
