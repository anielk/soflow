/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Proxies same-origin `/v1/*` browser requests to the backend container —
  // see docs/deployment/Architecture.md. Despite BACKEND_PROXY_URL never
  // reaching the browser, this is just as build-time-sensitive as
  // NEXT_PUBLIC_API_URL: `next build` calls rewrites() once to compute
  // `.next/routes-manifest.json`, and the resolved destination is frozen
  // into that manifest — confirmed empirically (a container started with a
  // different BACKEND_PROXY_URL still proxied to the build-time host). A
  // container `environment:` entry alone has no effect at runtime; it must
  // also be a Docker build arg (see docker/frontend.Dockerfile).
  async rewrites() {
    const backendUrl = process.env.BACKEND_PROXY_URL;
    if (!backendUrl) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'BACKEND_PROXY_URL is not set. Required in production so this rewrite reaches the ' +
            'backend by its Docker service name (see compose.demo.yml / compose.prod.yml) — ' +
            '"localhost" inside the frontend container would refer to itself, not the backend.',
        );
      }
    }
    const resolvedBackendUrl = backendUrl || 'http://localhost:4000';
    return [
      {
        source: '/v1/:path*',
        destination: `${resolvedBackendUrl}/v1/:path*`,
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
