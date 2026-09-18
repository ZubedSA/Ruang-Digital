'use client';

import * as React from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme, type Theme } from './theme-provider';
import { cn } from '../utils';

export interface ThemeToggleProps {
  variant?: 'dropdown' | 'compact' | 'segmented';
  className?: string;
  align?: 'start' | 'end';
}

export function ThemeToggle({
  variant = 'dropdown',
  className,
  align = 'end',
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on click outside or Escape
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!mounted) {
    return (
      <div
        className={cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100/60 dark:border-slate-800 dark:bg-slate-900/60 animate-pulse',
          className
        )}
        aria-hidden="true"
      />
    );
  }

  // Segmented 3-button control (ideal for settings / mobile menu / sidebars)
  if (variant === 'segmented') {
    const options: { value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
      { value: 'light', label: 'Terang', icon: Sun },
      { value: 'dark', label: 'Gelap', icon: Moon },
      { value: 'system', label: 'Sistem', icon: Laptop },
    ];

    return (
      <div
        className={cn(
          'inline-flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-900/80',
          className
        )}
        role="group"
        aria-label="Pilih Mode Tema"
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all',
                isActive
                  ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-800 dark:text-emerald-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              )}
              title={`Beralih ke mode ${opt.label}`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Quick 1-click toggle button
  if (variant === 'compact') {
    const isDark = resolvedTheme === 'dark';
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          'relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800',
          className
        )}
        title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
        aria-label="Ganti Tema Tampilan"
      >
        {isDark ? (
          <Moon className="h-4 w-4 text-emerald-400 transition-transform duration-300 rotate-0" />
        ) : (
          <Sun className="h-4 w-4 text-amber-500 transition-transform duration-300 rotate-0" />
        )}
      </button>
    );
  }

  // Default: Interactive Dropdown button
  const isDark = resolvedTheme === 'dark';

  return (
    <div className={cn('relative inline-block text-left', className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white/90 text-slate-700 shadow-sm backdrop-blur-md transition-all hover:border-emerald-500/50 hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:border-emerald-500/50 dark:hover:bg-slate-800"
        title="Pengaturan Mode Tema (Terang / Gelap / Sistem)"
        aria-label="Pengaturan Mode Tema"
        aria-expanded={isOpen}
      >
        {isDark ? (
          <Moon className="h-4 w-4 text-emerald-400 transition-all" />
        ) : (
          <Sun className="h-4 w-4 text-amber-500 transition-all" />
        )}
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-2 w-40 origin-top rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-xl backdrop-blur-xl transition-all dark:border-slate-800 dark:bg-slate-900/95',
            align === 'end' ? 'right-0' : 'left-0'
          )}
          role="menu"
        >
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
            Mode Tampilan
          </div>

          <button
            type="button"
            onClick={() => {
              setTheme('light');
              setIsOpen(false);
            }}
            className={cn(
              'flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors',
              theme === 'light'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            )}
            role="menuitem"
          >
            <div className="flex items-center gap-2">
              <Sun className="h-3.5 w-3.5 text-amber-500" />
              <span>Mode Terang</span>
            </div>
            {theme === 'light' && <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme('dark');
              setIsOpen(false);
            }}
            className={cn(
              'flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors',
              theme === 'dark'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            )}
            role="menuitem"
          >
            <div className="flex items-center gap-2">
              <Moon className="h-3.5 w-3.5 text-emerald-500" />
              <span>Mode Gelap</span>
            </div>
            {theme === 'dark' && <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setTheme('system');
              setIsOpen(false);
            }}
            className={cn(
              'flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors',
              theme === 'system'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            )}
            role="menuitem"
          >
            <div className="flex items-center gap-2">
              <Laptop className="h-3.5 w-3.5 text-blue-500" />
              <span>Otomatis Sistem</span>
            </div>
            {theme === 'system' && <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
          </button>
        </div>
      )}
    </div>
  );
}
