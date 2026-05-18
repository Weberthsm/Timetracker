# TASK-035 — Frontend: Relatório Mensal

## Objetivo
Criar a tela de relatório mensal com totais por projeto e gráfico de barras por dia.

## Escopo

### `src/views/reports/MonthlyReportView.vue`

**Controles:**
- Month picker para selecionar o mês (padrão: mês atual, formato `YYYY-MM`)
- Para admin/manager: dropdown para selecionar usuário

**Cards de resumo:**
- Total de horas no mês
- Projeto com mais horas (destaque)
- Total de dias com registros

**Gráfico de barras (`BarChart.vue`):**
- Eixo X: dias do mês (1–31)
- Eixo Y: horas totais por dia
- Tooltips com detalhamento por projeto em cada dia
- Estado vazio: mensagem informativa

**Tabela por projeto:**
Colunas: Projeto | Total de Horas | % do Mês

- Ordenada por `totalSeconds DESC`
- Barra de progresso visual na coluna de percentual
- Cores dos projetos

**Tabela de distribuição diária (expandível):**
- Opcionalmente expandir para ver detalhes dia a dia
- Inicialmente colapsada

### `src/components/charts/BarChart.vue`
```typescript
// Props
defineProps<{
  labels: string[];       // dias do mês
  datasets: ChartDataset[];
}>();
```

- Usando `vue-chartjs` + Chart.js
- Estilo responsivo (height fixo, width 100%)
- Cores configuráveis por dataset

### Lógica de navegação de mês
- Botões "mês anterior" / "próximo mês" (próximo mês desabilitado se for mês futuro)
- URL reflete o mês selecionado: `/app/reports/monthly?month=2026-05`

## Critérios de conclusão
- [ ] Gráfico de barras renderizado com dados diários
- [ ] Navegação entre meses funciona corretamente
- [ ] Mês futuro não pode ser selecionado
- [ ] Tabela de projetos ordenada por total de horas
- [ ] Estado vazio exibido para mês sem dados
- [ ] Admin/manager podem ver relatório de outro usuário
