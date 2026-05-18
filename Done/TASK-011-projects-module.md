# TASK-011 — ProjectsModule: CRUD e Associação de Equipes

## Objetivo
Implementar criação, listagem, edição, arquivamento de projetos e vínculo com equipes, com testes unitários.

## Escopo

### DTOs (`src/projects/dto/`)
**`create-project.dto.ts`**
- `name`: string, minLength 1, maxLength 150, obrigatório
- `description`: string, opcional
- `color`: string, regex `/^#[0-9A-Fa-f]{6}$/`, opcional

**`update-project.dto.ts`** (PartialType + `status: ProjectStatus` opcional)

### `src/projects/projects.service.ts`

**`create(dto: CreateProjectDto, currentUser): Promise<Project>`**
- Apenas `admin` ou `manager` → HTTP 403
- Cor inválida tratada pelo DTO → HTTP 422
- `status` padrão: `active`

**`findAll(currentUser): Promise<Project[]>`**
- `admin`/`manager`: todos os projetos
- `member`: apenas projetos de equipes onde está vinculado
- Incluir contagem de tasks e timeEntries

**`findOne(id: string): Promise<Project>`**
- HTTP 404 se não encontrado
- Incluir tasks e teamProjects

**`update(id: string, dto: UpdateProjectDto, currentUser): Promise<Project>`**
- Apenas `admin` ou `manager` → HTTP 403
- Cor inválida → HTTP 422 (via DTO)

**`archive(id: string, currentUser): Promise<Project>`**
- Apenas `admin` ou `manager` → HTTP 403
- Seta `status = archived`
- Projetos não são excluídos, apenas arquivados

**`linkTeam(projectId: string, teamId: string, currentUser): Promise<void>`**
- Apenas `admin` ou `manager` → HTTP 403
- Projeto ou equipe não encontrados → HTTP 404
- Vínculo já existe → HTTP 409

**`unlinkTeam(projectId: string, teamId: string, currentUser): Promise<void>`**
- Apenas `admin` ou `manager` → HTTP 403
- Remove registro de `TeamProject`
- Não apaga registros de TimeEntry existentes

### `src/projects/projects.controller.ts`
```
GET    /projects
POST   /projects
GET    /projects/:id
PATCH  /projects/:id
DELETE /projects/:id       → chama archive() (não exclui)
POST   /projects/:id/teams/:teamId
DELETE /projects/:id/teams/:teamId
```

### `src/projects/projects.service.spec.ts`
- `create`: member → 403
- `create`: cor inválida → 422
- `findAll`: member vê apenas projetos da sua equipe
- `archive`: seta status=archived; não deleta
- `linkTeam`: vínculo duplicado → 409
- `unlinkTeam`: não apaga TimeEntries

## Critérios de conclusão
- [ ] Member não pode criar nem arquivar projetos (403)
- [ ] `DELETE /projects/:id` arquiva (status=archived) em vez de excluir
- [ ] Member só vê projetos da sua equipe
- [ ] TimeEntries preservadas após desvincular equipe
- [ ] Todos os cenários de teste passam
