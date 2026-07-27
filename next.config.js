/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  cleanupOutdatedCaches: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'cloudinary-images',
        expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
  ],
})

const nextConfig = {
  images: {
    // Serve modern, smaller formats when the browser supports them, without
    // any loss of visible quality vs. the source.
    formats: ['image/avif', 'image/webp'],
    // Matches the breakpoints actually used across hero banners, product
    // grids, and PDP galleries so Next always has a close-fitting size to
    // serve — avoids upscaling a too-small variant (blurry) or shipping an
    // oversized one (slow) for any given viewport.
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1440, 1920, 2400],
    imageSizes: [16, 32, 48, 64, 96, 128, 192, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.mlbstatic.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'media.istockphoto.com' },
      { protocol: 'https', hostname: 'www.cardboardmemories.ca' },
      // Vercel Blob storage — kept for legacy URLs already stored in the DB
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      // Cloudflare R2 public bucket — add your R2_PUBLIC_URL hostname here
      // Example: { protocol: 'https', hostname: 'jayshop-media.your-account.workers.dev' },
    ],
  },
}

module.exports = withPWA(nextConfig)
