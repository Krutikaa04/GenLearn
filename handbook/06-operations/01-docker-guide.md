# Document Metadata

**Document ID:** OPS-01

**Title:** Docker Guide

**Version:** 1.0.0

**Status:** DRAFT

**Owners:** Rishi Mahajan, Krutika Wagh

**Category:** Operations

**Priority:** High

---

# Purpose

Define the Docker containerisation strategy and Docker Compose configuration for the GenLearn platform.

Every service must be containerised. The entire platform must be launchable with a single command.

---

# Container Architecture

The GenLearn platform runs as five containers in development:

| Container | Technology | Port |
|-----------|-----------|------|
| frontend | React + Nginx | 5173 (dev) / 80 (prod) |
| backend | NestJS | 3000 |
| ai-service | FastAPI | 8000 |
| mongodb | MongoDB | 27017 |
| redis | Redis | 6379 |

In production, MongoDB Atlas and Redis Cloud replace the local containers.

---

# Docker Compose Structure

```yaml
# docker-compose.yml (development)
version: '3.9'

services:

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - VITE_API_URL=http://localhost:3000
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    env_file:
      - ./backend/.env
    depends_on:
      - mongodb
      - redis
      - ai-service

  ai-service:
    build:
      context: ./ai-service
      dockerfile: Dockerfile.dev
    ports:
      - "8000:8000"
    volumes:
      - ./ai-service:/app
    env_file:
      - ./ai-service/.env
    depends_on:
      - redis

  mongodb:
    image: mongo:7.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  mongodb_data:
  redis_data:

networks:
  default:
    name: genlearn_network
```

---

# Service Communication

All services communicate using service names, not localhost.

```
# Backend calls AI Platform:
AI_SERVICE_URL=http://ai-service:8000

# Backend calls Redis:
REDIS_URL=redis://redis:6379

# Backend calls MongoDB (dev):
DATABASE_URL=mongodb://admin:password@mongodb:27017/genlearn
```

---

# Dockerfiles

## Backend (Development)

```dockerfile
# backend/Dockerfile.dev
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
EXPOSE 3000
CMD ["pnpm", "start:dev"]
```

## Backend (Production)

```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

## AI Platform (Development)

```dockerfile
# ai-service/Dockerfile.dev
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

## Frontend (Development)

```dockerfile
# frontend/Dockerfile.dev
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
EXPOSE 5173
CMD ["pnpm", "dev", "--host"]
```

---

# Startup Command

Development:
```bash
docker compose up --build
```

Production:
```bash
docker compose -f docker-compose.prod.yml up -d
```

Stop all containers:
```bash
docker compose down
```

Stop and remove volumes:
```bash
docker compose down -v
```

---

# Health Checks

Every container declares a health check.

```yaml
# Example: backend health check in docker-compose.yml
backend:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

---

# Environment Files

Each service has its own `.env` file.

`.env` files are never committed to Git.

`.env.example` files are committed showing required variables.

---

# Networking Rules

- All services are on the `genlearn_network` internal network.
- Only `frontend` (port 5173/80) and `backend` (port 3000) are exposed to the host.
- Redis and MongoDB are not publicly accessible.
- The `ai-service` is internal only.

---

# Volumes

| Volume | Contents |
|--------|---------|
| mongodb_data | MongoDB data files (dev only) |
| redis_data | Redis persistence files |

Production uses MongoDB Atlas and Redis Cloud — no local volumes needed.

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial Docker guide created. |
