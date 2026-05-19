# Plano de Projeto — TimeTracker

## Visão Geral

Aplicação de controle de horas trabalhadas por projeto, com rastreamento em tempo real de atividades, relatórios diários e mensais por membro de equipe, e dashboard de percentual de alocação por projeto.

---

## 1. Stack Tecnológica

### Linguagem

**TypeScript** em toda a aplicação — backend e frontend. Não há arquivos `.js` no código-fonte; todo o projeto é escrito em `.ts` e `.vue` com `<script setup lang="ts">`.

A escolha garante tipagem estática de ponta a ponta: os tipos gerados pelo Prisma no backend descrevem exatamente o formato dos dados que chegam ao frontend, reduzindo erros de integração e facilitando o autocomplete em todo o projeto.

### Backend

| Tecnologia | Versão alvo | Papel |
|---|---|---|
| Node.js | 20 LTS | Runtime |
| TypeScript | 5.x | Linguagem |
| NestJS | 10.x | Framework HTTP |
| Prisma | 7.x | ORM + migrations |
| PostgreSQL | 16 | Banco de dados |
| Passport + JWT | — | Autenticação |
| Nodemailer | — | Envio de e-mail |
| Multer | — | Upload de arquivos |
| class-validator + class-transformer | — | Validação de DTOs |
| Swagger (OpenAPI) | — | Documentação da API |

### Frontend

| Tecnologia | Versão alvo | Papel |
|---|---|---|
| TypeScript | 5.x | Linguagem |
| Vue 3 | 3.x | Framework |
| Vite | 5.x | Bundler / dev server |
| Vue Router | 4.x | Roteamento |
| Pinia | 2.x | Gerenciamento de estado |
| Axios | — | HTTP client |
| Tailwind CSS | 3.x | Estilização |
| VeeValidate + Zod | — | Validação de formulários |
| Chart.js + vue-chartjs | — | Gráficos |
| date-fns | — | Manipulação de datas |
| Headless UI (Vue) | — | Componentes acessíveis |

### Ferramentas de desenvolvimento

| Ferramenta | Uso |
|---|---|
| ESLint + Prettier | Padronização de código |
| Husky + lint-staged | Hooks de pré-commit |
| Docker + Docker Compose | Ambiente de desenvolvimento (PostgreSQL) |
| dotenv | Gerenciamento de variáveis de ambiente |

### Testes

| Ferramenta | Camada | Uso |
|---|---|---|
| Jest | Backend | Framework de testes unitários (já incluso no NestJS) |
| @nestjs/testing | Backend | Criação de módulos isolados para testes de serviços e controllers |
| jest-mock-extended | Backend | Mock tipado do PrismaClient para testes sem banco real |
| Supertest | Backend | Testes de integração HTTP (e2e) |
| Vitest | Frontend | Framework de testes unitários nativo do Vite |
| @vue/test-utils | Frontend | Montagem e interação com componentes Vue |
| @testing-library/vue | Frontend | Testes orientados ao comportamento do usuário |
| msw (Mock Service Worker) | Frontend | Mock de chamadas HTTP nos testes de componentes |
| Playwright | Browser e2e | Testes de ponta a ponta através do browser — interage com o frontend como um usuário real |

---

## 2. Domínio e Entidades Principais

### Entidades

| Entidade | Descrição |
|---|---|
| **User** | Membro de equipe com acesso ao sistema |
| **Team** | Grupo de usuários |
| **Project** | Projeto ao qual horas são atribuídas |
| **Task** | Tarefa dentro de um projeto com status |
| **TimeEntry** | Registro de uma atividade: usuário + projeto + tarefa + duração |

### Relacionamentos

```
User ──── pertence a ──── Team
Team ──── participa de ──── Project
Project ──── contém ──── Task
User ──── registra ──── TimeEntry ──── associada a ──── Project
                                   └── associada a ──── Task (opcional)
```

---

## 3. Modelos de Dados (PostgreSQL + Prisma)

Os modelos abaixo são a referência conceitual. A implementação usa **Prisma Schema** como fonte única de verdade — o schema Prisma gera as migrations e os tipos TypeScript automaticamente.

### users
```prisma
model User {
  id                      String                    @id @default(uuid())
  name                    String                    @db.VarChar(150)
  email                   String                    @unique @db.VarChar(150)
  passwordHash            String
  role                    Role                      @default(member)
  avatarUrl               String?                   -- URL da foto de perfil (armazenada em disco/cloud)
  emailVerifiedAt         DateTime?                 -- null = e-mail ainda não confirmado
  teamId                  String?
  team                    Team?                     @relation(fields: [teamId], references: [id])
  timeEntries             TimeEntry[]
  emailVerificationTokens EmailVerificationToken[]
  passwordResetTokens     PasswordResetToken[]
  createdAt               DateTime                  @default(now())
  updatedAt               DateTime                  @updatedAt
}

enum Role {
  admin
  manager
  member
}
```

### teams
```prisma
model Team {
  id           String         @id @default(uuid())
  name         String         @db.VarChar(150)
  members      User[]
  teamProjects TeamProject[]
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt
}
```

### projects
```prisma
model Project {
  id           String        @id @default(uuid())
  name         String        @db.VarChar(150)
  description  String?
  color        String?       @db.VarChar(7)
  logoUrl      String?                      -- URL do logo do projeto (armazenado em disco/cloud)
  status       ProjectStatus @default(active)
  teamProjects TeamProject[]
  tasks        Task[]
  timeEntries  TimeEntry[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

enum ProjectStatus {
  active
  archived
}
```

### team_projects (N:N explícita)
```prisma
model TeamProject {
  teamId    String
  projectId String
  team      Team    @relation(fields: [teamId], references: [id])
  project   Project @relation(fields: [projectId], references: [id])

  @@id([teamId, projectId])
}
```

### tasks
```prisma
model Task {
  id          String      @id @default(uuid())
  projectId   String
  project     Project     @relation(fields: [projectId], references: [id])
  title       String      @db.VarChar(200)
  description String?
  status      TaskStatus  @default(todo)
  timeEntries TimeEntry[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

enum TaskStatus {
  todo
  in_progress
  done
  cancelled
}
```

