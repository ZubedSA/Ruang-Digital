import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
import { neonQuery } from '@/lib/neon';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ruang-digital.achzubaidi07.workers.dev';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/produk`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cart`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    let products: any[] = [];
    let categories: any[] = [];

    try {
      products = await prisma.product.findMany({
        where: { status: 'ACTIVE' },
        select: { slug: true, updatedAt: true },
      });
      categories = await prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      });
    } catch {
      products = await neonQuery('SELECT slug, "updatedAt" FROM "Product" WHERE status = \'ACTIVE\'');
      categories = await neonQuery('SELECT slug, "updatedAt" FROM "Category" WHERE "isActive" = true');
    }

    const productRoutes: MetadataRoute.Sitemap = products.map((p: any) => ({
      url: `${baseUrl}/produk/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((c: any) => ({
      url: `${baseUrl}/produk?cat=${c.slug}`,
      lastModified: c.updatedAt ? new Date(c.updatedAt) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    return [...staticRoutes, ...productRoutes, ...categoryRoutes];
  } catch (err) {
    console.warn('Sitemap dynamic generation fallback (DB offline):', err);
    return staticRoutes;
  }
}
