import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const helmet = require('helmet');
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

async function createAppWithRetry(maxAttempts = 5, baseDelayMs = 2000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await NestFactory.create(AppModule);
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      const delay = baseDelayMs * attempt;
      console.error(
        `Bootstrap attempt ${attempt}/${maxAttempts} failed (${(err as Error).message}) — retrying in ${delay}ms`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  // Unreachable — the loop above always returns or throws
  throw new Error('Bootstrap retry loop exited unexpectedly');
}

// Resolve the list of browser origins allowed to make credentialed requests.
// Driven entirely by environment so the same build runs locally, on Vercel
// preview URLs, and against the production frontend without code changes.
function resolveCorsOrigins(): (string | RegExp)[] {
  const origins = new Set<string>();

  // CORS_ORIGINS: comma-separated allowlist (e.g. prod + staging frontends).
  for (const origin of (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)) {
    origins.add(origin);
  }

  // FRONTEND_URL is the single canonical frontend (also used for email links).
  if (process.env.FRONTEND_URL) origins.add(process.env.FRONTEND_URL);

  // Sensible local default when nothing is configured.
  if (origins.size === 0) origins.add('http://localhost:5173');

  const allowed: (string | RegExp)[] = [...origins];

  // Opt-in: allow Vercel preview deployments (https://<hash>.vercel.app).
  if (process.env.ALLOW_VERCEL_PREVIEWS === 'true') {
    allowed.push(/^https:\/\/[a-z0-9-]+\.vercel\.app$/);
  }

  return allowed;
}

async function bootstrap() {
  // A transient MongoDB/Redis connection failure during startup (a PaaS cold
  // start racing DNS/network availability, Atlas maintenance) would otherwise
  // crash the process immediately, relying on the platform's restart policy
  // (a full container restart) to recover. Retrying in-process first is faster
  // and cheaper than a cold restart loop.
  const app = await createAppWithRetry();

  // Health check stays at the root (/health) so platform probes (Render) don't
  // need to know the API version prefix; everything else lives under /api/v1.
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
  app.use(helmet());
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));

  app.enableCors({
    origin: resolveCorsOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  });

  // Flush queue workers and close DB/Redis connections on SIGTERM so Render can
  // roll deployments and scale down without dropping in-flight work.
  app.enableShutdownHooks();

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('GenLearn API')
      .setDescription('GenLearn backend API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  }

  // Render (and most PaaS) inject PORT; bind to 0.0.0.0 so the platform's proxy
  // can reach the container. Never hardcode the port or host.
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Backend listening on port ${port} (NODE_ENV=${process.env.NODE_ENV ?? 'development'})`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Swagger: http://localhost:${port}/api/docs`);
  }
}
bootstrap();