### time_entries
```prisma
model TimeEntry {
  id           String    @id @default(uuid())
  userId       String
  user         User      @relation(fields: [userId], references: [id])
  projectId    String
  project      Project   @relation(fields: [projectId], references: [id])
  taskId       String?
  task         Task?     @relation(fields: [taskId], references: [id])
  description  String?
  startedAt    DateTime?              -- null quando durationOnly = true ou timer não iniciado
  endedAt      DateTime?              -- null = timer ainda ativo
  duration     Int?                   -- duração em segundos (calculada ao parar ou informada diretamente)
  durationOnly Boolean   @default(false) -- true = lançamento sem horário (apenas duração informada)
  date         DateTime  @db.Date    -- data de competência (informada pelo usuário; pode ser retroativa)
  createdAt    DateTime  @default(now()) -- data/hora de criação no sistema (gerada pelo servidor, imutável)
  updatedAt    DateTime  @updatedAt
}
```

> **Distinção importante:** `date` representa *quando o trabalho aconteceu* (controlada pelo usuário, base dos relatórios). `createdAt` representa *quando o lançamento foi feito no sistema* (imutável). Isso permite rastrear registros retroativos — ex: lançamento de segunda-feira feito na quinta-feira.

### email_verification_tokens
```prisma
model EmailVerificationToken {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  token     String   @unique  -- hash SHA-256; valor puro enviado apenas no e-mail
  expiresAt DateTime           -- válido por 24 horas
  createdAt DateTime @default(now())
}
```

### password_reset_tokens
```prisma
model PasswordResetToken {
  id        String    @id @default(uuid())
  userId    String
  user      User      @relation(fields: [userId], references: [id])
  token     String    @unique  -- hash SHA-256; valor puro enviado apenas no e-mail
  expiresAt DateTime            -- válido por 1 hora
  usedAt    DateTime?           -- preenchido ao ser consumido; null = ainda válido
  createdAt DateTime  @default(now())
}
```

### system_settings (singleton)
```prisma
model SystemSettings {
  id                       Int      @id @default(1)
  requireEmailVerification Boolean  @default(true)
  allowTimesMode           Boolean  @default(true)   -- habilita modo Início/Fim no formulário de lançamento
  allowStartDurationMode   Boolean  @default(true)   -- habilita modo Início + Duração
  allowDurationOnlyMode    Boolean  @default(false)  -- habilita modo Apenas Duração (sem horário)
  updatedAt                DateTime @updatedAt
  updatedBy                String?  -- userId do admin que fez a última alteração
}
```

### webhook_destinations
```prisma
model WebhookDestination {
  id         String            @id @default(uuid())
  name       String            @db.VarChar(150)
  url        String
  secret     String?           -- segredo HMAC para assinatura do payload
  events     String[]          -- ex: ["timer.stopped", "time_entry.created"]
  isActive   Boolean           @default(true)
  createdBy  String
  createdAt  DateTime          @default(now())
  updatedAt  DateTime          @updatedAt
  deliveries WebhookDelivery[]
}
```

### webhook_deliveries
```prisma
model WebhookDelivery {
  id                   String             @id @default(uuid())
  webhookDestinationId String
  destination          WebhookDestination @relation(fields: [webhookDestinationId], references: [id])
  event                String
  payload              Json
  statusCode           Int?
  responseBody         String?
  attempt              Int      @default(1) -- até 3 tentativas com backoff exponencial
  success              Boolean
  deliveredAt          DateTime @default(now())
}
```

**Eventos disponíveis para assinatura:**

| Evento | Disparado quando |
|---|---|
| `time_entry.created` | Lançamento manual criado |
| `time_entry.updated` | Lançamento editado |
| `time_entry.deleted` | Lançamento removido |
| `timer.started` | Timer iniciado |
| `timer.stopped` | Timer parado |
| `report.daily` | Acionado manualmente pelo admin |
| `report.monthly` | Acionado manualmente pelo admin |

Segurança: header `X-TimeTracker-Signature: sha256=<hmac>` em cada entrega quando `secret` configurado. Retry: 3 tentativas com backoff de 1 min, 5 min e 15 min.

---

## 4. Histórias de Usuário

---

**US-01 — Cadastro de usuário**
Como novo membro de equipe
Quero me cadastrar no sistema informando meu nome, e-mail e senha
Para ter acesso à plataforma e começar a registrar minhas horas

Regras de negócio:
- E-mail único; senha mínimo 8 caracteres; nome obrigatório (2–150 chars)
- Role padrão: `member`; senha armazenada como hash bcrypt
- Após cadastro: `emailVerifiedAt` fica nulo e e-mail de confirmação é enviado
- Se `requireEmailVerification` ativo: login bloqueado até confirmar e-mail (HTTP 403)
- Se `requireEmailVerification` desativado: login liberado mesmo sem confirmar

Critérios de aceite:
```gherkin
Scenario: Cadastro com sucesso
  Given que acesso a tela de cadastro
  When preencho nome, e-mail válido e senha com mínimo 8 caracteres
  Then conta criada com role "member" e emailVerifiedAt nulo
  And recebo e-mail de confirmação
  And sou redirecionado para tela de aviso

Scenario: Login sem confirmar e-mail (verificação ativa)
  Given que me cadastrei e não confirmei o e-mail
  And requireEmailVerification está ativo
  When tento fazer login
  Then recebo HTTP 403 com orientação para verificar e-mail

Scenario: Login sem confirmar e-mail (verificação desativada)
  Given que requireEmailVerification foi desativado pelo admin
  When faço login com credenciais corretas
  Then acesso é concedido normalmente

Scenario: E-mail já cadastrado
  When tento me cadastrar com e-mail existente
  Then recebo HTTP 409 "E-mail já cadastrado"

Scenario: Senha fraca
  When preencho senha com menos de 8 caracteres
  Then recebo HTTP 422 com mensagem sobre mínimo de caracteres
```

---

