# TASK-038 — Paginação nos Endpoints de Listagem

## Objetivo
Adicionar paginação cursor-based ou offset-based nos endpoints de listagem para suportar grandes volumes de dados.

## Escopo

### Estratégia: offset-based (simples)
Query params padrão: `?page=1&limit=20`

### Backend — criar helper genérico
**`src/common/dto/pagination.dto.ts`**
```typescript
export class PaginationDto {
  @IsOptional() @IsInt() @Min(1) @Transform(({ value }) => parseInt(value))
  page: number = 1;

  @IsOptional() @IsInt() @Min(1) @Max(100) @Transform(({ value }) => parseInt(value))
  limit: number = 20;
}
```

**`src/common/utils/paginate.ts`**
```typescript
export function paginate<T>(data: T[], total: number, page: number, limit: number) {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
}
```

### Endpoints a paginar
- `GET /users` → `page`, `limit`, `search` (por nome/email)
- `GET /teams` → `page`, `limit`
- `GET /projects` → `page`, `limit`, `status` (active/archived/all)
- `GET /projects/:projectId/tasks` → `page`, `limit`, `status`
- `GET /time-entries` → `page`, `limit`, `date`, `month`, `userId`, `projectId`
- `GET /webhooks/:id/deliveries` → `page`, `limit`

### Alterar services
Para cada service: trocar `findMany()` por `findMany({ skip, take })` com `count()` em paralelo usando `prisma.$transaction`.

### Frontend — componente de paginação
**`src/components/ui/BasePagination.vue`**
Props: `currentPage`, `totalPages`, `onPageChange`

- Botões "Anterior" / "Próximo"
- Números de página (máx 5 visíveis com elipsis)
- Desabilitar "Anterior" na primeira página e "Próximo" na última

### Integrar paginação nas views
- `ProjectsView`, `TeamsView`, `TimeEntriesView`: adicionar `BasePagination` no rodapé da lista
- Ao mudar página: buscar novos dados + scroll para o topo

## Critérios de conclusão
- [ ] `GET /time-entries?page=2&limit=10` retorna a segunda página
- [ ] Resposta inclui `meta.total`, `meta.totalPages`, `meta.hasNextPage`
- [ ] `BasePagination` navega corretamente entre páginas
- [ ] Parâmetros de filtro são preservados ao trocar de página
