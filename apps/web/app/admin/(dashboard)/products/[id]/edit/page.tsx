'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Download, Package, ArrowLeft, Save, AlertCircle, Trash2, CheckCircle2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { MultiImageUploader } from '@/components/MultiImageUploader';
import { DigitalFileUploader } from '@/components/DigitalFileUploader';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form states
  const [type, setType] = useState<'DIGITAL' | 'PHYSICAL'>('DIGITAL');
  const [status, setStatus] = useState<'ACTIVE' | 'DRAFT' | 'ARCHIVED'>('ACTIVE');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isFeatured, setIsFeatured] = useState(false);

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

  // Load product and categories on mount
  useEffect(() => {
    async function loadData() {
      if (!productId) return;
      setInitialLoading(true);
      setErrorMessage('');

      try {
        // Load categories
        const catRes = await fetch('/api/admin/categories');
        const catData = await catRes.json();
        if (catRes.ok && catData.success && catData.data.length > 0) {
          setCategories(catData.data);
        }

        // Load single product
        const prodRes = await fetch(`/api/admin/products/${productId}`);
        const prodData = await prodRes.json();

        if (!prodRes.ok || !prodData.success || !prodData.data) {
          throw new Error(prodData.error || 'Gagal memuat data produk.');
        }

        const p = prodData.data;
        setName(p.name || '');
        setSlug(p.slug || '');
        setType(p.type || 'DIGITAL');
        setStatus(p.status || 'ACTIVE');
        setShortDescription(p.shortDescription || '');
        setDescription(p.description || '');
        setBasePrice(p.basePrice ? String(p.basePrice) : '');
        setDiscountPrice(p.discountPrice ? String(p.discountPrice) : '');
        setCategoryId(p.categoryId || '');
        if (p.images && Array.isArray(p.images) && p.images.length > 0) {
          setImages(p.images.map((img: any) => img.url));
        } else if (p.featuredImage) {
          setImages([p.featuredImage]);
        }
        setIsFeatured(Boolean(p.isFeatured));
        setStock(p.stock !== undefined ? String(p.stock) : '0');
        setWeightInGrams(p.weightInGrams ? String(p.weightInGrams) : '0');
        setSku(p.sku || '');

        if (p.files && p.files.length > 0) {
          const f = p.files[0];
          setFileName(f.fileName || '');
          setDriveFileId(f.driveFileId || '');
          setFileVersion(f.version || '1.0.0');
          setPlatform(f.platform || 'All');
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Terjadi kesalahan saat memuat data.');
      } finally {
        setInitialLoading(false);
      }
    }

    loadData();
  }, [productId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (images.length === 0) {
      setErrorMessage('Wajib mengunggah minimal 1 foto produk.');
      return;
    }

    if (type === 'DIGITAL' && !driveFileId) {
      setErrorMessage('Harap unggah file produk digital ke Google Drive terlebih dahulu.');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          shortDescription,
          description,
          type,
          status,
          basePrice,
          discountPrice: discountPrice || null,
          categoryId,
          featuredImage: images[0] || '',
          images,
          isFeatured,
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
        throw new Error(data.error || 'Gagal memperbarui data produk.');
      }

      setSuccessMessage('Data produk berhasil diperbarui!');
      setTimeout(() => {
        router.push('/admin/products');
        router.refresh();
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus produk "${name}"?\n\nJika produk sudah memiliki transaksi pesanan, statusnya akan diarsipkan (ARCHIVED) secara aman.`
    );
    if (!confirmDelete) return;

    setDeleting(true);
    setErrorMessage('');

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menghapus produk.');
      }

      alert(data.message || 'Produk berhasil diproses.');
      router.push('/admin/products');
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message);
      setDeleting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-3 w-72 bg-slate-200/60 dark:bg-slate-800/60 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-96 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header with Navigation & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Edit Produk</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Perbarui rincian produk, harga, stok, atau file Google Drive.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {slug && (
            <a
              href={`/produk/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors shadow-sm"
              title="Pratinjau Halaman Toko Customer"
            >
              <span>Pratinjau Toko</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/60 transition-colors disabled:opacity-50 shadow-sm"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{deleting ? 'Memproses...' : 'Hapus'}</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-xs font-semibold text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleUpdate} className="space-y-6">
        {/* Tipe Selector & Status Bar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Tipe Produk</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('DIGITAL')}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                    type === 'DIGITAL'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400 dark:hover:border-slate-700'
                  }`}
                >
                  <Download className="h-4 w-4" />
                  <span>Digital</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('PHYSICAL')}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                    type === 'PHYSICAL'
                      ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400 dark:hover:border-slate-700'
                  }`}
                >
                  <Package className="h-4 w-4" />
                  <span>Fisik</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Status Visibilitas</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="ACTIVE">🟢 ACTIVE (Tampil di Toko & Siap Dijual)</option>
                <option value="DRAFT">🟡 DRAFT (Hanya Terlihat oleh Admin)</option>
                <option value="ARCHIVED">🔴 ARCHIVED (Nonaktif / Arsip)</option>
              </select>
            </div>
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
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Slug URL Toko</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="slug-otomatis-dari-nama"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 font-mono"
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Harga Dasar (IDR) *</label>
              <input
                type="number"
                required
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Harga Diskon (Opsional)</label>
              <input
                type="number"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                placeholder="Kosongkan jika tidak ada diskon"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Integrated Multi Image Uploader to Google Drive */}
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
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Fitur produk, panduan instalasi, dan spesifikasi lengkap..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isFeatured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 bg-white text-emerald-600 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
            />
            <label htmlFor="isFeatured" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              Tampilkan sebagai Produk Unggulan (Featured) di Beranda Toko
            </label>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Stok Inventaris</label>
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
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-8 py-3.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Produk'}</span>
          </button>

          <Link
            href="/admin/products"
            className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
