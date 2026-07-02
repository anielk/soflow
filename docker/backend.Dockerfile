FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates ffmpeg && rm -rf /var/lib/apt/lists/*
COPY backend/package*.json ./
RUN npm install

FROM base AS development
ENV NODE_ENV=development
COPY backend/ ./
RUN npm run prisma:generate
EXPOSE 4000
CMD ["npm", "run", "start:dev"]

FROM base AS builder
COPY backend/ ./
RUN npm run prisma:generate
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
COPY backend/ ./
RUN npm ci --omit=dev --no-audit --no-fund
RUN npm run prisma:generate
COPY --from=builder /app/dist ./dist
# The container runs as uid 1000 on a read-only filesystem in production
# (see docker-compose.prod.yml), with /data/media as the only writable
# mount (a named volume). Docker copies a mounted path's existing ownership
# into a fresh named volume the first time it's used, so pre-creating and
# chown'ing it here is what makes that volume writable by the app user.
RUN mkdir -p /data/media/.tmp && chown -R 1000:1000 /data/media
EXPOSE 4000
CMD ["node", "dist/main"]
