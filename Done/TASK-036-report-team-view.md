# TASK-036 — Frontend: Relatório de Equipe

## Objetivo
Criar a tela de relatório consolidado de equipe (acessível apenas para admin/manager).

## Escopo

### `src/views/reports/TeamReportView.vue`

**Controles:**
- Dropdown de seleção de equipe (lista todas as equipes)
- Month picker para selecionar o mês
- Botão "Gerar relatório"

**Tabela principal:**
Colunas: Membro | Total de Horas | Distribuição por Projeto

- Cada linha: avatar, nome, total formatado, mini-barra de distribuição por projeto
- Membros sem lançamentos aparecem com "0h 00min" (não omitidos)
- Ordenar por total de horas DESC

**Gráfico de barras empilhadas (`StackedBarChart.vue`):**
- Eixo X: membros da equipe
- Eixo Y: horas
- Cada barra dividida por projeto (stacked)
- Legenda com cores dos projetos

**Cards de desequilíbrio:**
- Membro com mais horas vs. membro com menos horas
- Diferença percentual (aviso se diferença > 50%)

### `src/components/charts/StackedBarChart.vue`
- Chart.js com `type: 'bar'` e `stacked: true`
- Props: `labels` (nomes dos membros), `datasets` (por projeto com cores)

### Permissões
- Rota `/app/reports/team` com `meta: { roles: ['admin', 'manager'] }` (configurado em TASK-025)
- Link "Relatório de Equipe" na sidebar oculto para `member`

### Exportação básica (opcional)
- Botão "Copiar tabela" → copia dados em formato CSV para clipboard

## Critérios de conclusão
- [ ] Tabela exibe todos os membros incluindo os sem lançamentos
- [ ] Gráfico empilhado por projeto renderizado corretamente
- [ ] Member redirecionado ao tentar acessar a rota
- [ ] Mudar mês ou equipe recarrega o relatório
- [ ] Cards de desequilíbrio calculados corretamente
