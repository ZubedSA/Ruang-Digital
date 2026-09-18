'use client';

import React, { useState } from 'react';
import { MapPin, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, Loader2, Home, Building2 } from 'lucide-react';

interface Address {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  subdistrict: string | null;
  city: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

interface AddressManagerProps {
  initialAddresses: Address[];
}

export function AddressManager({ initialAddresses }: AddressManagerProps) {
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    label: 'Rumah',
    recipientName: '',
    phone: '',
    street: '',
    subdistrict: '',
    city: '',
    province: '',
    postalCode: '',
    isDefault: false,
  });

  const resetForm = () => {
    setFormData({
      label: 'Rumah',
      recipientName: '',
      phone: '',
      street: '',
      subdistrict: '',
      city: '',
      province: '',
      postalCode: '',
      isDefault: false,
    });
    setEditingId(null);
    setIsFormOpen(false);
    setErrorMsg(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (addr: Address) => {
    setEditingId(addr.id);
    setFormData({
      label: addr.label,
      recipientName: addr.recipientName,
      phone: addr.phone,
      street: addr.street,
      subdistrict: addr.subdistrict || '',
      city: addr.city,
      province: addr.province,
      postalCode: addr.postalCode,
      isDefault: addr.isDefault,
    });
    setIsFormOpen(true);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const url = '/api/user/addresses';
      const method = editingId ? 'PUT' : 'POST';
      const payload = editingId ? { ...formData, id: editingId } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan alamat');
      }

      // Re-fetch or update state
      if (editingId) {
        setAddresses((prev) =>
          prev.map((a) => {
            if (a.id === editingId) return data.data;
            if (data.data.isDefault) return { ...a, isDefault: false };
            return a;
          })
        );
        setSuccessMsg('Alamat berhasil diperbarui.');
      } else {
        setAddresses((prev) => {
          if (data.data.isDefault) {
            return [data.data, ...prev.map((a) => ({ ...a, isDefault: false }))];
          }
          return [data.data, ...prev];
        });
        setSuccessMsg('Alamat baru berhasil ditambahkan.');
      }

      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses data');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/addresses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isDefault: true }),
      });
      if (!res.ok) throw new Error('Gagal mengubah alamat utama');

      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          isDefault: a.id === id,
        }))
      );
      setSuccessMsg('Alamat utama berhasil diperbarui.');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus alamat ini?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/user/addresses?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus alamat');

      setAddresses((prev) => prev.filter((a) => a.id !== id));
      setSuccessMsg('Alamat berhasil dihapus.');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-600" />
            Buku Alamat Pengiriman
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kelola alamat untuk pengiriman pesanan fisik merchandise Anda.
          </p>
        </div>

        {!isFormOpen && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Tambah Alamat Baru
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Add/Edit */}
      {isFormOpen && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {editingId ? 'Ubah Alamat Pengiriman' : 'Tambah Alamat Pengiriman Baru'}
            </h3>
            <button
              onClick={resetForm}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Batal
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Label Alamat (misal: Rumah, Kantor)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Rumah / Kantor"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nama Penerima
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap Penerima"
                  value={formData.recipientName}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nomor Telepon / WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  placeholder="08123456789"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kecamatan / Kelurahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Kebayoran Baru"
                  value={formData.subdistrict}
                  onChange={(e) => setFormData({ ...formData, subdistrict: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Alamat Lengkap (Jalan, No. Rumah, RT/RW, Patokan)
              </label>
              <textarea
                required
                rows={2}
                placeholder="Jl. Merdeka No. 10 RT 01/02..."
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kota / Kabupaten
                </label>
                <input
                  type="text"
                  required
                  placeholder="Jakarta Selatan"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Provinsi
                </label>
                <input
                  type="text"
                  required
                  placeholder="DKI Jakarta"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kode Pos
                </label>
                <input
                  type="text"
                  required
                  placeholder="12190"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="isDefault" className="text-xs text-slate-700 dark:text-slate-300">
                Jadikan alamat utama untuk pengiriman
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editingId ? 'Simpan Perubahan' : 'Tambah Alamat'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Address Cards List */}
      {addresses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center">
          <MapPin className="mx-auto h-8 w-8 text-slate-400" />
          <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">Belum Ada Alamat</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Simpan alamat Anda untuk mempermudah proses checkout produk fisik seperti kaos dan merchandise.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Tambah Alamat Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`rounded-2xl border p-5 transition-all relative ${
                addr.isDefault
                  ? 'border-emerald-500/80 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-sm'
                  : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {addr.label.toLowerCase() === 'kantor' ? (
                      <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Home className="h-3.5 w-3.5 text-emerald-600" />
                    )}
                    {addr.label}
                  </span>

                  {addr.isDefault && (
                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                      Alamat Utama
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(addr)}
                    title="Ubah Alamat"
                    className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    title="Hapus Alamat"
                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-900 dark:text-white">{addr.recipientName}</p>
                <p className="text-slate-500 dark:text-slate-400">{addr.phone}</p>
                <p className="text-slate-700 dark:text-slate-300 pt-1 leading-relaxed">
                  {addr.street}
                  {addr.subdistrict && `, ${addr.subdistrict}`}
                  {`, ${addr.city}, ${addr.province} ${addr.postalCode}`}
                </p>
              </div>

              {!addr.isDefault && (
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    disabled={loading}
                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    Jadikan Alamat Utama
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
