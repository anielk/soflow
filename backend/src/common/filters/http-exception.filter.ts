import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
      error: extractErrorMessage(exceptionResponse),
    };

    response.status(status).json(errorResponse);
  }
}

/**
 * ValidationPipe's default exceptionFactory throws a BadRequestException
 * whose `message` is a string[] (one entry per failed field), not a string —
 * `as string` on that array was a silent type-cast that shipped the raw
 * array as `error` instead of readable text. Every other HttpException
 * (including ones this app throws itself) has a plain string `message`.
 */
function extractErrorMessage(exceptionResponse: string | object): string {
  if (typeof exceptionResponse === 'string') return exceptionResponse;

  const { message } = exceptionResponse as { message?: unknown };
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;
  return JSON.stringify(exceptionResponse);
}