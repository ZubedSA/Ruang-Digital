'use client';

import React, { useState } from 'react';
import { Key, Copy, Check } from 'lucide-react';

export function LicenseKeyCopy({ licenseKey }: { licenseKey: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-900/40 dark:bg-purple-950/20">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
          <Key className="h-4 w-4" />
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
            Kunci Lisensi Resmi:
          </span>
          <p className="font-mono text-sm font-black text-slate-900 dark:text-white tracking-widest">
            {licenseKey}
          </p>
        </div>
      </div>

      <button
        onClick={handleCopy}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-purple-300 bg-white px-3.5 py-2 text-xs font-bold text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300 transition-colors"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-emerald-600">Tersalin!</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            <span>Salin Key</span>
          </>
        )}
      </button>
    </div>
  );
}
