# TASK-001 — Setup do Projeto Backend

## Objetivo
Inicializar o projeto NestJS com todas as dependências e ferramentas de desenvolvimento configuradas.

## Escopo

### Criar projeto
```bash
npx @nestjs/cli new backend --package-manager npm --language typescript
```

### Instalar dependências de produção
```bash
npm install @nestjs/passport passport passport-jwt @nestjs/jwt
npm install @prisma/client bcrypt nodemailer multer uuid
npm install class-validator class-transformer
npm install @nestjs/swagger swagger-ui-express
npm install @nestjs/config
```

### Instalar dependências de desenvolvimento
```bash
npm install -D prisma
npm install -D @types/passport-jwt @types/bcrypt @types/nodemailer @types/multer @types/uuid
npm install -D jest-mock-extended
npm install -D eslint prettier eslint-config-prettier
```

### Configurar ESLint e Prettier
- `.eslintrc.js` com `@typescript-eslint` e regras padrão NestJS
- `.prettierrc` com `singleQuote: true`, `trailingComma: 'all'`, `printWidth: 100`

### Configurar tsconfig.json
- `strict: true`
- `paths` alias: `@/` → `src/`

### Criar arquivo `.env.example`
Incluir todas as variáveis listadas na seção 11 do plano (DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, PORT, NODE_ENV, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, MAIL_*, APP_URL).

### Criar `docker-compose.yml`
```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: timetracker
      POSTGRES_PASSWORD: timetracker
      POSTGRES_DB: timetracker
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
```

### Estrutura de pastas inicial
Criar as pastas vazias conforme seção 5 do plano:
`src/common/`, `src/config/`, `src/prisma/`, `src/auth/`, `src/mail/`, `src/users/`, `src/teams/`, `src/projects/`, `src/tasks/`, `src/time-entries/`, `src/upload/`, `src/settings/`, `src/webhooks/`, `test/`, `uploads/avatars/`, `uploads/logos/`, `resources/`

## Critérios de conclusão
- [ ] `npm run build` executa sem erros
- [ ] `npm run test` executa (sem specs ainda, mas framework ok)
- [ ] `docker-compose up` sobe PostgreSQL na porta 5432
- [ ] `src/` segue exatamente a estrutura de pastas do plano
