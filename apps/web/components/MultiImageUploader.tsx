'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Plus,
  Trash2,
  Star,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  CheckCircle2,
} from 'lucide-react';

interface MultiImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function MultiImageUploader({
  images = [],
  onChange,
  maxImages = 8,
}: MultiImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [pastedUrl, setPastedUrl] = useState('');
  const [brokenUrls, setBrokenUrls] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Compress image client-side via HTML5 Canvas into lightweight WebP/JPEG Data URL
   * This guarantees 100% cloud reliability on Cloudflare Workers without needing local disk writes.
   */
  const compressImage = (file: File, maxDim = 1200, quality = 0.82): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          let dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Format gambar tidak dapat dibaca'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (fileList: FileList | File[]) => {
    setErrorMsg(null);
    const files = Array.from(fileList);

    if (files.length === 0) return;

    if (images.length + files.length > maxImages) {
      setErrorMsg(`Maksimal ${maxImages} foto diperbolehkan.`);
      return;
    }

    // Validate mime & sizes
    for (const f of files) {
      if (!f.type.startsWith('image/')) {
        setErrorMsg('Semua file harus berupa format gambar (JPG, PNG, WEBP, GIF).');
        return;
      }
      if (f.size > 8 * 1024 * 1024) {
        setErrorMsg(`File ${f.name} melebihi batas 8 MB.`);
        return;
      }
    }

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        // Compress client-side into lightweight Data URL
        const dataUrl = await compressImage(file);
        uploadedUrls.push(dataUrl);
      }

      onChange([...images, ...uploadedUrls]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses foto.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleAddPastedUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedUrl.trim()) return;

    if (images.length >= maxImages) {
      setErrorMsg(`Maksimal ${maxImages} foto diperbolehkan.`);
      return;
    }

    onChange([...images, pastedUrl.trim()]);
    setPastedUrl('');
    setShowUrlInput(false);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const next = images.filter((_, idx) => idx !== indexToRemove);
    onChange(next);
  };

  const handleSetCover = (indexToCover: number) => {
    if (indexToCover === 0) return;
    const target = images[indexToCover];
    const remaining = images.filter((_, idx) => idx !== indexToCover);
    onChange([target, ...remaining]);
  };

  const handleMove = (currentIndex: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const next = [...images];
    const temp = next[currentIndex];
    next[currentIndex] = next[targetIndex];
    next[targetIndex] = temp;
    onChange(next);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Galeri Foto Produk</h3>
            <span className="rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-0.5 text-[11px] font-bold">
              {images.length} / {maxImages} Foto
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Foto pertama otomatis menjadi Foto Utama (Cover Katalog). Anda dapat mengunggah hingga {maxImages} foto.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
        >
          <LinkIcon className="h-3.5 w-3.5" />
          <span>{showUrlInput ? 'Tutup URL' : 'Tempel Tautan URL'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {showUrlInput && (
        <form onSubmit={handleAddPastedUrl} className="flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-950">
          <input
            type="url"
            value={pastedUrl}
            onChange={(e) => setPastedUrl(e.target.value)}
            placeholder="https://images.unsplash.com/... atau tautan CDN"
            className="flex-1 bg-transparent px-2 text-xs text-slate-900 placeholder-slate-400 dark:text-white dark:placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
          >
            Tambahkan
          </button>
        </form>
      )}

      {/* Alert if broken images are detected */}
      {images.some((u) => brokenUrls[u] || (typeof u === 'string' && (u.includes('/uploads/product-') || u.startsWith('/uploads/')))) && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold">Foto Produk Lama Rusak Terdeteksi</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                Foto lama tersimpan di folder disk lokal (<code>/uploads/...</code>) yang tidak tersedia di serverless Cloudflare Workers. Silakan hapus foto yang bertanda merah dan unggah kembali melalui tombol <strong>Tambah Foto</strong> di bawah. Foto baru otomatis dioptimalkan dan disimpan langsung ke database secara permanen.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const valid = images.filter(
                (u) => !brokenUrls[u] && !u.includes('/uploads/product-') && !u.startsWith('/uploads/')
              );
              onChange(valid);
            }}
            className="shrink-0 rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-500 shadow-sm"
          >
            Hapus Semua Foto Rusak
          </button>
        </div>
      )}

      {/* Grid Thumbnail Preview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {images.map((url, idx) => {
          const isBroken =
            brokenUrls[url] ||
            (typeof url === 'string' && (url.includes('/uploads/product-') || url.startsWith('/uploads/')));

          return (
            <div
              key={`${url}-${idx}`}
              className={`group relative aspect-square overflow-hidden rounded-2xl border transition-all ${
                isBroken
                  ? 'border-rose-400 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/30'
                  : idx === 0
                  ? 'border-amber-500/80 bg-slate-100 dark:bg-slate-950 shadow-md ring-2 ring-amber-500/30'
                  : 'border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {isBroken ? (
                <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center">
                  <AlertCircle className="h-6 w-6 text-rose-500 mb-1" />
                  <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300">Foto Rusak (404)</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Format disk lokal lama</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="mt-2 text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg shadow-sm"
                  >
                    Hapus
                  </button>
                </div>
              ) : (
                <img
                  src={url}
                  alt={`Foto Produk ${idx + 1}`}
                  onError={() => {
                    setBrokenUrls((prev) => ({ ...prev, [url]: true }));
                  }}
                  className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                />
              )}

              {/* Badge Cover untuk foto index 0 */}
              {idx === 0 && !isBroken && (
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-slate-950 shadow-md">
                  <Star className="h-3 w-3 fill-current" />
                  <span>Foto Utama (Cover)</span>
                </div>
              )}

            {/* Hover Action Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600/90 text-white hover:bg-rose-500 transition-colors"
                  title="Hapus foto ini"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => handleMove(idx, 'left')}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                      title="Geser ke kiri"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {idx < images.length - 1 && (
                    <button
                      type="button"
                      onClick={() => handleMove(idx, 'right')}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                      title="Geser ke kanan"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {idx !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleSetCover(idx)}
                    className="flex items-center gap-1 rounded-lg bg-amber-500/90 px-2 py-1 text-[10px] font-bold text-slate-950 hover:bg-amber-400"
                    title="Jadikan Foto Utama"
                  >
                    <Star className="h-3 w-3" />
                    <span>Jadikan Cover</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

        {/* Dropzone & Add Button */}
        {images.length < maxImages && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 text-center transition-all ${
              isDragOver
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-slate-700 dark:hover:bg-slate-950/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png, image/jpeg, image/webp, image/gif"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFiles(e.target.files);
                }
              }}
              className="hidden"
            />

            {isUploading ? (
              <div className="flex flex-col items-center gap-2 text-slate-700 dark:text-slate-300">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px] font-bold">Mengunggah...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm dark:border-transparent dark:bg-slate-800 dark:text-slate-400 group-hover:text-emerald-500">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Tambah Foto</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Pilih beberapa foto</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {images.length === 0 && (
        <div className="text-center py-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Belum ada foto produk yang diunggah.</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Minimal sediakan 1 foto produk untuk dijadikan foto cover utama.
          </p>
        </div>
      )}
    </div>
  );
}
