'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileArchive,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  HardDrive,
  ChevronDown,
  ChevronUp,
  FileCode,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { formatFileSize } from '@ruang-digital/utils';

interface DigitalFileUploaderProps {
  fileName: string;
  driveFileId: string;
  fileVersion?: string;
  platform?: string;
  onChange: (data: {
    fileName: string;
    driveFileId: string;
    fileVersion: string;
    platform: string;
  }) => void;
}

export function DigitalFileUploader({
  fileName,
  driveFileId,
  fileVersion = '1.0.0',
  platform = 'All',
  onChange,
}: DigitalFileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [storageType, setStorageType] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // Max 50 MB
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg(
        'Ukuran file lebih dari 50 MB. Gunakan opsi "Input Manual Google Drive ID" di bawah untuk file berukuran sangat besar.'
      );
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload-digital', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengunggah berkas digital ke Google Drive.');
      }

      setFileSize(data.fileSize || file.size);
      setStorageType(data.storage);
      setSuccessMsg(data.message || 'File berhasil diunggah ke Google Drive!');

      onChange({
        fileName: data.fileName,
        driveFileId: data.driveFileId,
        fileVersion: fileVersion || '1.0.0',
        platform: platform || 'All',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat mengunggah file.');
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

  const handleClearFile = () => {
    onChange({
      fileName: '',
      driveFileId: '',
      fileVersion: fileVersion,
      platform: platform,
    });
    setFileSize(null);
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  // Helper file icon
  const getFileExt = (name: string) => name.split('.').pop()?.toUpperCase() || 'FILE';

  return (
    <div className="space-y-4 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6 dark:border-indigo-900/60 dark:bg-indigo-950/30">
      <div className="flex items-center justify-between border-b border-indigo-200/80 pb-3 dark:border-indigo-900/40">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-600/20 dark:text-indigo-400">
            <HardDrive className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">File Produk Digital (Google Drive)</h3>
            <p className="text-[11px] text-slate-600 dark:text-indigo-300/70">
              File tersimpan aman & hanya bisa diunduh oleh pembeli setelah pesanan berstatus PAID.
            </p>
          </div>
        </div>

        {driveFileId && (
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            File Terpasang
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Upload or File Info Box */}
      {driveFileId ? (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-100 text-indigo-700 dark:border-indigo-700/50 dark:bg-indigo-900/50 dark:text-indigo-300">
                <FileArchive className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="max-w-sm truncate text-xs font-bold text-slate-900 dark:text-white">
                    {fileName || 'Berkas-Digital'}
                  </span>
                  <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                    {getFileExt(fileName)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {fileSize ? formatFileSize(fileSize) : 'Ukuran tersimpan di cloud'}
                </p>
                <p className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400/80">
                  Drive File ID: <span className="font-semibold text-slate-900 dark:text-white">{driveFileId}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
              >
                Ganti File
              </button>
              <button
                type="button"
                onClick={handleClearFile}
                className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100 dark:border-rose-800/60 dark:bg-rose-950/60 dark:text-rose-400 dark:hover:bg-rose-900/60"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
              isDragOver
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                : 'border-indigo-300/80 bg-white/70 hover:border-indigo-500 hover:bg-indigo-50/50 dark:border-indigo-900/60 dark:bg-slate-950/40 dark:hover:border-indigo-600 dark:hover:bg-indigo-950/20'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,.rar,.7z,.tar,.gz,.pdf,.epub,.apk,.dmg,.exe,.docx,.xlsx,.fig,.json"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            {isUploading ? (
              <div className="flex flex-col items-center gap-3 text-indigo-700 dark:text-indigo-200">
                <Loader2 className="h-9 w-9 animate-spin text-indigo-600 dark:text-indigo-400" />
                <div>
                  <p className="text-sm font-bold">Mengunggah file ke Google Drive...</p>
                  <p className="mt-0.5 text-[11px] text-indigo-600/70 dark:text-indigo-400/70">
                    Memproses upload via Google Apps Script Bridge
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-100 text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-600/20 dark:text-indigo-400">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">
                    Klik untuk memilih file atau seret file ke sini
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    Mendukung ZIP, RAR, 7Z, PDF, APK, DMG, EPUB, dll. (Maksimal 50 MB)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Versi dan Platform */}
      <div className="grid grid-cols-2 gap-4 pt-2">
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">Versi File</label>
          <input
            type="text"
            value={fileVersion}
            onChange={(e) =>
              onChange({
                fileName,
                driveFileId,
                fileVersion: e.target.value,
                platform,
              })
            }
            placeholder="1.0.0"
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-300">Platform / Kesesuaian</label>
          <input
            type="text"
            value={platform}
            onChange={(e) =>
              onChange({
                fileName,
                driveFileId,
                fileVersion,
                platform: e.target.value,
              })
            }
            placeholder="Windows, macOS, Android, Web, All"
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* Collapsible Manual Input Google Drive File ID */}
      <div className="border-t border-indigo-200/80 pt-3 dark:border-indigo-900/40">
        <button
          type="button"
          onClick={() => setShowManualInput(!showManualInput)}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          {showManualInput ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          <span>{showManualInput ? 'Sembunyikan Input Manual' : 'Input File ID Google Drive Manual (File > 50 MB)'}</span>
        </button>

        {showManualInput && (
          <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white/90 p-3 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-950/60">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Nama File Download
              </label>
              <input
                type="text"
                value={fileName}
                onChange={(e) =>
                  onChange({
                    fileName: e.target.value,
                    driveFileId,
                    fileVersion,
                    platform,
                  })
                }
                placeholder="Software-Pro-v1.zip"
                className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Google Drive File ID
              </label>
              <input
                type="text"
                value={driveFileId}
                onChange={(e) =>
                  onChange({
                    fileName: fileName || 'file.zip',
                    driveFileId: e.target.value,
                    fileVersion,
                    platform,
                  })
                }
                placeholder="1BxiMVs0XRA5nFMdKvBHK9j2..."
                className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <p className="col-span-2 text-[10px] text-slate-500 dark:text-slate-400">
              * Jika file Anda sangat besar (misal 500MB), Anda dapat mengunggah file langsung ke Google Drive Anda lalu menyalin ID dari URL share link file tersebut.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
