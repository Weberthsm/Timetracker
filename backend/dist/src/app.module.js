"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_module_1 = require("./prisma/prisma.module");
const mail_module_1 = require("./mail/mail.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const teams_module_1 = require("./teams/teams.module");
const projects_module_1 = require("./projects/projects.module");
const tasks_module_1 = require("./tasks/tasks.module");
const time_entries_module_1 = require("./time-entries/time-entries.module");
const reports_module_1 = require("./time-entries/reports.module");
const upload_module_1 = require("./upload/upload.module");
const settings_module_1 = require("./settings/settings.module");
const webhooks_module_1 = require("./webhooks/webhooks.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            event_emitter_1.EventEmitterModule.forRoot(),
            prisma_module_1.PrismaModule,
            mail_module_1.MailModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            teams_module_1.TeamsModule,
            projects_module_1.ProjectsModule,
            tasks_module_1.TasksModule,
            time_entries_module_1.TimeEntriesModule,
            reports_module_1.ReportsModule,
            upload_module_1.UploadModule,
            settings_module_1.SettingsModule,
            webhooks_module_1.WebhooksModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map