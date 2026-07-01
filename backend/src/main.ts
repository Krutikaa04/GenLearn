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

async function bootstrap() {
  // A transient MongoDB/Redis connection failure during startup (Railway cold
  // start racing DNS/network availability, Atlas maintenance) would otherwise
  // crash the process immediately, relying on the platform's restart policy
  // (a full container restart) to recover. Retrying in-process first is faster
  // and cheaper than a cold restart loop.
  const app = await createAppWithRetry();

  app.setGlobalPrefix('api/v1');
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
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  });

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('GenLearn API')
      .setDescription('GenLearn backend API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Swagger: http://localhost:${port}/api/docs`);
  }
}
bootstrap();
