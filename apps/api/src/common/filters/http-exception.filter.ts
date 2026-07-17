import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorBody {
  code?: string;
  message?: string | string[];
  errors?: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = isHttpException ? exception.getResponse() : undefined;
    const body = typeof payload === 'object' && payload !== null ? (payload as ErrorBody) : {};
    const message =
      status >= 500
        ? 'Não foi possível processar a solicitação.'
        : (body.message ?? 'Não foi possível processar a solicitação.');

    response.status(status).json({
      statusCode: status,
      code: body.code ?? (isHttpException ? 'HTTP_ERROR' : 'INTERNAL_ERROR'),
      message,
      errors: body.errors ?? [],
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
