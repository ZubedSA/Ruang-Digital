import React from 'react';
import { prisma } from '@ruang-digital/db';
import { CategoryManager } from './CategoryManager';

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
    console.warn('DB error fetching categories:', err);
  }

  return (
    <div className="space-y-6">
      <CategoryManager initialCategories={categories} />
    </div>
  );
}
