# Document Metadata

**Document ID:** OPS-02

**Title:** Deployment Guide

**Version:** 1.0.0

**Status:** DRAFT

**Owners:** Rishi Mahajan, Krutika Wagh

**Category:** Operations

**Priority:** High

---

# Purpose

Define the deployment strategy for the GenLearn platform across all environments.

---

# Deployment Philosophy

GenLearn is designed to run at near-zero cost during the portfolio phase.

All chosen providers have free tiers adequate for development and demonstration.

The architecture is provider-independent — migrating to paid infrastructure requires only configuration changes.

---

# Deployment Environments

| Environment | Purpose |
|-------------|---------|
| Local | Development and testing on developer machines |
| Staging | Pre-production integration testing (future) |
| Production | Live platform |

---

# Production Infrastructure

| Service | Provider | Notes |
|---------|----------|-------|
| Frontend | Vercel (Free) | Auto-deploys from GitHub |
| Backend | Render (Free) | Web service |
| AI Platform | Render (Free) | Web service |
| Database | MongoDB Atlas (Free M0) | Cloud-hosted |
| Cache + Queue | Redis Cloud (Free) | or Render Redis |
| Object Storage | Cloudflare R2 (Free tier) | Document file storage |
| AI Provider | Google Gemini (Free tier) | Gemini 1.5 Flash |

---

# Frontend Deployment (Vercel)

Vercel auto-deploys from the `main` branch.

Configuration:

- Build command: `pnpm build`
- Output directory: `dist`
- Environment variables set in Vercel dashboard

Required environment variables:

```
VITE_API_URL=https://api.genlearn-production.com
```

---

# Backend Deployment (Render)

Render deploys as a Web Service from GitHub.

Configuration:

- Build command: `pnpm install && pnpm build`
- Start command: `node dist/main.js`
- Instance type: Free (512 MB RAM)
- Auto-deploy: on push to `main`

Required environment variables (set in Render dashboard):

```
NODE_ENV=production
DATABASE_URL=mongodb+srv://...
JWT_SECRET=...
REDIS_URL=redis://...
AI_SERVICE_URL=https://ai-service.onrender.com
SMTP_HOST=...
SMTP_USER=...
SMTP_PASSWORD=...
INTERNAL_API_KEY=...
```

---

# AI Platform Deployment (Render)

Render deploys as a Web Service.

Configuration:

- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port 8000`
- Instance type: Free

Required environment variables:

```
GEMINI_API_KEY=...
EMBEDDING_PROVIDER=gemini
VECTOR_PROVIDER=atlas
MONGODB_URI=mongodb+srv://...
INTERNAL_API_KEY=...
```

---

# MongoDB Atlas Setup

1. Create free M0 cluster on MongoDB Atlas.
2. Create database user with read/write permissions.
3. Whitelist Render IPs (or use 0.0.0.0/0 for free tier).
4. Create Atlas Vector Search index on `document_chunks` collection.

Vector Search Index definition:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    }
  ]
}
```

---

# Redis Cloud Setup

1. Create free Redis Cloud database.
2. Copy connection string.
3. Set `REDIS_URL` in backend and AI Platform environment variables.

---

# Deployment Checklist

Before every production deployment:

- [ ] All tests pass locally
- [ ] TypeScript builds without errors
- [ ] Environment variables set in deployment platforms
- [ ] MongoDB Atlas connection string updated
- [ ] Redis connection string updated
- [ ] Gemini API key set in AI Platform
- [ ] CORS settings updated with production domain
- [ ] JWT secret is strong (minimum 64 characters)
- [ ] Internal API key shared between backend and AI Platform

---

# Rolling Back

Render:

- Use Render dashboard to redeploy a previous successful deployment.

Vercel:

- Use Vercel dashboard to promote a previous deployment.

MongoDB:

- Use Atlas point-in-time recovery for data issues.

---

# Free Tier Limitations

| Provider | Limitation |
|----------|-----------|
| Render Free | Service sleeps after 15 minutes of inactivity |
| MongoDB Atlas M0 | 512 MB storage, shared cluster |
| Redis Cloud Free | 30 MB memory |
| Vercel Free | 100 GB bandwidth per month |
| Gemini Free | Rate limits per minute |

For production demonstrations, use a paid Render instance ($7/month) to avoid cold starts.

---

# Future: CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Render Deploy
        run: curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_BACKEND }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Vercel Deploy
        run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

---

# Revision History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | June 2026 | Initial deployment guide created. |
