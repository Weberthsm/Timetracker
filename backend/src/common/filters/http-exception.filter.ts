import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

interface ValidationDetail {
  field: string;
  message: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // ── HttpException (NotFoundException, ForbiddenException, ValidationPipe, etc.) ──
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let message = exception.message;
      let details: ValidationDetail[] | undefined;

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        if (typeof resp['message'] === 'string') {
          message = resp['message'];
        }
        if (Array.isArray(resp['message'])) {
          const rawMessages = resp['message'] as string[];
          message = 'Dados inválidos';
          details = rawMessages.map((msg) => ({ field: '', message: msg }));
        }
      }

      return response.status(status).json({
        statusCode: status,
        error: HttpStatus[status] ?? 'Error',
        message,
        ...(details ? { details } : {}),
      });
    }

    // ── Prisma known errors ──
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      let status = HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Erro de banco de dados';

      if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Registro não encontrado';
      } else if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'Registro duplicado';
      } else if (exception.code === 'P2003') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Referência inválida';
      }

      this.logger.warn(`Prisma ${exception.code}: ${exception.message}`);
      return response.status(status).json({
        statusCode: status,
        error: HttpStatus[status] ?? 'Error',
        message,
      });
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      this.logger.warn(`Prisma validation error: ${exception.message}`);
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'BAD_REQUEST',
        message: 'Dados inválidos para consulta',
      });
    }

    // ── Unexpected errors ──
    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Erro interno do servidor',
    });
  }
}
