import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';

describe('GenLearn Backend (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    app.useGlobalFilters(new AllExceptionsFilter());

    const reflector = app.get(Reflector);
    app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));

    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  }, 15000);

  describe('Health', () => {
    it('GET /api/v1/health returns service info', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ service: 'genlearn-backend', version: '1.0.0' });
    });
  });

  describe('Auth — public endpoints', () => {
    it('POST /api/v1/auth/register returns 400 for missing required fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'notvalid' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST /api/v1/auth/login returns 401 for unknown email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'wrong' });
      expect(res.status).toBe(401);
    });

    it('POST /api/v1/auth/forgot-password returns 204 (silent, no info leakage)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'noone@example.com' });
      expect([200, 204]).toContain(res.status);
    });
  });

  describe('Auth — protected endpoints', () => {
    it('GET /api/v1/auth/me returns 401 without a token', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/analytics/progress returns 401 without a token', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/analytics/progress');
      expect(res.status).toBe(401);
    });

    it('GET /api/v1/documents returns 401 without a token', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/documents');
      expect(res.status).toBe(401);
    });
  });
});
