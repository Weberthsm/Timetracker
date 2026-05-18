# TASK-016 — ReportsModule: Relatórios Diário, Mensal e de Equipe

## Objetivo
Implementar os três tipos de relatório com cálculo de percentuais e agrupamentos, com testes unitários.

## Escopo

### `src/time-entries/reports.service.ts` (ou módulo separado `reports/`)

**`getDailyReport(date: string, userId: string, currentUser): Promise<DailyReport>`**

Regras de acesso:
- `member` só acessa o próprio (`userId` deve ser igual ao `currentUser.userId`) → HTTP 403
- `admin`/`manager` acessam qualquer usuário

Algoritmo:
1. Buscar todas `TimeEntry` onde `date = date` e `userId = userId` e `endedAt != null`
2. Calcular `totalDaySeconds = soma de todas as duration`
3. Agrupar por projeto:
   - `projectId`, `projectName`, `totalSeconds`, `percentage = (totalSeconds / totalDaySeconds) * 100`
4. Retornar também lista de atividades individuais com `description`, `startedAt`, `endedAt`, `duration`, `taskTitle`
5. Dia sem lançamentos → retornar estrutura vazia (não HTTP 404)

Formato de resposta:
```json
{
  "date": "2026-05-14",
  "totalSeconds": 18000,
  "totalFormatted": "5h 00min",
  "byProject": [
    { "projectId": "...", "projectName": "App Mobile", "totalSeconds": 5400, "percentage": 30.0 }
  ],
  "entries": [...]
}
```

**`getMonthlyReport(month: string, userId: string, currentUser): Promise<MonthlyReport>`**

Parâmetro `month` formato `YYYY-MM`.

Algoritmo:
1. Buscar TimeEntries onde `date BETWEEN first_day_of_month AND last_day_of_month`
2. Calcular totais por projeto com percentual do mês
3. Calcular totais por dia do mês (para gráfico de barras)
4. Mês sem lançamentos → resposta vazia

**`getTeamReport(teamId: string, month: string, currentUser): Promise<TeamReport>`**

Regras de acesso:
- Apenas `admin` ou `manager` → HTTP 403

Algoritmo:
1. Buscar todos os membros da equipe (incluindo os sem lançamentos)
2. Para cada membro: calcular total de horas e distribuição por projeto no mês
3. Membros sem lançamentos aparecem com `totalSeconds: 0` (não omitidos)

### `src/time-entries/reports.controller.ts`
```
GET /reports/daily?date=YYYY-MM-DD&userId=...
GET /reports/monthly?month=YYYY-MM&userId=...
GET /reports/team?teamId=...&month=YYYY-MM
```

### Helper de formatação
```typescript
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}min` : `${m}min`;
}
```

### `reports.service.spec.ts`
- `getDailyReport`: membro acessa relatório de outro → 403
- `getDailyReport`: dia sem lançamentos retorna estrutura vazia (não 404)
- `getDailyReport`: percentual calculado corretamente (1h30min de 5h = 30%)
- `getMonthlyReport`: totais diários somados corretamente
- `getTeamReport`: não-admin/manager → 403
- `getTeamReport`: membro sem lançamentos aparece com 0 horas

## Critérios de conclusão
- [ ] Percentual diário calculado corretamente
- [ ] Membro sem lançamentos no relatório de equipe aparece com 0
- [ ] `GET /reports/daily` sem lançamentos retorna 200 com estrutura vazia
- [ ] Member não acessa relatório de outro (403)
- [ ] Todos os cenários de teste passam
