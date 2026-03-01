import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

interface ExceptionResponseBody {
  message: string | string[];
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errors =
      typeof exceptionResponse === 'object' && 'message' in exceptionResponse
        ? (exceptionResponse as ExceptionResponseBody).message
        : exception.message;

    response.status(status).json({
      statusCode: status,
      message: Array.isArray(errors) ? 'Validation failed' : errors,
      errors: Array.isArray(errors)
        ? errors.map((message: string) => ({ message }))
        : undefined,
      timestamp: new Date().toISOString(),
    });
  }
}
