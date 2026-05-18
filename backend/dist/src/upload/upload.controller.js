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
exports.UploadController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const upload_service_1 = require("./upload.service");
const multer_config_1 = require("./multer.config");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let UploadController = class UploadController {
    uploadService;
    constructor(uploadService) {
        this.uploadService = uploadService;
    }
    uploadAvatar(file, userId, user) {
        return this.uploadService.uploadAvatar(file, userId ?? user.userId, user);
    }
    removeAvatar(userId, user) {
        return this.uploadService.removeAvatar(userId ?? user.userId, user);
    }
    uploadProjectLogo(file, id, user) {
        return this.uploadService.uploadProjectLogo(file, id, user);
    }
    removeProjectLogo(id, user) {
        return this.uploadService.removeProjectLogo(id, user);
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.Post)('avatar'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload de avatar do usuário' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', multer_config_1.multerConfig)),
    __param(0, (0, common_1.UploadedFile)(new common_1.ParseFilePipe({
        validators: [
            new common_1.MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
            new common_1.FileTypeValidator({ fileType: /(jpeg|jpg|png|webp)/ }),
        ],
    }))),
    __param(1, (0, common_1.Query)('userId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], UploadController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.Delete)('avatar'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Remover avatar do usuário' }),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UploadController.prototype, "removeAvatar", null);
__decorate([
    (0, common_1.Post)('projects/:id/logo'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload de logo do projeto' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', multer_config_1.multerConfig)),
    __param(0, (0, common_1.UploadedFile)(new common_1.ParseFilePipe({
        validators: [
            new common_1.MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
            new common_1.FileTypeValidator({ fileType: /(jpeg|jpg|png|webp)/ }),
        ],
    }))),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], UploadController.prototype, "uploadProjectLogo", null);
__decorate([
    (0, common_1.Delete)('projects/:id/logo'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Remover logo do projeto' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UploadController.prototype, "removeProjectLogo", null);
exports.UploadController = UploadController = __decorate([
    (0, swagger_1.ApiTags)('upload'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('upload'),
    __metadata("design:paramtypes", [upload_service_1.UploadService])
], UploadController);
//# sourceMappingURL=upload.controller.js.map