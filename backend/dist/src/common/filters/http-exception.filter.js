"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    logger = new common_1.Logger(HttpExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            let message = exception.message;
            let details;
            if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                const resp = exceptionResponse;
                if (typeof resp['message'] === 'string') {
                    message = resp['message'];
                }
                if (Array.isArray(resp['message'])) {
                    const rawMessages = resp['message'];
                    message = 'Dados inválidos';
                    details = rawMessages.map((msg) => ({ field: '', message: msg }));
                }
            }
            return response.status(status).json({
                statusCode: status,
                error: common_1.HttpStatus[status] ?? 'Error',
                message,
                ...(details ? { details } : {}),
            });
        }
        if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            let message = 'Erro de banco de dados';
            if (exception.code === 'P2025') {
                status = common_1.HttpStatus.NOT_FOUND;
                message = 'Registro não encontrado';
            }
            else if (exception.code === 'P2002') {
                status = common_1.HttpStatus.CONFLICT;
                message = 'Registro duplicado';
            }
            else if (exception.code === 'P2003') {
                status = common_1.HttpStatus.BAD_REQUEST;
                message = 'Referência inválida';
            }
            this.logger.warn(`Prisma ${exception.code}: ${exception.message}`);
            return response.status(status).json({
                statusCode: status,
                error: common_1.HttpStatus[status] ?? 'Error',
                message,
            });
        }
        if (exception instanceof client_1.Prisma.PrismaClientValidationError) {
            this.logger.warn(`Prisma validation error: ${exception.message}`);
            return response.status(common_1.HttpStatus.BAD_REQUEST).json({
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                error: 'BAD_REQUEST',
                message: 'Dados inválidos para consulta',
            });
        }
        this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : String(exception));
        response.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Erro interno do servidor',
        });
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map