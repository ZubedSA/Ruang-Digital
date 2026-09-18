import React from 'react';
import { prisma } from '@ruang-digital/db';
import { CouponManager } from './CouponManager';

import { getAdminCouponsList } from '@/lib/neon';

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
    console.warn('Prisma admin coupons query failed, using Neon HTTP fallback:', err);
    try {
      coupons = await getAdminCouponsList();
    } catch (neonErr) {
      console.error('Neon admin coupons query error:', neonErr);
    }
  }

  return (
    <div className="space-y-6">
      <CouponManager initialCoupons={coupons as any} />
    </div>
  );
}
