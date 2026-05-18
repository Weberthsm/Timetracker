# TASK-009 — UsersModule: CRUD e Promoção de Role

## Objetivo
Implementar listagem, consulta, edição e promoção de role de usuários, com testes unitários.

## Escopo

### DTOs (`src/users/dto/`)
**`update-user.dto.ts`** (PartialType de um base)
- `name`: string, minLength 2, maxLength 150, opcional

**`update-role.dto.ts`**
- `role`: enum Role (`admin | manager | member`), obrigatório

### `src/users/users.service.ts`

**`findAll(): Promise<User[]>`**
- Retorna todos os usuários sem `passwordHash`
- Ordenar por `name ASC`

**`findOne(id: string): Promise<User>`**
- Retorna usuário sem `passwordHash`
- HTTP 404 se não encontrado

**`update(id: string, dto: UpdateUserDto, currentUser): Promise<User>`**
- Usuário só edita a si mesmo
- `admin` pode editar qualquer usuário
- HTTP 403 se member tentar editar outro
- Retorna usuário atualizado sem `passwordHash`

**`remove(id: string, currentUser): Promise<void>`**
- Apenas `admin` exclui usuários
- HTTP 403 para outros roles
- HTTP 404 se não encontrado

**`updateRole(id: string, dto: UpdateRoleDto, currentUser): Promise<User>`**
- Apenas `admin` pode executar → HTTP 403 para outros
- Admin não pode rebaixar a si mesmo → HTTP 422
- Role inválido: tratado automaticamente pelo DTO enum validation → HTTP 422
- Atualiza `role` e retorna usuário sem `passwordHash`

### `src/users/users.controller.ts`
```
GET    /users          (admin, manager)
GET    /users/:id      (qualquer autenticado)
PATCH  /users/:id      (próprio ou admin)
DELETE /users/:id      (admin)
PATCH  /users/:id/role (admin)
```

### `src/users/users.service.spec.ts`
- `findAll`: retorna lista sem passwordHash
- `update`: member tenta editar outro → 403
- `remove`: não-admin → 403
- `updateRole`: não-admin → 403
- `updateRole`: admin rebaixa a si mesmo → 422
- `updateRole`: role inválido → 422 (via DTO)
- `updateRole`: sucesso atualiza role

## Critérios de conclusão
- [ ] `GET /users` retorna lista sem passwordHash
- [ ] `PATCH /users/:id/role` com admin funciona corretamente
- [ ] Admin não consegue rebaixar a si mesmo (retorna 422)
- [ ] Member recebe 403 ao tentar deletar usuário
- [ ] Todos os cenários de teste passam
