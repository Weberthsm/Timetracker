# TASK-003 — PrismaModule, PrismaService e Seed

## Objetivo
Criar o módulo global do Prisma e o script de seed que cria o admin inicial.

## Escopo

### `src/prisma/prisma.service.ts`
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}
```

### `src/prisma/prisma.module.ts`
- Módulo marcado como `@Global()`
- Exporta `PrismaService`
- Importado uma única vez em `AppModule`

### `src/app.module.ts`
- Importa `ConfigModule.forRoot({ isGlobal: true })` e `PrismaModule`
- Não importa outros módulos ainda (serão adicionados nas tarefas seguintes)

### `src/main.ts`
- Porta via `process.env.PORT ?? 3000`
- `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))`
- `app.enableCors()`

### `prisma/seed.ts`
Script idempotente que cria o admin inicial:
```typescript
// Lê ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD do .env
// Verifica se já existe usuário com ADMIN_EMAIL
// Se não existe: cria com role 'admin' e senha bcrypt
// Se existe: não faz nada (idempotente)
// Também cria SystemSettings com id=1 se não existir
```

### Configurar script de seed no `package.json`
```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

## Critérios de conclusão
- [ ] `npx prisma db seed` cria admin sem erro
- [ ] Executar seed duas vezes não duplica o admin
- [ ] `SystemSettings` com id=1 criado pelo seed
- [ ] `npm run start:dev` inicia o servidor na porta correta