**US-02 — Login de usuário**
Como usuário cadastrado
Quero fazer login com meu e-mail e senha
Para acessar minhas informações e funcionalidades da plataforma

Regras de negócio:
- Falha retorna mensagem genérica "Credenciais inválidas" (sem especificar qual campo)
- Sucesso retorna JWT com validade de 15 minutos contendo `userId`, `email` e `role`
- Token expirado ou inválido retorna HTTP 401

Critérios de aceite:
```gherkin
Scenario: Login válido
  When informo e-mail e senha corretos
  Then recebo token JWT e sou redirecionado ao Dashboard

Scenario: Senha incorreta
  When informo senha errada
  Then recebo HTTP 401 "Credenciais inválidas"

Scenario: Acesso sem token
  When acesso rota protegida sem autenticação
  Then recebo HTTP 401 e sou redirecionado ao login
```

---

**US-03 — Cadastro de equipe**
Como administrador ou gerente
Quero criar e gerenciar equipes
Para organizar os membros por grupo de trabalho

Regras de negócio:
- Apenas `admin` ou `manager` podem criar, editar e excluir equipes
- Nome obrigatório e único no sistema
- Usuário pertence a apenas uma equipe por vez
- Excluir equipe desvincula membros (não os exclui)

Critérios de aceite:
```gherkin
Scenario: Criação com sucesso
  Given autenticado como admin ou manager
  When crio equipe com nome único
  Then equipe aparece na listagem

Scenario: Nome duplicado
  When crio equipe com nome já existente
  Then recebo HTTP 409

Scenario: Membro tenta criar equipe
  Given autenticado como member
  When tento criar equipe
  Then recebo HTTP 403
```

---

**US-04 — Associação de equipe a projeto**
Como administrador ou gerente
Quero vincular equipes a projetos
Para controlar quem pode registrar horas em cada projeto

Regras de negócio:
- Apenas `admin` e `manager` vinculam/desvinculam equipes
- Projeto pode ter múltiplas equipes; equipe pode estar em múltiplos projetos
- Membros só registram horas em projetos da sua equipe
- Desvincular não apaga registros anteriores

Critérios de aceite:
```gherkin
Scenario: Vinculação com sucesso
  When vinculo "Mobile Team" ao projeto "App Mobile"
  Then membros da equipe passam a ver o projeto

Scenario: Registro em projeto sem vínculo
  Given minha equipe não está vinculada ao projeto
  When tento registrar horas nele
  Then recebo HTTP 403
```

---

**US-05 — Cadastro de projeto**
Como administrador ou gerente
Quero cadastrar projetos com nome, descrição e cor
Para organizar o trabalho e identificar projetos visualmente

Regras de negócio:
- Apenas `admin` e `manager` criam, editam e arquivam
- Nome obrigatório; cor opcional (hex válido ex: `#3B82F6`)
- Projetos arquivados não aceitam novos lançamentos
- Projetos não são excluídos — apenas arquivados

Critérios de aceite:
```gherkin
Scenario: Criação com sucesso
  When crio projeto com nome e cor válida
  Then projeto criado com status "active"

Scenario: Lançamento em projeto arquivado
  When registro horas em projeto arquivado
  Then recebo HTTP 422

Scenario: Cor inválida
  When informo cor "azul" em vez de hex
  Then recebo HTTP 422
```

---

**US-06 — Cadastro de tarefas**
Como qualquer usuário autenticado
Quero criar tarefas dentro de um projeto
Para organizar atividades e associar lançamentos a tarefas específicas

Regras de negócio:
- Qualquer usuário com acesso ao projeto pode criar tarefas
- Status inicial: `todo`; status disponíveis: `todo`, `in_progress`, `done`, `cancelled`
- Apenas `admin` e `manager` excluem tarefas
- Tarefas `done` ou `cancelled` não aceitam novos lançamentos

Critérios de aceite:
```gherkin
Scenario: Criação com sucesso
  When crio tarefa com título
  Then tarefa criada com status "todo"

Scenario: Lançamento em tarefa concluída
  When registro horas em tarefa "done"
  Then recebo HTTP 422

Scenario: Membro tenta excluir tarefa
  When tento excluir tarefa como member
  Then recebo HTTP 403
```

---

**US-07 — Atualização de status da tarefa**
Como qualquer usuário autenticado
Quero atualizar o status de uma tarefa
Para refletir o progresso real do trabalho

Regras de negócio:
- Qualquer membro com acesso pode alterar status
- Tarefa `cancelled` só pode ser reativada por `admin` ou `manager`
- `updatedAt` registrado a cada mudança

Critérios de aceite:
```gherkin
Scenario: Atualização com sucesso
  When altero status de "todo" para "in_progress"
  Then status atualizado e updatedAt registrado

Scenario: Member reativa tarefa cancelada
  When tento alterar status de tarefa "cancelled" como member
  Then recebo HTTP 403
```

---

**US-08 — Registro de atividade via timer**
Como membro de equipe
Quero iniciar um cronômetro ao começar a trabalhar
Para registrar automaticamente o tempo gasto

Regras de negócio:
- Projeto obrigatório ao iniciar; tarefa e descrição opcionais
- Apenas um timer ativo por usuário; segundo timer retorna HTTP 422
- Duração calculada pelo backend (endedAt − startedAt)
- `date` preenchida com data atual do servidor
- Timer ativo há mais de 24h sinalizado no frontend

Critérios de aceite:
```gherkin
Scenario: Iniciar timer com sucesso
  Given sem timer ativo
  When seleciono projeto e inicio
  Then TimeEntry criado com endedAt nulo e cronômetro na topbar

Scenario: Segundo timer
  Given já tenho timer ativo
  When inicio outro
  Then recebo HTTP 422

Scenario: Parar timer
  Given timer iniciado às 09:00
  When paro às 10:30
  Then duração calculada: 5400 segundos (1h30min)
```

---

**US-09 — Registro manual de atividade**
Como membro de equipe
Quero registrar manualmente uma atividade escolhendo como quero informar o tempo
Para lançar horas de atividades passadas ou quando não usei o timer

