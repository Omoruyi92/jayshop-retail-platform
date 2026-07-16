import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Oswald, Inter } from 'next/font/google'
import { cn } from '@/lib/utils'
import { Toaster } from 'sonner'
import RootSessionProvider from '@/components/layout/RootSessionProvider'
import DevServiceWorkerCleanup from '@/components/layout/DevServiceWorkerCleanup'

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-oswald',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Jays Shop \u2014 Reserve Blue Jays Merchandise',
  description: 'Reserve Blue Jays gear online and pick it up in store within 48 hours. No payment required.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'icon', type: 'image/png', sizes: '32x32', url: '/favicon-32x32.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', url: '/favicon-16x16.png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Jays Shop',
  },
  openGraph: {
    title: 'Jays Shop',
    description: 'Reserve Blue Jays merchandise \u2014 pick up in store within 48 hours.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#134A8E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn(oswald.variable, inter.variable)}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        {process.env.NODE_ENV !== 'production' && (
          // Runs synchronously during HTML parsing, before React hydrates and
          // before any stylesheet/script fetch has a chance to be intercepted.
          // Guards against a stale PWA service worker (registered from a prior
          // `next build && next start` run) serving cached/mismatched CSS or JS
          // chunks to the dev server, which otherwise breaks Tailwind styling
          // entirely (raw unstyled markup, next/image `fill` elements ballooning
          // to viewport size) until the worker is unregistered.
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function (regs) {
                    if (regs.length === 0) return;
                    regs.forEach(function (r) { r.unregister(); });
                    if ('caches' in window) {
                      caches.keys().then(function (keys) {
                        keys.forEach(function (k) { caches.delete(k); });
                      });
                    }
                    if (!sessionStorage.getItem('jays-shop-dev-sw-cleanup-reloaded')) {
                      sessionStorage.setItem('jays-shop-dev-sw-cleanup-reloaded', '1');
                      window.location.reload();
                    }
                  }).catch(function () {});
                }
              `,
            }}
          />
        )}
      </head>
      <body className="font-sans bg-jays-ice text-gray-900 antialiased">
        <DevServiceWorkerCleanup />
        <RootSessionProvider>
          {children}
        </RootSessionProvider>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
