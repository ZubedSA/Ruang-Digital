'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Link as LinkIcon, Trash2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  required?: boolean;
}

export function ImageUploader({
  value,
  onChange,
  label = 'Foto Utama Produk',
  required = false,
}: ImageUploaderProps) {
  const [tab, setTab] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setErrorMsg(null);

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran file terlalu besar (maksimal 5 MB).');
      return;
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      setErrorMsg('File harus berupa gambar (JPG, PNG, WEBP, atau GIF).');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengunggah foto');
      }

      onChange(data.url);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat mengunggah foto');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <label className="font-bold text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>

        {/* Tab switch */}
        <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              tab === 'upload'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('url')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              tab === 'url'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon className="h-3.5 w-3.5" />
            <span>Tempel URL</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-red-900/60 bg-red-950/40 p-3 text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Mode 1: Upload File */}
      {tab === 'upload' ? (
        <div>
          {value ? (
            /* Preview Container */
            <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-sm group">
              <img
                src={value}
                alt="Preview Foto Produk"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-900 shadow-sm hover:bg-white transition-colors"
                >
                  Ganti Foto
                </button>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-rose-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5 inline mr-1" />
                  Hapus
                </button>
              </div>
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg bg-black/70 px-2 py-1 text-[10px] font-bold text-emerald-400 backdrop-blur-md">
                <CheckCircle2 className="h-3 w-3" />
                Foto Terunggah
              </div>
            </div>
          ) : (
            /* Dropzone Container */
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                isDragOver
                  ? 'border-emerald-500 bg-emerald-950/20'
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, image/gif"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {isUploading ? (
                <div className="flex flex-col items-center gap-2 text-slate-300">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                  <p className="font-bold">Mengunggah foto ke server...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-emerald-400">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-200">
                      Klik untuk memilih foto atau seret foto ke sini
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Format PNG, JPG, WEBP, atau GIF (Maksimal 5 MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Mode 2: Tempel URL */
        <div className="space-y-2">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://images.unsplash.com/photo-..."
            className="h-10 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
          />
          {value && (
            <div className="relative aspect-video w-48 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
              <img src={value} alt="Preview" className="h-full w-full object-cover" />
            </div>
          )}
          <p className="text-[11px] text-slate-500">
            Tempel tautan langsung gambar dari hosting gambar eksternal (Unsplash, CDN, Cloudinary).
          </p>
        </div>
      )}
    </div>
  );
}
