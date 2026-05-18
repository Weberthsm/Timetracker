# TimeTracker

Sistema de controle de horas e tarefas com timer em tempo real, relatórios mensais e gerenciamento de equipes.

---

## Estrutura do repositório

```
acompanhar-tarefas/
├── backend/      # API REST — NestJS + Prisma + PostgreSQL
├── frontend/     # Interface web — Vue 3 + Vite + Tailwind CSS
└── docs/         # Plano completo e documentação de arquitetura
```

---

## O que você vai precisar instalar antes

### 1. Node.js (versão 20 ou superior)

Acesse **[nodejs.org](https://nodejs.org)** e baixe a versão **LTS**. Durante a instalação, deixe todas as opções padrão marcadas.

Para confirmar que instalou corretamente, abra o **PowerShell** e digite:

```
node --version
```

Deve aparecer algo como `v20.x.x` ou superior.

---

### 2. Docker Desktop

O Docker vai criar e gerenciar o banco de dados PostgreSQL para você, sem precisar instalar o banco direto na máquina.

Acesse **[docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)**, baixe a versão para Windows e instale.

> Durante a instalação ele pode pedir para ativar o **WSL 2** — confirme. Se você já tem o WSL Debian instalado, está tudo certo.

Após instalar, **abra o Docker Desktop** pelo menu Iniciar. Aguarde aparecer o ícone na barra de tarefas (canto inferior direito) com um ponto **verde**. Isso indica que o Docker está pronto.

---

## Instalação passo a passo

Abra o **PowerShell** e siga cada passo em ordem.

---

### Passo 1 — Acesse a pasta raiz do projeto

```
cd D:\JRSistemas\Projetos\acompanhar-tarefas
```

> Ajuste o caminho se o projeto estiver em outro lugar.

---

### Passo 2 — Suba o banco de dados

```
docker compose up -d
```

**Na primeira vez**, o Docker vai baixar a imagem do PostgreSQL (~100 MB). Aguarde terminar.

Quando finalizar, você verá uma mensagem parecida com:

```
✔ Container acompanhar-tarefas-postgres-1  Started
```

Para confirmar que o banco está rodando:

```
docker compose ps
```

A coluna `Status` deve mostrar `running`.

> **O que o Docker fez?** Criou um servidor PostgreSQL isolado na sua máquina, na porta 5432, com usuário `timetracker`, senha `timetracker` e banco `timetracker`. Você não precisa configurar nada disso manualmente.

---

### Passo 3 — Entre na pasta do backend

```
cd backend
```

---

### Passo 4 — Crie o arquivo de configuração

**No PowerShell (Windows):**

```
copy .env.example .env
```

O arquivo `.env` já vem pré-configurado para conectar no banco que o Docker subiu no passo anterior. Não é necessário editar nada para rodar localmente.

> Se quiser alterar o nome, e-mail ou senha do administrador inicial, abra o `.env` em qualquer editor de texto e edite as linhas `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` antes de continuar.

---

### Passo 5 — Instale as dependências do backend

```
npm install
```

Aguarde terminar (pode demorar alguns minutos na primeira vez).

---

### Passo 6 — Crie as tabelas no banco de dados

```
npx prisma migrate dev
```

Se aparecer a pergunta:

```
? Enter a name for the new migration: »
```

Digite `init` e pressione **Enter**.

Quando terminar, você verá:

```
✔ Generated Prisma Client
```

---

### Passo 7 — Crie o usuário administrador

```
npx prisma db seed
```

Você verá:

```
Admin criado: seu-email@exemplo.com
SystemSettings criado com padrões.
The seed command has been executed.
```

---

### Passo 8 — Inicie o backend

```
npm run start:dev
```

Aguarde aparecer:

```
Application is running on: http://localhost:3000
```

> Deixe esse terminal aberto. O backend precisa ficar rodando.

---

### Passo 9 — Abra um segundo terminal para o frontend

Abra uma **nova janela** do PowerShell (não feche a anterior) e execute:

```
cd D:\JRSistemas\Projetos\acompanhar-tarefas\frontend
```

---

### Passo 10 — Crie o arquivo de configuração do frontend

```
copy .env.example .env
```

---

### Passo 11 — Instale as dependências do frontend

```
npm install
```

---

### Passo 12 — Inicie o frontend

```
npm run dev
```

Você verá:

```
  ➜  Local:   http://localhost:5173/
```

---

## Pronto! Acesse o sistema

Abra o navegador e entre em:

```
http://localhost:5173
```

Use as credenciais configuradas no `.env` do backend (padrão do `.env.example`):

| Campo | Valor padrão |
|-------|-------------|
| E-mail | `admin@empresa.com` |
| Senha | `senha_forte_aqui` |

> Se você editou o `ADMIN_EMAIL` e `ADMIN_PASSWORD` no passo 4, use os valores que você definiu.

---

## Uso no dia a dia

Na próxima vez que for usar o sistema, basta fazer:

**1. Verificar se o Docker Desktop está aberto** (ícone verde na barra de tarefas)

**2. Subir o banco** (na pasta raiz do projeto):
```
docker compose up -d
```

**3. Subir o backend** (na pasta `backend/`):
```
npm run start:dev
```

**4. Subir o frontend** (na pasta `frontend/`, em outro terminal):
```
npm run dev
```

**Para parar tudo no final do dia:**

Feche os dois terminais e depois:
```
docker compose down
```

---

## Comandos Docker úteis

| Comando | O que faz |
|---------|-----------|
| `docker compose up -d` | Sobe o banco em segundo plano |
| `docker compose down` | Para o banco (dados são preservados) |
| `docker compose down -v` | Para o banco e **apaga todos os dados** |
| `docker compose ps` | Mostra se o banco está rodando |
| `docker compose logs -f postgres` | Mostra os logs do banco em tempo real |

---

## Solução de problemas comuns

**"Cannot connect to the Docker daemon"**
→ O Docker Desktop não está aberto. Abra-o pelo menu Iniciar e aguarde o ícone ficar verde.

**"Port 5432 already in use"**
→ Você tem outro PostgreSQL rodando na mesma porta. Abra o Gerenciador de Serviços do Windows (`services.msc`), procure por `postgresql` e pare o serviço.

**`prisma migrate dev` falha com erro de conexão**
→ O banco não subiu corretamente. Rode `docker compose ps` e verifique se o status está `running`. Se não estiver, rode `docker compose up -d` novamente.

**`npm run start:dev` falha com "Cannot find module"**
→ O `npm install` não foi executado. Rode `npm install` dentro da pasta `backend/` e tente novamente.

**A página em `localhost:5173` não carrega dados**
→ Verifique se o backend está rodando em outro terminal. Deve aparecer `Application is running on: http://localhost:3000`.

---

## Documentação detalhada

- [Backend — stack, variáveis de ambiente, testes](./backend/README.md)
- [Frontend — stack, variáveis de ambiente, testes E2E](./frontend/README.md)
