# TimeTracker — Backend

API REST do sistema de controle de horas, construída com NestJS e Prisma.

---

## Stack tecnológica

| Camada            | Tecnologia                        | Versão  |
|-------------------|-----------------------------------|---------|
| Framework         | NestJS                            | 11.x    |
| Linguagem         | TypeScript                        | 5.x     |
| ORM               | Prisma                            | 7.x     |
| Banco de dados    | PostgreSQL                        | 16.x    |
| Autenticação      | JWT (`@nestjs/jwt` + Passport)    | —       |
| Hash de senha     | bcrypt                            | 6.x     |
| E-mail            | Nodemailer                        | 8.x     |
| Upload de arquivos| Multer                            | 2.x     |
| Documentação API  | Swagger (`@nestjs/swagger`)       | 11.x    |
| Testes unitários  | Jest + jest-mock-extended         | 30.x    |
| Testes E2E de API | Jest + Supertest                  | 7.x     |
| Runtime           | Node.js                           | ≥ 20.x  |

---

## Pré-requisitos

- **Node.js** ≥ 20 — [nodejs.org](https://nodejs.org)
- **npm** ≥ 10 (incluso no Node.js)
- **Docker Desktop** — [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) *(recomendado para o banco)*
  - Alternativa: PostgreSQL 16 instalado diretamente na máquina

---

## Banco de dados com Docker (recomendado)

O projeto já inclui um `docker-compose.yml` na **raiz do repositório** que sobe o PostgreSQL 16 pronto para uso, sem precisar instalar o banco na máquina.

### Iniciar o contêiner

```bash
# Execute a partir da raiz do repositório (acompanhar-tarefas/)
docker compose up -d
```

| Parâmetro  | Valor         |
|------------|---------------|
| Host       | `localhost`   |
| Porta      | `5432`        |
| Usuário    | `timetracker` |
| Senha      | `timetracker` |
| Banco      | `timetracker` |

> A `DATABASE_URL` do `.env.example` já está pré-configurada para esses valores.

### Parar o contêiner

```bash
# também a partir da raiz
docker compose down
```

### Parar e apagar todos os dados

```bash
docker compose down -v
```

> O `-v` remove o volume `postgres_data`. Use apenas quando quiser recomeçar do zero.

### Ver logs do banco

```bash
docker compose logs -f postgres
```

---

## Banco de dados sem Docker

Se preferir usar um PostgreSQL já instalado na máquina, ajuste a variável `DATABASE_URL` no `.env` com as credenciais do seu servidor e garanta que o banco `timetracker` existe:

```sql
CREATE DATABASE timetracker;
```

---

## Instalação

```bash
cd backend
npm install
```

---

## Variáveis de ambiente

Crie o arquivo `.env` na pasta `backend/` com base no exemplo abaixo:

```env
# Banco de dados
DATABASE_URL=postgresql://usuario:senha@localhost:5432/timetracker

# JWT
JWT_SECRET=sua_chave_secreta_longa_e_aleatoria
JWT_EXPIRES_IN=15m

# Servidor
PORT=3000

# Usuário administrador inicial (criado via seed)
ADMIN_NAME=Administrador
ADMIN_EMAIL=admin@empresa.com
ADMIN_PASSWORD=SenhaForte@123

# E-mail (SMTP)
MAIL_HOST=smtp.seuprovedor.com
MAIL_PORT=587
MAIL_USER=seu@email.com
MAIL_PASS=sua_senha_smtp
MAIL_FROM="TimeTracker <no-reply@empresa.com>"

# URL do frontend (usado em links de e-mail)
APP_URL=http://localhost:5173
```

---

## Banco de dados

### Criar as tabelas (migrations)

```bash
npx prisma migrate dev
```

### Popular o banco com o admin inicial

```bash
npx prisma db seed
```

> O seed cria o usuário administrador usando as variáveis `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` do `.env`.

### Abrir o Prisma Studio (visualizador de dados)

```bash
npx prisma studio
```

---

## Executando a aplicação

```bash
# Desenvolvimento com hot-reload
npm run start:dev

# Modo debug
npm run start:debug

# Produção (requer build prévia)
npm run build
npm run start:prod
```

> A API estará disponível em `http://localhost:3000` (ou na porta configurada em `PORT`).

---

## Documentação da API (Swagger)

Com a aplicação rodando, acesse:

```
http://localhost:3000/api
```

O Swagger lista todos os endpoints, parâmetros, schemas e permite testar as requisições diretamente no browser.

---

## Testes

### Testes unitários

```bash
npm run test
```

### Testes unitários com cobertura

```bash
npm run test:cov
```

> Relatório gerado em `coverage/`.

### Testes E2E de API

```bash
npm run test:e2e
```

> Os testes E2E usam um banco de dados separado. Configure `DATABASE_URL` para um banco de teste no arquivo `test/.env.test` (se existir), ou use o banco padrão do `.env`.

### Modo watch (desenvolvimento)

```bash
npm run test:watch
```

---

## Estrutura do projeto

```
backend/
├── prisma/
│   ├── schema.prisma      # Fonte única de verdade do banco
│   ├── migrations/        # Histórico de migrations
│   └── seed.ts            # Script de seed do admin inicial
├── src/
│   ├── auth/              # Login, registro, JWT, refresh token
│   ├── users/             # CRUD de usuários, perfil, avatar
│   ├── teams/             # Equipes e membros
│   ├── projects/          # Projetos (status, logo)
│   ├── tasks/             # Tarefas por projeto
│   ├── time-entries/      # Lançamentos de horas e timer
│   ├── upload/            # Upload de imagens (avatar, logo)
│   ├── settings/          # Configurações do sistema
│   ├── webhooks/          # Webhooks e reenvio de entregas
│   ├── mail/              # Envio de e-mails via Nodemailer
│   ├── prisma/            # Módulo e serviço do Prisma
│   └── common/            # Guards, decorators, interceptors, DTOs
├── test/                  # Testes E2E com Supertest
└── resources/
    └── swagger.yaml       # Spec OpenAPI exportada
```

---

## Roles e permissões

| Ação                        | admin | manager | member |
|-----------------------------|:-----:|:-------:|:------:|
| Gerenciar equipes           | ✅    | ✅      | ❌     |
| Gerenciar projetos          | ✅    | ✅      | ❌     |
| Ver relatórios da equipe    | ✅    | ✅      | ❌     |
| Gerenciar tarefas           | ✅    | ✅      | ✅     |
| Registrar horas             | ✅    | ✅      | ✅     |
| Atualizar próprio avatar    | ✅    | ✅      | ✅     |
| Atualizar logo do projeto   | ✅    | ✅      | ❌     |
| Promover/rebaixar usuário   | ✅    | ❌      | ❌     |
| Configurações do sistema    | ✅    | ❌      | ❌     |
| Gerenciar webhooks          | ✅    | ❌      | ❌     |

---

## Comandos úteis

```bash
# Formatação de código
npm run format

# Lint com correção automática
npm run lint

# Gerar novo módulo NestJS
npx nest generate module nome-do-modulo
```
