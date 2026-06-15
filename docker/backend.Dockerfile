FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
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
EXPOSE 4000
CMD ["node", "dist/main"]