Regras de negócio:
- Campo sempre obrigatório: projeto e data
- Três modos de entrada, habilitados individualmente pelo admin (US-22):
  - **Início / Fim**: informar hora de início e hora de fim (modo padrão)
  - **Início + Duração**: informar hora de início e duração em horas/minutos (fim calculado automaticamente)
  - **Apenas Duração**: informar somente o tempo total sem nenhum horário (`durationOnly = true`)
- Quando apenas um modo está ativo, toggle não exibido — formulário direto
- Fim deve ser posterior ao início (HTTP 422 se não); regra não se aplica ao modo Apenas Duração
- Duração mínima: 60 segundos em qualquer modo
- `date` = data informada pelo usuário (pode ser retroativa); `createdAt` = gerado pelo servidor
- Datas futuras bloqueadas no frontend
- Data anterior a hoje: aviso visual não bloqueante no frontend

Critérios de aceite:
```gherkin
Scenario: Registro modo Início/Fim com sucesso
  When informo projeto, data de hoje, início 14:00 e fim 16:00
  Then TimeEntry criado com duração 7200 segundos, startedAt e endedAt preenchidos

Scenario: Registro modo Início + Duração
  When informo início 09:00 e duração 1h 30min
  Then TimeEntry criado com endedAt 10:30 e duration 5400

Scenario: Registro modo Apenas Duração
  When informo apenas 2h 30min sem horário
  Then TimeEntry criado com durationOnly true, duration 9000, startedAt null, endedAt null

Scenario: Data retroativa exibe aviso
  When seleciono data anterior a hoje
  Then exibe aviso "Você está registrando horas em uma data anterior a hoje"
  And botão salvar permanece habilitado

Scenario: Fim anterior ao início (modo Início/Fim)
  When informo início 16:00 e fim 14:00
  Then recebo HTTP 422

Scenario: Duração abaixo do mínimo
  When informo 0 horas e 0 minutos
  Then botão salvar desabilitado e mensagem "Informe ao menos 1 minuto"
```

---

**US-10 — Edição e exclusão de lançamento**
Como membro de equipe
Quero editar ou excluir um lançamento que fiz
Para corrigir erros de preenchimento

Regras de negócio:
- Usuário edita/exclui apenas seus próprios lançamentos
- `admin` e `manager` podem editar/excluir de qualquer membro
- Timer ativo não pode ser editado — deve ser parado primeiro
- Exclusão permanente; `createdAt` nunca pode ser alterado

Critérios de aceite:
```gherkin
Scenario: Edição própria com sucesso
  When edito descrição do lançamento
  Then lançamento atualizado, updatedAt refletido, createdAt inalterado

Scenario: Editar lançamento de outro membro
  Given autenticado como member
  When tento editar lançamento de outro usuário
  Then recebo HTTP 403

Scenario: Editar timer ativo
  When tento editar timer em andamento
  Then recebo HTTP 422
```

---

**US-11 — Relatório diário**
Como membro de equipe ou gestor
Quero visualizar o tempo gasto por projeto no dia
Para acompanhar minha alocação diária

Regras de negócio:
- Exibe: projeto, total de horas, percentual do dia
- `member` vê apenas seu próprio relatório; `admin`/`manager` veem qualquer usuário
- Lista atividades individuais com descrição, horário e duração
- Dia sem lançamentos: resposta vazia (não erro)

Critérios de aceite:
```gherkin
Scenario: Relatório próprio com dados
  When acesso meu relatório diário
  Then vejo distribuição por projeto com percentuais e lista de atividades

Scenario: Gestor vê relatório de outro membro
  Given autenticado como manager
  When acesso relatório de outro usuário
  Then vejo normalmente

Scenario: Member acessa relatório de outro
  When tento acessar relatório de outro usuário como member
  Then recebo HTTP 403

Scenario: Dia sem lançamentos
  When acesso relatório de dia sem dados
  Then recebo resposta vazia (não 404)
```

---

**US-12 — Relatório mensal**
Como membro de equipe ou gestor
Quero visualizar o tempo total por projeto no mês
Para entender minha distribuição de esforço

Regras de negócio:
- Exibe: projeto, total de horas, percentual do mês
- Comparativo de horas por dia do mês
- `member` vê apenas o próprio; `admin`/`manager` veem qualquer usuário

Critérios de aceite:
```gherkin
Scenario: Relatório com dados
  When acesso relatório mensal de maio/2026
  Then vejo totais por projeto e detalhamento diário

Scenario: Mês sem lançamentos
  When acesso mês sem dados
  Then resposta vazia (não erro)
```

---

**US-13 — Relatório de equipe**
Como administrador ou gerente
Quero o relatório mensal consolidado de toda a equipe
Para identificar desequilíbrios de alocação

Regras de negócio:
- Apenas `admin` e `manager` acessam
- Exibe: membro, total de horas, distribuição percentual por projeto
- Membros sem lançamentos aparecem com 0 horas

Critérios de aceite:
```gherkin
Scenario: Relatório com sucesso
  Given autenticado como manager
  When acesso relatório da equipe para um mês
  Then vejo todos os membros com horas e percentuais

Scenario: Membro sem lançamentos
  Then aparece com 0 horas (não omitido)

Scenario: Member acessa relatório de equipe
  Then recebo HTTP 403
```

---

**US-14 — Foto de perfil do usuário**
Como usuário autenticado
Quero fazer upload de uma foto de perfil
Para ser reconhecido visualmente pelos colegas

Regras de negócio:
- Qualquer usuário atualiza o próprio avatar; `admin` atualiza de qualquer usuário
- Formatos: JPEG, PNG, WebP; tamanho máximo: 2 MB
- Dimensão recomendada: **400 × 400 px** (1:1) — dica exibida no frontend
- Imagens fora do quadrado: recorte centralizado (`object-fit: cover`)
- Upload substitui e exclui o arquivo anterior
- `avatarUrl` nulo → frontend exibe iniciais do nome como fallback

