import React from 'react';
import { prisma } from '@ruang-digital/db';
import { CategoryManager } from './CategoryManager';

import { getAdminCategoriesList } from '@/lib/neon';

export const dynamic = 'force-dynamic';

export default async function AdminCategoriesPage() {
  let categories: any[] = [];
  try {
    categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.warn('Prisma admin categories query failed, using Neon HTTP fallback:', err);
    try {
      categories = await getAdminCategoriesList();
    } catch (neonErr) {
      console.error('Neon admin categories query error:', neonErr);
    }
  }

  return (
    <div className="space-y-6">
      <CategoryManager initialCategories={categories} />
    </div>
  );
}
