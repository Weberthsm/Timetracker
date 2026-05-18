# TASK-013 — Swagger: Documentação da API

## Objetivo
Configurar o Swagger/OpenAPI para documentar todos os endpoints implementados até o momento.

## Escopo

### Instalar dependência
```bash
npm install @nestjs/swagger swagger-ui-express
```

### Configurar em `src/main.ts`
```typescript
const config = new DocumentBuilder()
  .setTitle('TimeTracker API')
  .setDescription('API de controle de horas trabalhadas por projeto')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api-docs', app, document);
```

### Rota pública para JSON
- `GET /api-docs-json` → retorna OpenAPI JSON (para importação no Postman/Insomnia)
- Adicionar ao decorator `@Public()` via guard

### Anotar todos os controllers já criados
Para cada controller (Auth, Users, Teams, Projects, Tasks):
- `@ApiTags('auth')`, `@ApiTags('users')`, etc.
- `@ApiBearerAuth()` nos controllers protegidos
- `@ApiOperation({ summary: '...' })` em cada método
- `@ApiResponse({ status: 200, description: '...' })` nos principais status
- `@ApiBody({ type: DtoClass })` onde necessário

### Anotar DTOs com `@ApiProperty()`
- Todos os campos dos DTOs devem ter `@ApiProperty({ description: '...', example: '...' })`
- Campos opcionais: `@ApiPropertyOptional()`

### Arquivo `resources/swagger.yaml`
- Exportar o JSON e converter para YAML (pode ser via script ou manualmente)
- Ou: configurar para servir o YAML via endpoint

## Critérios de conclusão
- [ ] `GET /api-docs` abre a UI do Swagger no browser
- [ ] `GET /api-docs-json` retorna JSON válido da especificação OpenAPI
- [ ] Todos os endpoints de Auth, Users, Teams, Projects, Tasks estão documentados
- [ ] Autenticação Bearer está configurada na UI (botão "Authorize")
- [ ] Rotas marcadas com `@Public()` não exigem token na documentação