Critérios de aceite:
```gherkin
Scenario: Upload com sucesso
  When envio imagem JPEG de 1 MB
  Then avatarUrl atualizado e URL pública retornada

Scenario: Formato inválido
  When envio PDF
  Then recebo HTTP 422

Scenario: Arquivo acima do limite
  When envio imagem de 5 MB
  Then recebo HTTP 422

Scenario: Remoção
  When envio DELETE /upload/avatar
  Then avatarUrl volta a null e arquivo excluído
```

---

**US-15 — Logo do projeto**
Como administrador ou gerente
Quero adicionar um logo ao projeto
Para identificação visual em listagens e relatórios

Regras de negócio:
- Apenas `admin` e `manager`; formatos: JPEG, PNG, WebP; máximo: 2 MB
- Dimensão recomendada: **400 × 400 px** (1:1)
- Upload substitui e exclui o anterior
- `logoUrl` nulo → frontend exibe cor do projeto como fallback

Critérios de aceite:
```gherkin
Scenario: Upload com sucesso
  Given autenticado como admin ou manager
  When envio imagem PNG de 500 KB
  Then logoUrl atualizado e URL retornada

Scenario: Member tenta fazer upload
  Then recebo HTTP 403

Scenario: Remoção
  When envio DELETE /upload/projects/:id/logo
  Then logoUrl volta a null
```

---

**US-16 — Promoção de role de usuário**
Como administrador
Quero alterar o role de um usuário
Para conceder ou revogar permissões sem recriar a conta

Regras de negócio:
- Apenas `admin` altera roles; roles disponíveis: `member`, `manager`, `admin`
- Admin não pode rebaixar a si mesmo
- Token atual continua válido até expirar; novo role refletido na renovação

Critérios de aceite:
```gherkin
Scenario: Promoção com sucesso
  When envio PATCH /users/:id/role com { "role": "manager" }
  Then role atualizado e updatedAt registrado

Scenario: Admin rebaixa a si mesmo
  Then recebo HTTP 422

Scenario: Manager tenta alterar role
  Then recebo HTTP 403

Scenario: Role inválido
  When envio role "superuser"
  Then recebo HTTP 422
```

---

**US-17 — Recuperação de senha**
Como usuário cadastrado
Quero solicitar recuperação da senha pelo e-mail
Para recuperar o acesso caso esqueça a senha

Regras de negócio:
- Rota pública; resposta sempre genérica (não revela se e-mail existe)
- Token válido por 1 hora, uso único, armazenado como hash SHA-256
- Nova solicitação invalida tokens anteriores pendentes
- Nova senha: mínimo 8 caracteres

Critérios de aceite:
```gherkin
Scenario: Solicitação com e-mail cadastrado
  When envio POST /auth/forgot-password
  Then recebo HTTP 200 com mensagem genérica
  And e-mail enviado com link válido por 1 hora

Scenario: E-mail não cadastrado
  Then recebo mesmo HTTP 200 (sem revelar ausência)

Scenario: Redefinição com token válido
  When uso o link e envio nova senha
  Then senha atualizada e token marcado como usado

Scenario: Token expirado
  Then recebo HTTP 422

Scenario: Token já usado
  Then recebo HTTP 422
```

---

**US-18 — Confirmação de e-mail**
Como usuário recém-cadastrado
Quero confirmar meu e-mail clicando no link recebido
Para validar que tenho acesso ao e-mail antes de usar a plataforma

Regras de negócio:
- E-mail enviado automaticamente após cadastro
- Token válido por 24 horas, uso único, hash SHA-256
- Com `requireEmailVerification` ativo: login bloqueado até confirmar
- Com `requireEmailVerification` desativado: confirmação opcional, e-mail ainda enviado
- Reenvio com rate limit de 1 por minuto; resposta sempre genérica

Critérios de aceite:
```gherkin
Scenario: Confirmação com token válido
  When acesso link dentro de 24h
  Then emailVerifiedAt preenchido e login liberado

Scenario: Token expirado
  Then recebo HTTP 422 com orientação para reenvio

Scenario: Reenvio
  When solicito reenvio
  Then recebo mensagem genérica e novo token enviado

Scenario: Rate limit no reenvio
  When solicito novo reenvio em menos de 1 minuto
  Then recebo HTTP 429

Scenario: Token já usado
  When uso link novamente
  Then recebo HTTP 422
```

---

**US-19 — Configurações do sistema**
Como administrador
Quero acessar e alterar as configurações globais da plataforma
Para adaptar o comportamento sem reiniciar o servidor

Regras de negócio:
- `GET /settings`: aberto a todos os usuários autenticados (para que o formulário de lançamento saiba quais modos exibir)
- `PATCH /settings`: restrito a `admin`
- Alterações em tempo real sem reinicialização
- Toda alteração registra `updatedAt` e `updatedBy`
- Ao menos um modo de entrada de horas deve estar habilitado

| Configuração | Tipo | Padrão | Descrição |
|---|---|---|---|
| `requireEmailVerification` | boolean | `true` | Quando `false`, login liberado sem confirmar e-mail |
| `allowTimesMode` | boolean | `true` | Habilita modo Início/Fim no formulário de lançamento |
| `allowStartDurationMode` | boolean | `true` | Habilita modo Início + Duração |
| `allowDurationOnlyMode` | boolean | `false` | Habilita modo Apenas Duração (sem horário) |

Critérios de aceite:
```gherkin
Scenario: Consulta das configurações (admin)
  Given autenticado como admin
  When acesso GET /settings
  Then recebo todas as configurações incluindo os modos de entrada

Scenario: Consulta das configurações (member/manager)
  Given autenticado como member
  When acesso GET /settings
  Then recebo as configurações normalmente (sem 403)

Scenario: Desativar verificação de e-mail
  When envio PATCH /settings com { "requireEmailVerification": false }
  Then configuração atualizada imediatamente

Scenario: Habilitar modo Apenas Duração
  When envio PATCH /settings com { "allowDurationOnlyMode": true }
  Then modal de lançamento passa a exibir a opção "Apenas Duração"

Scenario: Tentar desabilitar todos os modos
  When envio PATCH /settings com todos os modos false
  Then botão Salvar fica desabilitado no frontend

Scenario: Não-admin tenta alterar settings
  Then recebo HTTP 403
```

