/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // In development mode inside Docker, proxy API calls to the backend container
  async rewrites() {
    const backendUrl = process.env.BACKEND_PROXY_URL || 'http://localhost:4000';
    return [
      {
        source: '/v1/:path*',
        destination: `${backendUrl}/v1/:path*`,
      },
    ];
  },

  // Previously set by the internal nginx layer (removed — see
  // docs/deployment/Architecture.md); the app owns these directly now so
  // they hold regardless of what reverse proxy (if any) sits in front of it.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer-when-downgrade' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
