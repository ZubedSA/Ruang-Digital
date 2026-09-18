/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@ruang-digital/ui',
    '@ruang-digital/auth',
    '@ruang-digital/db',
    '@ruang-digital/types',
    '@ruang-digital/utils',
  ],
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['lucide-react', '@ruang-digital/ui'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
  },
};

export default nextConfig;