---

**US-20 — Webhooks: integração com sistemas externos**
Como administrador
Quero configurar múltiplos destinos de webhook com URLs e eventos específicos
Para enviar dados de horas e alocação automaticamente a sistemas externos

Regras de negócio:
- Apenas `admin` gerencia webhooks
- Múltiplos destinos ativos recebem payload simultaneamente
- Payload inclui: usuário, projeto, tarefa, duração em segundos, duração formatada, percentual do dia
- Assinatura HMAC-SHA256 via `X-TimeTracker-Signature` quando `secret` configurado
- Retry: 3 tentativas (1 min, 5 min, 15 min); histórico em `webhook_deliveries`
- Endpoint de teste envia payload fictício antes de ativar

Critérios de aceite:
```gherkin
Scenario: Cadastrar destino com sucesso
  When envio POST /webhooks com url, eventos e secret
  Then destino criado e passa a receber payloads

Scenario: Múltiplos destinos
  Given dois destinos inscritos no mesmo evento
  When evento ocorre
  Then payload enviado a ambos com entregas registradas individualmente

Scenario: Payload com percentual e horas formatadas
  Given timer parado após 1h30min
  Then payload contém duration: 5400, durationFormatted: "1h 30min" e projectPercentageOfDay

Scenario: Retry em falha
  Given destino retornou HTTP 500
  Then segunda tentativa após 1 min, terceira após 5 min, marcado como falha após 3 tentativas

Scenario: Não-admin tenta criar webhook
  Then recebo HTTP 403
```

---

**US-21 — Relatório de alocação por equipe e colaborador**
Como administrador ou gerente
Quero visualizar quanto cada equipe e cada colaborador trabalhou em cada projeto
Para identificar distribuição de esforço e alocação percentual

Regras de negócio:
- Apenas `admin` e `manager` acessam
- Três granularidades: `day` (YYYY-MM-DD), `month` (YYYY-MM), `year` (YYYY)
- Exibe duas visões em abas: **Por Equipe** e **Por Colaborador**
- Para cada entidade (equipe ou membro): total de horas + barra de progresso por projeto com percentual
- Equipes/membros sem lançamentos no período aparecem com 0h (não omitidos)
- Lançamentos `durationOnly` são incluídos normalmente (somados pelo campo `duration`)
- Percentuais calculados em relação ao total da própria entidade (não do período inteiro)

Critérios de aceite:
```gherkin
Scenario: Relatório mensal por colaborador
  Given autenticado como manager
  When acesso GET /reports/allocation?granularity=month&value=2026-05
  Then recebo lista de membros com totalSeconds, totalFormatted e byProject com percentuais

Scenario: Relatório diário por equipe
  When acesso com granularity=day&value=2026-05-18
  Then recebo lista de equipes com distribuição por projeto no dia

Scenario: Relatório anual
  When acesso com granularity=year&value=2026
  Then recebo totais do ano inteiro

Scenario: Membro acessa relatório de alocação
  Then recebo HTTP 403

Scenario: Período sem lançamentos
  Then equipes e membros aparecem com totalSeconds 0 e byProject vazio
```

---

**US-22 — Configuração dos modos de entrada de horas**
Como administrador
Quero controlar quais modos de entrada de horas ficam disponíveis no formulário
Para adaptar a experiência ao fluxo de trabalho da equipe

Regras de negócio:
- Três modos configuráveis independentemente: Início/Fim, Início+Duração, Apenas Duração
- Ao menos um deve estar habilitado; frontend bloqueia salvar se todos desabilitados
- Formulário de lançamento mostra toggle apenas quando 2+ modos estão ativos
- Se apenas 1 modo ativo: toggle não exibido, formulário entra direto no modo habilitado
- Alteração reflete imediatamente para todos os usuários logados (store recarregada ao salvar)

Critérios de aceite:
```gherkin
Scenario: Admin desabilita Início/Fim e Início+Duração
  When salva com apenas allowDurationOnlyMode true
  Then formulário de lançamento exibe apenas campos Horas + Minutos sem toggle

Scenario: Todos os modos habilitados
  When abre modal de novo lançamento
  Then toggle com 3 opções visível

Scenario: Editar lançamento durationOnly com modo habilitado
  When abre edição de lançamento com durationOnly true
  Then modal abre no modo "Apenas Duração" com horas/minutos pré-preenchidos

Scenario: Editar lançamento durationOnly com modo desabilitado
  When allowDurationOnlyMode false mas lançamento existe como durationOnly
  Then modal abre no primeiro modo disponível
```

---

## 5. Arquitetura do Backend (NestJS)

### Estrutura de Pastas

```
src/
├── main.ts
├── app.module.ts
├── config/jwt.config.ts
├── prisma/
│   ├── schema.prisma         (fonte única de verdade)
│   ├── migrations/
│   ├── seed.ts               (cria admin inicial via .env)
│   ├── prisma.module.ts      (módulo global)
│   └── prisma.service.ts     (wrapper com lifecycle hooks)
├── common/
│   ├── guards/jwt-auth.guard.ts
│   ├── decorators/current-user.decorator.ts
│   ├── filters/http-exception.filter.ts
│   └── interceptors/response.interceptor.ts
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts + auth.controller.spec.ts
│   ├── auth.service.ts + auth.service.spec.ts
│   ├── strategies/jwt.strategy.ts
│   └── dto/ (login, register, forgot-password, reset-password)
├── mail/
│   ├── mail.module.ts
│   └── mail.service.ts       (Nodemailer + SMTP)
├── users/  (module, controller+spec, service+spec, dto/)
├── teams/  (mesma estrutura)
├── projects/ (mesma estrutura)
├── tasks/ (mesma estrutura)
├── time-entries/ (mesma estrutura)
├── upload/
│   ├── upload.module.ts
│   ├── upload.controller.ts
│   ├── upload.service.ts
│   └── multer.config.ts
├── settings/
│   ├── settings.module.ts
│   ├── settings.controller.ts
│   └── settings.service.ts
└── webhooks/
    ├── webhooks.module.ts
    ├── webhooks.controller.ts
    ├── webhooks.service.ts
    ├── webhooks.dispatcher.ts  (ouve eventos internos, envia a destinos ativos)
    └── dto/

test/                          (e2e — Jest + Supertest)
├── auth.e2e-spec.ts
├── time-entries.e2e-spec.ts
└── jest-e2e.json

uploads/avatars/
uploads/logos/
resources/swagger.yaml
README.md
```

