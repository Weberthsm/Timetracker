# TASK-004 — Infraestrutura Comum (Guards, Decorators, Filters, Interceptors)

## Objetivo
Criar os componentes de infraestrutura compartilhados usados por todos os módulos.

## Escopo

### `src/common/guards/jwt-auth.guard.ts`
- Estende `AuthGuard('jwt')` do Passport
- Verifica se a rota tem o decorator `@Public()` via `Reflector`
- Se `@Public()`: passa sem verificar token
- Se não: valida JWT normalmente

### `src/common/decorators/public.decorator.ts`
```typescript
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

### `src/common/decorators/current-user.decorator.ts`
- Extrai `req.user` do contexto de execução
- Retorna o objeto do usuário autenticado (tipo `{ sub: string; email: string; role: string }`)

### `src/common/decorators/roles.decorator.ts`
- `@Roles(...roles: Role[])` via `SetMetadata`

### `src/common/guards/roles.guard.ts`
- Verifica `role` do usuário JWT contra os roles exigidos pelo decorator `@Roles()`
- Retorna 403 se o role não bater

### `src/common/filters/http-exception.filter.ts`
- Captura todas as `HttpException`
- Resposta de erro padronizada:
```json
{
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "message": "Dados inválidos",
  "details": [{ "field": "email", "message": "E-mail já cadastrado" }]
}
```
- Para `ValidationPipe` errors (array de `ValidationError`): mapeia `constraints` para o campo `details`

### `src/common/interceptors/response.interceptor.ts`
- Envolve respostas de sucesso no padrão:
```json
{ "data": { ... }, "message": "Operação realizada com sucesso", "statusCode": 200 }
```
- Preserva `statusCode` real da resposta

### Registrar globalmente em `src/main.ts`
```typescript
app.useGlobalGuards(new JwtAuthGuard(reflector));
app.useGlobalFilters(new HttpExceptionFilter());
app.useGlobalInterceptors(new ResponseInterceptor());
```

## Critérios de conclusão
- [ ] Rota sem `@Public()` retorna 401 sem token
- [ ] Rota com `@Public()` retorna 200 sem token
- [ ] Erro de validação retorna `details` com campos mapeados
- [ ] Resposta de sucesso sempre envolve `data` + `message` + `statusCode`
