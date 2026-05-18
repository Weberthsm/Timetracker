# TASK-028 — Dashboard: Resumo do Dia e Gráfico de Pizza

## Objetivo
Criar a tela de dashboard com o resumo de horas do dia atual e gráfico de alocação por projeto.

## Escopo

### `src/services/reports.service.ts`
```typescript
export const reportsService = {
  daily: (params: { date: string; userId?: string }) => api.get('/reports/daily', { params }),
  monthly: (params: { month: string; userId?: string }) => api.get('/reports/monthly', { params }),
  team: (params: { teamId: string; month: string }) => api.get('/reports/team', { params }),
};
```

### `src/views/dashboard/DashboardView.vue`
Layout em grid com:

**Card de total do dia:**
- Total de horas formatado (ex: "5h 30min")
- Total de entradas registradas
- Botão "Iniciar timer" → abre modal de timer rápido

**Gráfico de pizza (`src/components/charts/DoughnutChart.vue`):**
- `vue-chartjs` + `Chart.js`
- Dados: `byProject` do relatório diário
- Cada projeto com sua cor (usar `project.color` ou paleta de cores padrão)
- Legenda ao lado com nome do projeto + percentual
- Estado vazio: placeholder "Nenhuma atividade registrada hoje"

**Lista de atividades do dia:**
- Tabela/lista com: horário, projeto, tarefa, descrição, duração
- Ordenada por `startedAt`
- Botão de edição rápida (abre modal inline)
- Estado vazio com CTA para iniciar timer

**Timer ativo (se houver):**
- Destaque visual no topo da página
- Mostra projeto + tempo decorrido (atualizado a cada segundo via `useTimer`)
- Botão "Parar" integrado

### `src/stores/timeEntries.ts` (Pinia)
```typescript
export const useTimeEntriesStore = defineStore('timeEntries', () => {
  const entries = ref<TimeEntry[]>([]);
  const activeTimer = ref<TimeEntry | null>(null);

  async function fetchToday() { ... }
  async function fetchActiveTimer() { ... }

  return { entries, activeTimer, fetchToday, fetchActiveTimer };
});
```

### Lógica de carregamento
`onMounted`: 
1. Calcular data de hoje (`format(new Date(), 'yyyy-MM-dd')`)
2. `reportsService.daily({ date: today, userId: authStore.user.id })`
3. Buscar timer ativo
4. Atualizar dados a cada 60 segundos (intervalo com `onUnmounted` para limpar)

## Critérios de conclusão
- [ ] Dashboard exibe total de horas do dia corretamente
- [ ] Gráfico de pizza renderiza com dados reais
- [ ] Estado vazio exibido quando não há lançamentos
- [ ] Timer ativo aparece com tempo decorrido em tempo real
- [ ] Dados recarregados ao retornar para a página
