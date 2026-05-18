"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const bcrypt = __importStar(require("bcrypt"));
const adapter = new adapter_pg_1.PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminName = process.env.ADMIN_NAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminName || !adminPassword) {
        throw new Error('ADMIN_EMAIL, ADMIN_NAME e ADMIN_PASSWORD devem estar definidos no .env');
    }
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existing) {
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        await prisma.user.create({
            data: {
                name: adminName,
                email: adminEmail,
                passwordHash,
                role: 'admin',
                emailVerifiedAt: new Date(),
            },
        });
        console.log(`Admin criado: ${adminEmail}`);
    }
    else {
        console.log(`Admin já existe: ${adminEmail}`);
    }
    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
        await prisma.systemSettings.create({
            data: { id: 1, requireEmailVerification: true },
        });
        console.log('SystemSettings criado com padrões.');
    }
    else {
        console.log('SystemSettings já existe.');
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map