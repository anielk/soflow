# Creator Platform - Phase 2 Foundation
Production-ready local development and deployment foundation for a scalable creator CRM/chat analytics platform.

## 1) Stack
- Frontend: Next.js (TypeScript, App Router, TailwindCSS)
- Backend: NestJS (TypeScript)
- ORM: Prisma
- Database: PostgreSQL
- Cache/Realtime foundation: Redis
- Runtime: Docker + Docker Compose
- Reverse proxy: NGINX-ready configuration

## 2) Project Structure
```text
creator-platform/
├── frontend/                 # Next.js app
├── backend/                  # NestJS app + Prisma
├── docker/                   # Dockerfiles
├── nginx/                    # Reverse proxy config
├── scripts/                  # Utility scripts
```

## 3) API Structure
### Backend API
- Base URL: `/api/v1`
- Health check: `GET /api/v1/health`
- Authentication: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`
- Users: `GET /api/v1/users`

### WebSocket
- Connection: `ws://localhost:4000`
- Events: `ping`/`pong`

## 4) Environment Variables
### Backend
- `NODE_ENV`: development/production/test
- `PORT`: Application port (default: 4000)
- `JWT_SECRET`: Secret for JWT tokens
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string

### Frontend
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:4000)

## 5) Setup
1. Clone the repository
2. Run `./setup-server.sh` to configure the server
3. Run `docker-compose up` to start all services

## 6) Development
- Frontend: `cd frontend && npm run dev`
- Backend: `cd backend && npm run start:dev`