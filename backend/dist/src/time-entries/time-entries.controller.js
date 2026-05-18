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
exports.TimeEntriesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const time_entries_service_1 = require("./time-entries.service");
const create_time_entry_dto_1 = require("./dto/create-time-entry.dto");
const update_time_entry_dto_1 = require("./dto/update-time-entry.dto");
const start_timer_dto_1 = require("./dto/start-timer.dto");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let TimeEntriesController = class TimeEntriesController {
    timeEntriesService;
    constructor(timeEntriesService) {
        this.timeEntriesService = timeEntriesService;
    }
    getActive(user) {
        return this.timeEntriesService.getActiveTimer(user);
    }
    startTimer(dto, user) {
        return this.timeEntriesService.startTimer(dto, user);
    }
    findAll(user, userId, date, month, projectId, page, limit) {
        return this.timeEntriesService.findAll({ userId, date, month, projectId, page: page ? parseInt(page, 10) : 1, limit: limit ? parseInt(limit, 10) : 20 }, user);
    }
    create(dto, user) {
        return this.timeEntriesService.create(dto, user);
    }
    findOne(id, user) {
        return this.timeEntriesService.findOne(id, user);
    }
    update(id, dto, user) {
        return this.timeEntriesService.update(id, dto, user);
    }
    stopTimer(id, user) {
        return this.timeEntriesService.stopTimer(id, user);
    }
    remove(id, user) {
        return this.timeEntriesService.remove(id, user);
    }
};
exports.TimeEntriesController = TimeEntriesController;
__decorate([
    (0, common_1.Get)('active'),
    (0, swagger_1.ApiOperation)({ summary: 'Retornar timer ativo do usuário' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TimeEntriesController.prototype, "getActive", null);
__decorate([
    (0, common_1.Post)('start'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Iniciar timer' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [start_timer_dto_1.StartTimerDto, Object]),
    __metadata("design:returntype", void 0)
], TimeEntriesController.prototype, "startTimer", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar lançamentos' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'month', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'projectId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('userId')),
    __param(2, (0, common_1.Query)('date')),
    __param(3, (0, common_1.Query)('month')),
    __param(4, (0, common_1.Query)('projectId')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], TimeEntriesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Criar lançamento manual' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_time_entry_dto_1.CreateTimeEntryDto, Object]),
    __metadata("design:returntype", void 0)
], TimeEntriesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar lançamento por ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TimeEntriesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar lançamento' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_time_entry_dto_1.UpdateTimeEntryDto, Object]),
    __metadata("design:returntype", void 0)
], TimeEntriesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/stop'),
    (0, swagger_1.ApiOperation)({ summary: 'Parar timer' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TimeEntriesController.prototype, "stopTimer", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Excluir lançamento' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TimeEntriesController.prototype, "remove", null);
exports.TimeEntriesController = TimeEntriesController = __decorate([
    (0, swagger_1.ApiTags)('time-entries'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('time-entries'),
    __metadata("design:paramtypes", [time_entries_service_1.TimeEntriesService])
], TimeEntriesController);
//# sourceMappingURL=time-entries.controller.js.map