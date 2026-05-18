# TASK-019 — WebhooksModule: CRUD, Dispatcher, HMAC e Retry

## Objetivo
Implementar o gerenciamento de webhooks, disparo automático de eventos e sistema de retry, com testes unitários.

## Escopo

### DTOs (`src/webhooks/dto/`)
**`create-webhook.dto.ts`**
- `name`: string, minLength 1, maxLength 150, obrigatório
- `url`: string, isURL, obrigatório
- `secret`: string, opcional
- `events`: string[], arrayMinSize 1, obrigatório
  - Valores válidos: `time_entry.created | time_entry.updated | time_entry.deleted | timer.started | timer.stopped | report.daily | report.monthly`
- `isActive`: boolean, padrão `true`, opcional

**`update-webhook.dto.ts`** (PartialType)

### `src/webhooks/webhooks.service.ts`

**CRUD padrão** (apenas `admin`):
- `create`, `findAll`, `findOne`, `update`, `remove`
- HTTP 403 para não-admin

**`testWebhook(id: string, currentUser): Promise<WebhookDelivery>`**
- Envia payload fictício do evento `timer.stopped` para a URL do destino
- Registra entrega em `WebhookDelivery`
- Retorna resultado da entrega

**`getDeliveries(webhookId: string): Promise<WebhookDelivery[]>`**
- Lista histórico de entregas ordenado por `deliveredAt DESC`

**`retryDelivery(webhookId: string, deliveryId: string): Promise<WebhookDelivery>`**
- Reenvia o payload da entrega específica

### `src/webhooks/webhooks.dispatcher.ts`
Serviço que escuta eventos internos e envia para os destinos ativos.

**`dispatch(event: string, payload: object): Promise<void>`**
1. Buscar todos os `WebhookDestination` onde `isActive = true` e `events` contém o evento
2. Para cada destino: chamar `sendToDestination(destination, event, payload)`

**`sendToDestination(destination, event, payload): Promise<void>`**
1. Construir payload completo conforme formato definido na seção 6 do plano
2. Se `destination.secret`: gerar `X-TimeTracker-Signature: sha256=<hmac-sha256>`
3. Fazer POST HTTP para `destination.url` com timeout de 10s
4. Registrar em `WebhookDelivery`: statusCode, responseBody, success
5. Em caso de falha: agendar retry com backoff (1 min, 5 min, 15 min — máx 3 tentativas)

**Payload de webhook** (formato completo conforme plano):
```json
{
  "event": "timer.stopped",
  "occurredAt": "ISO8601",
  "data": {
    "timeEntry": { "id", "user", "project", "task", "description", "date", "startedAt", "endedAt", "duration", "durationFormatted" },
    "report": { "dailyTotalSeconds", "dailyTotalFormatted", "projectPercentageOfDay" }
  }
}
```

### Integração com TimeEntriesService
- `TimeEntriesService.startTimer()` → emite evento `timer.started`
- `TimeEntriesService.stopTimer()` → emite evento `timer.stopped` (com relatório do dia)
- `TimeEntriesService.create()` → emite evento `time_entry.created`
- `TimeEntriesService.update()` → emite evento `time_entry.updated`
- `TimeEntriesService.remove()` → emite evento `time_entry.deleted`

Usar `EventEmitter2` do NestJS para desacoplar:
```bash
npm install @nestjs/event-emitter
```

### `src/webhooks/webhooks.controller.ts`
```
GET/POST           /webhooks
GET/PATCH/DELETE   /webhooks/:id
POST               /webhooks/:id/test
GET                /webhooks/:id/deliveries
POST               /webhooks/:id/deliveries/:did/retry
```

### `src/webhooks/webhooks.service.spec.ts`
- `dispatch`: envia para todos os destinos ativos inscritos no evento
- `dispatch`: destino inativo não recebe payload
- `sendToDestination`: assinatura HMAC gerada corretamente com secret
- `sendToDestination`: sem secret → header de assinatura ausente
- `sendToDestination`: HTTP 500 no destino → registra falha e agenda retry
- Após 3 tentativas: marcado como falha definitiva

## Critérios de conclusão
- [ ] `POST /webhooks/:id/test` envia payload para a URL e registra entrega
- [ ] Dois destinos inscritos no mesmo evento recebem o payload simultaneamente
- [ ] Assinatura HMAC gerada corretamente quando secret configurado
- [ ] Retry agendado após falha (1 min, 5 min, 15 min)
- [ ] Inativo não recebe payload
- [ ] Todos os cenários de teste passam
