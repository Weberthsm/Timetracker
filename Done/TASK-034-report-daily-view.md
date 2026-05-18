# TASK-034 — Frontend: Relatório Diário

## Objetivo
Criar a tela de relatório diário com distribuição de horas por projeto e lista de atividades.

## Escopo

### `src/views/reports/DailyReportView.vue`

**Controles:**
- Date picker para selecionar o dia (padrão: hoje)
- Para admin/manager: dropdown para selecionar usuário (padrão: o próprio)
- Botão "Aplicar" ou atualização automática ao mudar os filtros

**Seção de totais:**
- Total de horas do dia formatado ("5h 30min")
- Número de atividades registradas

**Gráfico de pizza (`DoughnutChart.vue`):**
- Distribuição percentual por projeto
- Cores dos projetos (usar `project.color` ou paleta padrão)
- Legenda ao lado: nome do projeto, horas, percentual
- Estado vazio: mensagem "Nenhuma atividade registrada neste dia"

**Tabela de atividades:**
Colunas: Projeto | Tarefa | Descrição | Início | Fim | Duração

- Ordenada por início
- Duração formatada (ex: "1h 30min")
- Linha clicável para edição rápida (opcional — abre modal de edição)

**Estado de loading:**
- Skeleton loader durante requisição

### Lógica de dados
```typescript
onMounted(async () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  selectedDate.value = today;
  await loadReport();
});

async function loadReport() {
  loading.value = true;
  const { data } = await reportsService.daily({
    date: selectedDate.value,
    userId: selectedUserId.value ?? authStore.user.id,
  });
  report.value = data;
  loading.value = false;
}
```

### Responsividade
- Em mobile: gráfico empilhado acima da tabela
- Tabela com scroll horizontal em telas pequenas

## Critérios de conclusão
- [ ] Gráfico e tabela carregam com dados da API
- [ ] Mudar data recarrega os dados automaticamente
- [ ] Estado vazio exibido quando não há lançamentos
- [ ] Admin/manager podem ver relatório de outro usuário
- [ ] Member não vê dropdown de seleção de usuário
- [ ] Loading state visível durante requisição
