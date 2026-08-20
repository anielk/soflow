import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { Request, Response, NextFunction } from 'express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { TRUST_PROXY_HOPS } from './config/trust-proxy.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Trust exactly one reverse-proxy hop so req.ip (used by every auth audit
  // event and by ThrottlerGuard's rate-limit key) reflects the real client,
  // not a proxy's own address. See trust-proxy.config.ts for why this is
  // `1` and not `2` despite two processes sitting in front of this backend
  // in demo/production, and docs/architecture/ip-tracking.md for the full
  // chain this was verified against.
  app.getHttpAdapter().getInstance().set('trust proxy', TRUST_PROXY_HOPS);

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
