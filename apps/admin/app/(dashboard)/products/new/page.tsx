'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Package, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { MultiImageUploader } from '@/components/MultiImageUploader';
import { DigitalFileUploader } from '@/components/DigitalFileUploader';

export default function NewProductPage() {
  const router = useRouter();

  const [type, setType] = useState<'DIGITAL' | 'PHYSICAL'>('DIGITAL');
  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [images, setImages] = useState<string[]>([]);

  // Digital fields
  const [fileName, setFileName] = useState('');
  const [driveFileId, setDriveFileId] = useState('');
  const [fileVersion, setFileVersion] = useState('1.0.0');
  const [platform, setPlatform] = useState('All');

  // Physical fields
  const [stock, setStock] = useState('50');
  const [weightInGrams, setWeightInGrams] = useState('250');
  const [sku, setSku] = useState('');

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/admin/categories');
        const data = await res.json();
        if (res.ok && data.success && data.data.length > 0) {
          setCategories(data.data);
          setCategoryId(data.data[0].id);
        } else {
          setCategories([
            { id: 'cat-aplikasi', name: 'Aplikasi & Software' },
            { id: 'cat-ebook', name: 'Ebook & Panduan' },
            { id: 'cat-template', name: 'Template & Desain' },
            { id: 'cat-merchandise', name: 'Merchandise & Fisik' },
          ]);
          setCategoryId('cat-aplikasi');
        }
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    }
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (images.length === 0) {
      setErrorMessage('Wajib mengunggah minimal 1 foto produk.');
      return;
    }

    if (type === 'DIGITAL' && !driveFileId) {
      setErrorMessage('Harap unggah file produk digital ke Google Drive terlebih dahulu.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          shortDescription,
          description,
          type,
          basePrice,
          discountPrice: discountPrice || null,
          categoryId,
          featuredImage: images[0] || '',
          images,
          fileName,
          driveFileId,
          fileVersion,
          platform,
          stock,
          weightInGrams,
          sku,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan produk.');
      }

      router.push('/products');
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/products"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Tambah Produk Baru</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Form pembuatan produk terpadu untuk digital delivery & pesanan fisik.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-xs font-semibold text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipe Selector Tabs */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Pilih Tipe Produk *</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setType('DIGITAL')}
              className={`flex items-center justify-center gap-2 rounded-xl border p-4 text-xs font-bold transition-all ${
                type === 'DIGITAL'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400 dark:hover:border-slate-700'
              }`}
            >
              <Download className="h-4 w-4" />
              <span>Produk Digital (Unduhan & Lisensi)</span>
            </button>

            <button
              type="button"
              onClick={() => setType('PHYSICAL')}
              className={`flex items-center justify-center gap-2 rounded-xl border p-4 text-xs font-bold transition-all ${
                type === 'PHYSICAL'
                  ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400 dark:hover:border-slate-700'
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Produk Fisik (Stok & Pengiriman)</span>
            </button>
          </div>
        </div>

        {/* Basic Info Box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
            Informasi Dasar Produk
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Produk *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Ebook Trading Crypto 2024 atau Kaos Developer"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kategori *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Harga Dasar (IDR) *</label>
              <input
                type="number"
                required
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="150000"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Harga Diskon (Opsional)</label>
              <input
                type="number"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                placeholder="99000"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <MultiImageUploader
            images={images}
            onChange={setImages}
            maxImages={8}
          />

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Deskripsi Singkat</label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Ringkasan 1-2 kalimat untuk kartu produk"
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Deskripsi Lengkap</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Fitur produk, panduan instalasi, dan spesifikasi lengkap..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Conditional Specification Box */}
        {type === 'DIGITAL' ? (
          <DigitalFileUploader
            fileName={fileName}
            driveFileId={driveFileId}
            fileVersion={fileVersion}
            platform={platform}
            onChange={(data) => {
              setFileName(data.fileName);
              setDriveFileId(data.driveFileId);
              if (data.fileVersion) setFileVersion(data.fileVersion);
              if (data.platform) setPlatform(data.platform);
            }}
          />
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 space-y-4 dark:border-amber-900 dark:bg-amber-950/40">
            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300 border-b border-amber-200 dark:border-amber-900/60 pb-2 flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>Inventori & Pengiriman Fisik</span>
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Stok Awal</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="50"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Berat (Gram)</label>
                <input
                  type="number"
                  value={weightInGrams}
                  onChange={(e) => setWeightInGrams(e.target.value)}
                  placeholder="250"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">SKU Produk</label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="RD-TSHIRT-001"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-8 py-3.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{loading ? 'Menyimpan Produk...' : 'Simpan & Terbitkan Produk'}</span>
        </button>
      </form>
    </div>
  );
}
