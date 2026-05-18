# TASK-010 — TeamsModule: CRUD e Gerenciamento de Membros

## Objetivo
Implementar criação, listagem, edição, exclusão de equipes e gerenciamento de membros, com testes unitários.

## Escopo

### DTOs (`src/teams/dto/`)
**`create-team.dto.ts`**
- `name`: string, minLength 1, maxLength 150, obrigatório

**`update-team.dto.ts`** (PartialType)

**`add-member.dto.ts`**
- `userId`: string, isUUID, obrigatório

### `src/teams/teams.service.ts`

**`create(dto: CreateTeamDto, currentUser): Promise<Team>`**
- Apenas `admin` ou `manager` → HTTP 403 para member
- Nome único no sistema → HTTP 409 se duplicado
- Retorna equipe criada

**`findAll(): Promise<Team[]>`**
- Retorna todas as equipes com contagem de membros
- Ordenar por `name ASC`

**`findOne(id: string): Promise<Team>`**
- Retorna equipe com lista de membros (sem passwordHash)
- HTTP 404 se não encontrada

**`update(id: string, dto: UpdateTeamDto, currentUser): Promise<Team>`**
- Apenas `admin` ou `manager` → HTTP 403
- Nome único → HTTP 409 se duplicado com outra equipe

**`remove(id: string, currentUser): Promise<void>`**
- Apenas `admin` ou `manager` → HTTP 403
- Ao excluir: setar `teamId = null` em todos os membros (não excluir usuários)

**`addMember(teamId: string, dto: AddMemberDto, currentUser): Promise<Team>`**
- Apenas `admin` ou `manager` → HTTP 403
- Equipe não encontrada → HTTP 404
- Usuário não encontrado → HTTP 404
- Usuário já está na equipe → HTTP 409
- Se usuário já pertence a outra equipe: remover do anterior e adicionar ao novo

**`removeMember(teamId: string, userId: string, currentUser): Promise<void>`**
- Apenas `admin` ou `manager` → HTTP 403
- Equipe ou usuário não encontrado → HTTP 404
- Setar `user.teamId = null`

### `src/teams/teams.controller.ts`
```
GET    /teams
POST   /teams
GET    /teams/:id
PATCH  /teams/:id
DELETE /teams/:id
POST   /teams/:id/members
DELETE /teams/:id/members/:userId
```

### `src/teams/teams.service.spec.ts`
- `create`: member → 403
- `create`: nome duplicado → 409
- `create`: sucesso cria equipe
- `remove`: desvincula membros sem excluí-los
- `addMember`: usuário já em outra equipe é movido
- `removeMember`: member → 403

## Critérios de conclusão
- [ ] Criar equipe com nome duplicado retorna 409
- [ ] Excluir equipe seta teamId=null nos membros
- [ ] Member recebe 403 em todas as operações de gerenciamento
- [ ] Adicionar membro já em outra equipe o move corretamente
- [ ] Todos os cenários de teste passam
