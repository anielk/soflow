# syntax=docker/dockerfile:1

# deps — full dependency set (incl. devDependencies), needed to run the
# Next.js build (TypeScript, Tailwind, etc.). Isolated in its own stage so
# it's cached independently of application source changes.
FROM node:22-alpine AS deps
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci

# development — full deps + live source. Source itself is bind-mounted in
# by compose.dev.yml; the COPY here only matters for one-off `docker build`
# runs (e.g. CI) without the override applied.
FROM deps AS development
ENV NODE_ENV=development
COPY frontend/ ./
EXPOSE 3000
CMD ["npm", "run", "dev"]

# builder — compiles the production build using the full (dev+prod) deps.
FROM deps AS builder
# Both vars must be build ARGs, not just compose `environment:` entries:
# - NEXT_PUBLIC_API_URL is inlined into the client bundle by `next build`.
# - BACKEND_PROXY_URL looks like a runtime-only var (it's read in
#   next.config.mjs's rewrites(), which runs server-side, never shipped to
#   the browser) but `next build` itself calls rewrites() once to compute
#   `.next/routes-manifest.json`, and that destination is frozen into the
#   manifest — confirmed empirically: a container started with a different
#   BACKEND_PROXY_URL still proxied to the build-time host. A runtime
#   `environment:` entry alone has no effect on either variable.
ARG NEXT_PUBLIC_API_URL
ARG BACKEND_PROXY_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV BACKEND_PROXY_URL=$BACKEND_PROXY_URL
COPY frontend/ ./
ENV NODE_ENV=production
RUN npm run build

# prod-deps — production-only node_modules, built independently of the
# builder stage so devDependencies never end up in the final image.
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# production — minimal runtime: prod deps + build output only, no source,
# no devDependencies, no build toolchain.
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/.next ./.next
EXPOSE 3000
CMD ["npm", "run", "start"]
