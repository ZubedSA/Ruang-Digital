'use client';

import React, { useState } from 'react';
import { Download, Package, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

interface ProductImageGalleryProps {
  featuredImage: string;
  images?: { id?: string; url: string; altText?: string | null }[];
  productName: string;
  isDigital: boolean;
}

export function ProductImageGallery({
  featuredImage,
  images = [],
  productName,
  isDigital,
}: ProductImageGalleryProps) {
  // Gabungkan featuredImage dan images tanpa duplikat
  const allImageUrls: string[] = [];
  if (featuredImage) {
    allImageUrls.push(featuredImage);
  }
  if (images && images.length > 0) {
    for (const img of images) {
      if (img.url && !allImageUrls.includes(img.url)) {
        allImageUrls.push(img.url);
      }
    }
  }

  // Jika tidak ada gambar sama sekali
  if (allImageUrls.length === 0) {
    allImageUrls.push('https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800');
  }

  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? allImageUrls.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === allImageUrls.length - 1 ? 0 : prev + 1));
  };

  const currentImage = allImageUrls[activeIndex] || allImageUrls[0];

  return (
    <div className="space-y-3 select-none">
      {/* Main Image Container */}
      <div
        onClick={() => setIsZoomed(!isZoomed)}
        className="group relative aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-2xl border border-slate-200 bg-slate-900/5 dark:border-slate-800 dark:bg-slate-950 shadow-sm"
      >
        <img
          src={currentImage}
          alt={`${productName} - Foto ${activeIndex + 1}`}
          className={`h-full w-full object-cover object-center transition-all duration-300 ${
            isZoomed ? 'scale-125 cursor-zoom-out' : 'group-hover:scale-105'
          }`}
        />

        {/* Tipe Badge (Digital / Fisik) */}
        <div className="absolute top-4 left-4 z-10">
          {isDigital ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-white shadow-sm border border-indigo-400/30">
              <Download className="h-3.5 w-3.5" /> Produk Digital
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-600/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-white shadow-sm border border-amber-400/30">
              <Package className="h-3.5 w-3.5" /> Produk Fisik
            </span>
          )}
        </div>

        {/* Counter Badge */}
        {allImageUrls.length > 1 && (
          <div className="absolute top-4 right-4 z-10 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
            {activeIndex + 1} / {allImageUrls.length}
          </div>
        )}

        {/* Zoom Hint Icon */}
        <div className="absolute bottom-4 right-4 z-10 hidden sm:flex h-7 w-7 items-center justify-center rounded-lg bg-black/50 text-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="h-4 w-4" />
        </div>

        {/* Navigation Arrows */}
        {allImageUrls.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-all"
              aria-label="Foto Sebelumnya"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-all"
              aria-label="Foto Selanjutnya"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {allImageUrls.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
          {allImageUrls.map((url, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={`${url}-${idx}`}
                type="button"
                onClick={() => {
                  setActiveIndex(idx);
                  setIsZoomed(false);
                }}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                  isActive
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md scale-105'
                    : 'border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-400 dark:border-slate-800'
                }`}
              >
                <img
                  src={url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="h-full w-full object-cover object-center"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
