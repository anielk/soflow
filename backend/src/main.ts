import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { Request, Response, NextFunction } from 'express';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  
  // Security headers
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });
  
  // Rate limiting
  const requestTimings = new Map<string, { startTime: number, count: number }>();
  
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.socket.remoteAddress! + req.method;
    const timing = requestTimings.get(requestId) || { startTime: Date.now(), count: 0 };
    requestTimings.set(requestId, timing);
    
    let currentCount = timing.count;
    currentCount += 1;
    requestTimings.set(requestId, { startTime: timing.startTime, count: currentCount });
    
    if (currentCount > 100) {
      return res.send('Too Many Requests');
    }
    
    next();
  });

  app.setGlobalPrefix('api/v1');
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
  
  Logger.log(`Application is running on: http://localhost:${port}/api/v1`, 'Bootstrap');
}

void bootstrap();