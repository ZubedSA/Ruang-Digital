import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider, ThemeScript } from '@ruang-digital/ui';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ruang Digital — Admin Operations Console',
  description: 'Panel operasional dan manajemen katalog produk, pembayaran, dan logistik.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <ThemeScript storageKey="ruang-digital-admin-theme" defaultTheme="system" />
      </head>
      <body className={`${inter.className} bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 min-h-screen antialiased transition-colors duration-150`}>
        <ThemeProvider storageKey="ruang-digital-admin-theme" defaultTheme="system">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
