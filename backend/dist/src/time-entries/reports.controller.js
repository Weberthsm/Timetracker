"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const reports_service_1 = require("./reports.service");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let ReportsController = class ReportsController {
    reportsService;
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    getDailyReport(date, userId, user) {
        return this.reportsService.getDailyReport(date, userId, user);
    }
    getMonthlyReport(month, userId, user) {
        return this.reportsService.getMonthlyReport(month, userId, user);
    }
    getAllocationReport(granularity, value, user) {
        return this.reportsService.getAllocationReport(granularity, value, user);
    }
    getTeamReport(teamId, month, user) {
        return this.reportsService.getTeamReport(teamId, month, user);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('daily'),
    (0, swagger_1.ApiOperation)({ summary: 'Relatório diário de um usuário' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: true, description: 'YYYY-MM-DD' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: true }),
    __param(0, (0, common_1.Query)('date')),
    __param(1, (0, common_1.Query)('userId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getDailyReport", null);
__decorate([
    (0, common_1.Get)('monthly'),
    (0, swagger_1.ApiOperation)({ summary: 'Relatório mensal de um usuário' }),
    (0, swagger_1.ApiQuery)({ name: 'month', required: true, description: 'YYYY-MM' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: true }),
    __param(0, (0, common_1.Query)('month')),
    __param(1, (0, common_1.Query)('userId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getMonthlyReport", null);
__decorate([
    (0, common_1.Get)('allocation'),
    (0, swagger_1.ApiOperation)({ summary: 'Alocação por equipe e colaborador (admin/manager)' }),
    (0, swagger_1.ApiQuery)({ name: 'granularity', required: true, enum: ['day', 'month', 'year'] }),
    (0, swagger_1.ApiQuery)({ name: 'value', required: true, description: 'YYYY-MM-DD | YYYY-MM | YYYY' }),
    __param(0, (0, common_1.Query)('granularity')),
    __param(1, (0, common_1.Query)('value')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getAllocationReport", null);
__decorate([
    (0, common_1.Get)('team'),
    (0, swagger_1.ApiOperation)({ summary: 'Relatório mensal da equipe (admin/manager)' }),
    (0, swagger_1.ApiQuery)({ name: 'teamId', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'month', required: true, description: 'YYYY-MM' }),
    __param(0, (0, common_1.Query)('teamId')),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getTeamReport", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)('reports'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map