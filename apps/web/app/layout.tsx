import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { CartProvider } from '@/components/CartContext';
import { getCurrentUser } from '@/lib/auth';
import { ThemeProvider, ThemeScript } from '@ruang-digital/ui';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Ruang Digital — Toko Online Produk Digital & Fisik Terpercaya',
  description: 'Beli aplikasi, software, ebook, template, dan merchandise developer resmi dengan sistem pengiriman otomatis dan pembayaran aman.',
  openGraph: {
    title: 'Ruang Digital — Produk Digital & Fisik',
    description: 'Platform terpadu untuk belanja software, ebook, template dan produk fisik berkualitas tinggi.',
    type: 'website',
    locale: 'id_ID',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <head>
        <ThemeScript storageKey="ruang-digital-theme" defaultTheme="system" />
      </head>
      <body className="flex min-h-screen flex-col font-sans bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 antialiased selection:bg-emerald-500 selection:text-white transition-colors duration-150">
        <ThemeProvider storageKey="ruang-digital-theme" defaultTheme="system">
          <CartProvider>
            <Navbar user={user} />
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
            <Footer />
            <MobileBottomNav user={user} />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
