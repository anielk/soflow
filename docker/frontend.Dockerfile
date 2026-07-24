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
