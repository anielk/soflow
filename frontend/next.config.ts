import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
};

export default nextConfig;
