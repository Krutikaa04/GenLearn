# Document Metadata

**Document ID:** OPS-03

**Title:** Environment Setup Guide

**Version:** 1.0.0

**Status:** DRAFT

**Owners:** Rishi Mahajan, Krutika Wagh

**Category:** Operations

**Priority:** High

---

# Purpose

Define how to set up a complete local development environment for GenLearn.

A new developer should be able to clone the repository, follow this guide, and have the entire platform running locally within 30 minutes.

---

# Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20 LTS | Backend and Frontend |
| pnpm | 8+ | Package manager |
| Python | 3.11+ | AI Platform |
| Docker | 24+ | Containerisation |
| Docker Compose | 2.20+ | Service orchestration |
| Git | 2.40+ | Version control |

---

# Repository Setup

```bash
# Clone repository
git clone https://github.com/Krutikaa04/GenLearn.git
cd GenLearn

# Verify structure
ls
# frontend/  backend/  ai-service/  handbook/  docker-compose.yml
```

---

# Environment Files

Copy example files and fill in values:

```bash
cp backend/.env.example backend/.env
cp ai-service/.env.example ai-service/.env
cp frontend/.env.example frontend/.env
```

---

# Backend Environment Variables

`backend/.env`:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=mongodb://admin:password@localhost:27017/genlearn

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-minimum-64-characters
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AI Platform
AI_SERVICE_URL=http://ai-service:8000
INTERNAL_API_KEY=your-internal-api-key

# Email (use Mailtrap for development)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASSWORD=your-mailtrap-password
SMTP_FROM=noreply@genlearn.dev

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173
```

---

# AI Platform Environment Variables

`ai-service/.env`:

```env
# Application
PORT=8000
ENVIRONMENT=development

# AI Provider
GEMINI_API_KEY=your-gemini-api-key
MODEL_NAME=gemini-1.5-flash
EMBEDDING_MODEL=text-embedding-004

# Vector Store
VECTOR_PROVIDER=atlas
MONGODB_URI=mongodb://admin:password@localhost:27017/genlearn

# Internal Security
INTERNAL_API_KEY=your-internal-api-key

# Redis
REDIS_URL=redis://redis:6379
```

---

# Frontend Environment Variables

`frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
```

---

# Option 1: Run with Docker Compose (Recommended)

This starts all 5 containers (frontend, backend, ai-service, mongodb, redis).

```bash
# Build and start all services
docker compose up --build

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

Services will be available at:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| AI Platform | http://localhost:8000 |
| Backend Swagger | http://localhost:3000/api/docs |
| AI Platform Docs | http://localhost:8000/docs |
| MongoDB | localhost:27017 |
| Redis | localhost:6379 |

---

# Option 2: Run Services Individually

Useful for debugging a specific service.

## Start Infrastructure (MongoDB + Redis)

```bash
docker compose up mongodb redis -d
```

## Start Backend

```bash
cd backend
pnpm install
pnpm start:dev
```

## Start AI Platform

```bash
cd ai-service
python -m venv .venv
source .venv/bin/activate   # Mac/Linux
# .venv\Scripts\activate    # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Start Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

---

# Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Sign in with a Google account
3. Click "Get API Key"
4. Create a new API key
5. Copy it into `ai-service/.env` as `GEMINI_API_KEY`

The free tier provides sufficient quota for development.

---

# Database Seed Data (Optional)

To pre-populate the database with test data:

```bash
cd backend
pnpm db:seed
```

This creates:

- 1 admin user (`admin@genlearn.dev` / `Admin123!`)
- 2 student users (`student1@genlearn.dev` / `Student123!`)
- Sample lessons, quizzes, and progress records

---

# Verifying Setup

```bash
# Check backend health
curl http://localhost:3000/health

# Check AI Platform health
curl http://localhost:8000/health

# Expected response
{ "status": "ok", "version": "1.0.0" }
```

---

# Common Issues

| Issue | Solution |
|-------|----------|
| Port already in use | Stop the conflicting process or change ports in .env |
| MongoDB connection failed | Ensure Docker containers are running |
| Gemini API rate limit | Wait 1 minute — free tier has per-minute limits |
| Docker build fails | Delete node_modules and rebuild: `docker compose build --no-cache` |
| pnpm not found | Install with `npm install -g pnpm` |

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial environment setup guide created. |