### Bootstrap do Primeiro Admin

```bash
# 1. Configurar no .env: ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD
npx prisma migrate dev    # cria tabelas
npx prisma db seed        # cria admin inicial (idempotente)
# 2. Admin faz login e promove membros via PATCH /users/:id/role
```

### Middleware e Autenticação

- JWT via `@nestjs/passport` + `passport-jwt`
- Guard global `JwtAuthGuard`; rotas públicas com decorator `@Public()`
- Token: `{ sub: userId, email, role }` — validade 15min
- Rotas públicas: login, register, forgot-password, verify-email, resend-verification, api-docs

### Regras de Autorização por Role

| Ação | admin | manager | member |
|---|---|---|---|
| Gerenciar equipes | ✅ | ✅ | ❌ |
| Gerenciar projetos | ✅ | ✅ | ❌ |
| Ver relatórios da equipe | ✅ | ✅ | ❌ |
| Gerenciar tarefas | ✅ | ✅ | ✅ |
| Registrar horas | ✅ | ✅ | ✅ |
| Ver próprios registros | ✅ | ✅ | ✅ |
| Atualizar próprio avatar | ✅ | ✅ | ✅ |
| Atualizar logo do projeto | ✅ | ✅ | ❌ |
| Promover/rebaixar role | ✅ | ❌ | ❌ |
| Configurações do sistema | ✅ | ❌ | ❌ |
| Gerenciar webhooks | ✅ | ❌ | ❌ |

---

## 6. Endpoints da API

### Auth
```
POST /auth/register
POST /auth/login
POST /auth/refresh            (fase 2)
GET  /auth/me
POST /auth/verify-email
POST /auth/resend-verification
POST /auth/forgot-password
POST /auth/reset-password
```

### Users
```
GET    /users
GET    /users/:id
PATCH  /users/:id
DELETE /users/:id
PATCH  /users/:id/role
```

### Upload
```
POST   /upload/avatar
DELETE /upload/avatar
POST   /upload/projects/:id/logo
DELETE /upload/projects/:id/logo
```

### Teams
```
GET/POST         /teams
GET/PATCH/DELETE /teams/:id
POST             /teams/:id/members
DELETE           /teams/:id/members/:userId
```

### Projects
```
GET/POST            /projects
GET/PATCH/DELETE    /projects/:id
POST/DELETE         /projects/:id/teams/:teamId
```

### Tasks
```
GET/POST            /projects/:projectId/tasks
GET/PATCH/DELETE    /projects/:projectId/tasks/:id
```

### Time Entries
```
GET/POST/PATCH/DELETE /time-entries (+ GET /:id)
GET   /time-entries/active
POST  /time-entries/start
PATCH /time-entries/:id/stop
```

### Reports
```
GET /reports/daily?date=YYYY-MM-DD&userId=...
GET /reports/monthly?month=YYYY-MM&userId=...
GET /reports/team?teamId=...&month=YYYY-MM
GET /reports/allocation?granularity=day|month|year&value=YYYY-MM-DD|YYYY-MM|YYYY
```

### Settings
```
GET   /settings
PATCH /settings
```

### Webhooks
```
GET/POST           /webhooks
GET/PATCH/DELETE   /webhooks/:id
POST               /webhooks/:id/test
GET                /webhooks/:id/deliveries
POST               /webhooks/:id/deliveries/:did/retry
```

### Swagger
```
GET /api-docs
GET /api-docs-json
```

### Payload de Webhook (exemplo)
```json
{
  "event": "timer.stopped",
  "occurredAt": "2026-05-14T10:30:00Z",
  "data": {
    "timeEntry": {
      "id": "uuid",
      "user": { "id": "uuid", "name": "João Silva", "email": "joao@empresa.com" },
      "project": { "id": "uuid", "name": "App Mobile" },
      "task": { "id": "uuid", "title": "Desenvolver tela de login" },
      "description": "Implementação do fluxo de autenticação",
      "date": "2026-05-14",
      "startedAt": "2026-05-14T09:00:00Z",
      "endedAt": "2026-05-14T10:30:00Z",
      "duration": 5400,
      "durationFormatted": "1h 30min"
    },
    "report": {
      "dailyTotalSeconds": 18000,
      "dailyTotalFormatted": "5h 00min",
      "projectPercentageOfDay": 30.0
    }
  }
}
```

---

## 7. Arquitetura do Frontend (Vue 3)

```
src/
├── main.ts / App.vue
├── router/index.ts
├── stores/          (auth, projects, teams, tasks, time-entries, settings) — Pinia
├── services/        (api.ts + interceptors, auth, projects, teams, tasks, time-entries, reports)
├── composables/     (useTimer, useToast, useAuth)
├── layouts/         (AuthLayout, AppLayout com sidebar + topbar)
├── views/           (auth/, dashboard/, projects/, teams/, tasks/, time-entries/, reports/)
└── components/      (ui/, timer/ActiveTimer, charts/, reports/)

e2e/                 (Playwright)
├── playwright.config.ts
├── fixtures/auth.fixture.ts
├── auth.spec.ts
├── timer.spec.ts
├── time-entries.spec.ts
├── reports.spec.ts
└── admin.spec.ts
```

### Tratamento de Erros (interceptor Axios)

```
401 → limpa token e redireciona para /login
403 → Toast "Acesso não permitido"
422 → exibe erros nos campos do formulário
4xx → Toast com mensagem da API
5xx → Toast "Erro interno. Tente novamente."
429 → Toast "Muitas tentativas. Aguarde antes de tentar novamente."
```

---

## 8. Estratégia de Testes

### Pirâmide

