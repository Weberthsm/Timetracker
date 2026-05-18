# TASK-032 — Widget ActiveTimer e Composable useTimer

## Objetivo
Criar o widget de timer ativo na topbar e o composable que gerencia o estado do timer, com testes unitários.

## Escopo

### `src/composables/useTimer.ts`
```typescript
export function useTimer() {
  const store = useTimeEntriesStore();
  const elapsed = ref(0);         // segundos decorridos
  const isActive = computed(() => !!store.activeTimer);
  let intervalId: ReturnType<typeof setInterval> | null = null;

  function startCounting() {
    if (!store.activeTimer) return;
    const startedAt = new Date(store.activeTimer.startedAt).getTime();
    intervalId = setInterval(() => {
      elapsed.value = Math.floor((Date.now() - startedAt) / 1000);
    }, 1000);
  }

  function stopCounting() {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
  }

  async function start(dto: StartTimerDto) {
    await timeEntriesService.startTimer(dto);
    await store.fetchActiveTimer();
    startCounting();
  }

  async function stop(timerId: string) {
    await timeEntriesService.stopTimer(timerId);
    store.activeTimer = null;
    stopCounting();
    elapsed.value = 0;
  }

  // Formatar elapsed em "HH:MM:SS"
  const elapsedFormatted = computed(() => formatElapsed(elapsed.value));

  // Aviso de timer muito longo (> 24h)
  const isLongRunning = computed(() => elapsed.value > 86400);

  onUnmounted(stopCounting);

  return { isActive, elapsed, elapsedFormatted, isLongRunning, start, stop };
}
```

### `src/components/timer/ActiveTimer.vue`
Componente usado na topbar do `AppLayout`.

**Quando sem timer ativo:**
- Botão "Iniciar timer" com ícone play → abre `StartTimerModal`

**Quando com timer ativo:**
- Exibe: nome do projeto + cronômetro `HH:MM:SS` atualizado a cada segundo
- Botão "Parar" com ícone stop → para o timer imediatamente
- Se `isLongRunning`: badge de aviso laranja "Timer ativo há mais de 24h"

### `src/components/timer/StartTimerModal.vue`
Modal para iniciar o timer:

**Campos:**
- Projeto (select, obrigatório) — lista projetos ativos acessíveis ao usuário
- Tarefa (select, opcional) — filtrado pelo projeto selecionado, exclui done/cancelled
- Descrição (input, opcional)

**Comportamento:**
- Submit → `useTimer().start(dto)`
- Sucesso: fecha modal, topbar mostra cronômetro
- Erro 422 (timer já ativo): toast de aviso

### Inicialização no `AppLayout`
`onMounted`: chamar `store.fetchActiveTimer()` e iniciar contagem se houver timer ativo.

### Testes unitários (`useTimer.spec.ts`)
- `start`: define activeTimer e inicia contagem
- `stop`: limpa activeTimer e zera elapsed
- `elapsedFormatted`: "00:01:30" para 90 segundos
- `isLongRunning`: true quando elapsed > 86400

## Critérios de conclusão
- [ ] Cronômetro atualiza a cada segundo na topbar
- [ ] Parar timer fecha o cronômetro e exibe toast de confirmação
- [ ] Modal de iniciar timer filtra projetos ativos do usuário
- [ ] Aviso visual exibido para timer > 24h
- [ ] Cronômetro retomado após refresh da página (busca timer ativo na API)
- [ ] Todos os cenários de teste passam
