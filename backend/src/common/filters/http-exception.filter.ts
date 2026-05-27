import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as string | { message?: unknown };

    let error: string = 'Internal Error';
    if (typeof exceptionResponse === 'string') {
      error = exceptionResponse;
    } else {
      const responseObj = exceptionResponse as { message?: string };
      error = responseObj?.message as string || JSON.stringify(exceptionResponse);
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
      error,
    };

    response.status(status).json(errorResponse);
  }
}