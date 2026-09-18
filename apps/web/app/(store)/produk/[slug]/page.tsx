import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { getStoreProductBySlug } from '@/lib/neon';
import { formatRupiah, formatFileSize } from '@ruang-digital/utils';
import { AddToCartDetail } from './AddToCartDetail';
import { ProductReviews } from '@/components/ProductReviews';
import { ProductImageGallery } from '@/components/ProductImageGallery';
import { Download, Package, ShieldCheck, Zap, Laptop, FileText, CheckCircle2 } from 'lucide-react';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  let product: any = null;
  try {
    product = await prisma.product.findUnique({
      where: { slug: params.slug },
      include: { category: true },
    });
  } catch (err) {
    product = await getStoreProductBySlug(params.slug);
  }

  if (!product) {
    product = await getStoreProductBySlug(params.slug);
  }

  if (!product) return { title: 'Produk Tidak Ditemukan — Ruang Digital' };

  return {
    title: `${product.name} — Ruang Digital`,
    description: product.shortDescription || product.description?.substring(0, 160) || '',
    openGraph: {
      title: product.name,
      description: product.shortDescription || product.description?.substring(0, 160) || '',
      images: [{ url: product.featuredImage }],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  let product: any = null;

  try {
    product = await prisma.product.findUnique({
      where: { slug: params.slug },
      include: {
        category: true,
        variants: true,
        images: { orderBy: { sortOrder: 'asc' } },
        files: { where: { isActive: true } },
      },
    });
  } catch (err) {
    console.warn('Prisma product detail error, falling back to Neon HTTP:', err);
    product = await getStoreProductBySlug(params.slug);
  }

  if (!product) {
    product = await getStoreProductBySlug(params.slug);
  }

  if (!product) notFound();

  const isDigital = product.type === 'DIGITAL';
  const effectivePrice = product.discountPrice ?? product.basePrice;
  const hasDiscount = product.discountPrice && product.discountPrice < product.basePrice;

  // JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: [product.featuredImage],
    description: product.shortDescription || product.description,
    sku: product.sku || product.id,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'IDR',
      price: effectivePrice,
      availability: isDigital || product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Structured data injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-6">
        <a href="/" className="hover:text-slate-600">Home</a>
        <span>/</span>
        <a href="/produk" className="hover:text-slate-600">Produk</a>
        <span>/</span>
        <span className="text-slate-700 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Media Gallery */}
        <div className="lg:col-span-6">
          <ProductImageGallery
            featuredImage={product.featuredImage}
            images={product.images}
            productName={product.name}
            isDigital={isDigital}
          />
        </div>

        {/* Right Column: Details, Pricing, Buy Action */}
        <div className="lg:col-span-6 flex flex-col space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              {product.category.name}
            </span>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {product.name}
            </h1>
            {product.shortDescription && (
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                {product.shortDescription}
              </p>
            )}
          </div>

          {/* Pricing Display */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                {formatRupiah(effectivePrice)}
              </span>
              {hasDiscount && (
                <span className="text-sm font-semibold text-slate-400 line-through">
                  {formatRupiah(product.basePrice)}
                </span>
              )}
            </div>
            {hasDiscount && (
              <p className="text-xs text-rose-600 font-semibold mt-1">
                Hemat {formatRupiah(product.basePrice - product.discountPrice!)} (Penawaran Terbatas)
              </p>
            )}
          </div>

          {/* Interactive Client Add to Cart Box with Variants */}
          <AddToCartDetail product={product} />

          {/* Digital Specs / Physical Specs Box */}
          <div className="rounded-2xl border border-slate-200 p-5 space-y-3 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Spesifikasi Produk
            </h4>

            {isDigital ? (
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Tipe Pengiriman: <strong>Unduhan Instan Langsung</strong></span>
                </div>
                {product.files && product.files.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Laptop className="h-4 w-4 text-indigo-600" />
                    <span>
                      File Tersedia:{' '}
                      {product.files.map((f: any) => `${f.fileName} (${formatFileSize(f.fileSize)})`).join(', ')}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <span>Lisensi: <strong>Komersial / Pribadi (Unik)</strong></span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-amber-600" />
                  <span>Stok Tersedia: <strong>{product.stock} unit</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-600" />
                  <span>Berat Pengiriman: <strong>{product.weightInGrams || 200} gram</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>SKU Produk: <strong>{product.sku || '-'}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Product Full Description */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              Deskripsi Lengkap
            </h3>
            <div className="prose prose-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
              {product.description}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="mt-12">
        <ProductReviews productId={product.id} />
      </div>
    </div>
  );
}
