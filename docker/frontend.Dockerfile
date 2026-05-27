FROM node:22-alpine AS base
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install

FROM base AS development
ENV NODE_ENV=development
COPY frontend/ ./
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM base AS production
ENV NODE_ENV=production
COPY frontend/ ./
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
