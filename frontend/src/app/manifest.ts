import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Leinaflow — A product of Cloudivo',
    short_name: 'Leinaflow',
    description: 'Creator management platform for agencies.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#09090B',
    theme_color: '#7C3AED',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
