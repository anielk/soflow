import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { Request, Response, NextFunction } from 'express';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // This app sits behind a reverse proxy in demo/production (infrastructure,
  // operator's choice — not something this repo deploys) and the frontend's
  // dev-mode rewrite locally — trust its X-Forwarded-For so
  // req.ip (what ThrottlerGuard keys rate limits on) reflects the real
  // client, not the proxy's own address for every request.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // Set WebSocket adapter explicitly to avoid "No driver (WebSockets) has been selected" error
  app.useWebSocketAdapter(new IoAdapter(app.getHttpServer()));

  // Security headers
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });

  // Rate limiting is handled by ThrottlerModule/ThrottlerGuard, registered
  // globally in AppModule — see docs/architecture/rate-limiting.md for why
  // the hand-rolled version that used to live here was removed.

  app.setGlobalPrefix('v1', { exclude: [''] });
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port, '0.0.0.0');

  Logger.log(`Application is running on: http://localhost:${port}/v1`, 'Bootstrap');
}

void bootstrap();