```
   [Playwright]    → browser e2e — fluxos completos no browser real
    [e2e API]      → Jest + Supertest — endpoints HTTP de ponta a ponta
  [unitários]      → Jest (backend) / Vitest (frontend) — lógica isolada
```

### Backend — Unitários (Jest + jest-mock-extended)

`*.spec.ts` ao lado de cada `*.service.ts` e `*.controller.ts`. Prisma sempre mockado.

| Módulo | Cenários prioritários |
|---|---|
| `AuthService` | hash de senha, JWT, bloqueio por e-mail não confirmado |
| `TimeEntriesService` | cálculo de duração, timer duplicado, data futura, retroativo |
| `ReportsService` | cálculo de percentual, agrupamento, membro sem lançamento retorna 0 |
| `WebhooksService` | assinatura HMAC, retry, payload completo |
| `WebhooksDispatcher` | evento chega a todos os destinos ativos; inativo não recebe |
| `UploadService` | rejeição de formato/tamanho, nome único gerado |

Meta: 80% de cobertura nos services; 70% nos controllers.

### Backend — e2e (Jest + Supertest)

Pasta `test/`. Banco PostgreSQL de teste separado, limpo a cada suite.

Fluxos: cadastro → confirmação → login → uso → relatório; timer; webhook entregue.

### Browser e2e (Playwright)

```ts
// playwright.config.ts
baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173'
video: 'on-first-retry'
screenshot: 'only-on-failure'
```

| Spec | Fluxos |
|---|---|
| `auth.spec.ts` | Cadastro, confirmação de e-mail, login |
| `timer.spec.ts` | Iniciar, parar, segundo timer bloqueado |
| `time-entries.spec.ts` | Manual, aviso retroativo, data futura bloqueada |
| `reports.spec.ts` | Relatório diário com percentuais, mensal com gráfico |
| `admin.spec.ts` | Webhooks, configurações, permissões por role |

### Frontend — Unitários (Vitest + @vue/test-utils + msw)

Composables (`useTimer`, `useAuth`, `useToast`), stores Pinia (`auth`, `time-entries`, `projects`) e componentes críticos (`LoginView`, `ActiveTimer`, formulário manual).

Meta: 70% composables/stores; cenários críticos 100% cobertos.

### Comandos

```bash
# Backend
npm run test          # unitários
npm run test:cov      # com cobertura
npm run test:e2e      # e2e API

# Frontend
npm run test
npm run test:coverage

# Playwright
npx playwright test
npx playwright test --ui
npx playwright show-report
```

---

## 9. Fases de Implementação

### Fase 1 — Fundação Backend
1. Setup NestJS + Prisma + PostgreSQL + Jest (jest-mock-extended)
2. Auth completo: register, login, verificação de e-mail, recuperação de senha + testes unitários
3. Users, Teams, Projects, Tasks + testes unitários
4. Exception filter global + response interceptor padronizado
5. Swagger (resources/swagger.yaml) + README

### Fase 2 — Tempo, Relatórios e Integrações
1. TimeEntries (CRUD + timer start/stop) + testes unitários
2. Reports (daily, monthly, team) + testes de cálculo
3. Testes e2e de API (pasta `test/`)
4. Upload de imagens (avatar e logo)
5. Settings (singleton) + Webhooks (dispatcher, HMAC, retry) + testes

### Fase 3 — Frontend Base
1. Setup Vue 3 + Vite + Tailwind + Pinia + Router + Vitest + msw
2. Layouts (Auth e App), Login, Register + testes
3. Guard de autenticação no Router
4. Interceptor Axios com tratamento de erros
5. Composables useAuth, useToast + testes unitários
6. Componentes UI base (Button, Input, Modal, Badge, Toast)

### Fase 4 — Frontend Funcional
1. Dashboard com resumo do dia e gráfico de pizza
2. Projetos (lista + detalhe + formulário + upload de logo)
3. Equipes (lista + membros)
4. Tarefas (lista + kanban)
5. Widget ActiveTimer na topbar + composable useTimer + testes
6. Registro de atividades (timer + manual com aviso de retroativo)
7. Relatório Diário (tabela + percentuais)
8. Relatório Mensal (tabela + gráfico de barras)
9. Relatório de Equipe

### Fase 5 — Refinamentos e Playwright
1. Refresh token (backend + frontend)
2. Paginação nos endpoints de listagem
3. Filtros avançados nos relatórios
4. Exportação para CSV/PDF
5. Notificações de lembrete (timer ativo há muito tempo)
6. Revisão de cobertura de testes
7. Setup Playwright (config, fixtures)
8. Specs: auth, timer, time-entries, reports, admin
9. Testes e2e de API: fluxos completos ponta a ponta

---

## 10. Padrão de Resposta da API

### Sucesso
```json
{ "data": { ... }, "message": "Operação realizada com sucesso", "statusCode": 200 }
```

### Erro
```json
{
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "message": "Dados inválidos",
  "details": [{ "field": "email", "message": "E-mail já cadastrado" }]
}
```

### Status Codes

| Code | Situação |
|---|---|
| 200 | Sucesso |
| 201 | Recurso criado |
| 204 | Sem conteúdo (DELETE) |
| 400 | Requisição inválida |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 404 | Não encontrado |
| 409 | Conflito (e-mail/nome duplicado) |
| 422 | Erro de validação |
| 429 | Rate limit atingido |
| 500 | Erro interno |

---

## 11. Variáveis de Ambiente

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/timetracker
JWT_SECRET=sua_chave_secreta
JWT_EXPIRES_IN=15m
PORT=3000
NODE_ENV=development

# Admin inicial (seed)
ADMIN_NAME=Administrador
ADMIN_EMAIL=admin@empresa.com
ADMIN_PASSWORD=senha_forte_aqui

# E-mail (Nodemailer)
MAIL_HOST=smtp.seu-provedor.com
MAIL_PORT=587
MAIL_USER=no-reply@empresa.com
MAIL_PASS=senha_smtp
MAIL_FROM="TimeTracker <no-reply@empresa.com>"

# URL base do frontend (links nos e-mails)
APP_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3000
```
