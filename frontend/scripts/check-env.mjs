#!/usr/bin/env node
// Runs before `next build` (see package.json's `prebuild` script). Catches a
// missing production build-time config at `docker build` time — a clear,
// immediate failure — instead of shipping a broken image that only fails
// once a user hits a page that calls the missing variable.
//
// NEXT_PUBLIC_API_URL is inlined into the client bundle by `next build`
// itself, so it must arrive as a build ARG (see docker/frontend.Dockerfile
// and compose.demo.yml/compose.prod.yml's `build.args`) — a container
// `environment:` entry alone has no effect on the already-compiled bundle.
// BACKEND_PROXY_URL is checked here too so a single build failure reports
// every missing production var at once, even though next.config.mjs's own
// rewrites() also fails fast on it independently.
const REQUIRED_IN_PRODUCTION = ['NEXT_PUBLIC_API_URL', 'BACKEND_PROXY_URL'];

if (process.env.NODE_ENV === 'production') {
  const missing = REQUIRED_IN_PRODUCTION.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.error(`✖ Missing required production build variable(s): ${missing.join(', ')}`);
    console.error('  These must be passed as Docker build args — see compose.demo.yml / compose.prod.yml `build.args`.');
    process.exit(1);
  }
}
