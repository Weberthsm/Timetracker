# TASK-017 — UploadModule: Avatar de Usuário e Logo de Projeto

## Objetivo
Implementar upload e remoção de imagens (avatar e logo), com validações e testes unitários.

## Escopo

### Instalar dependência
```bash
npm install multer @types/multer
npm install sharp  # para redimensionamento opcional
```

### `src/upload/multer.config.ts`
```typescript
export const multerConfig = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const folder = req.path.includes('avatar') ? 'uploads/avatars' : 'uploads/logos';
      cb(null, folder);
    },
    filename: (req, file, cb) => {
      const ext = extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
};
```

### `src/upload/upload.service.ts`

**`uploadAvatar(file: Express.Multer.File, targetUserId: string, currentUser): Promise<{ avatarUrl: string }>`**
1. Se `currentUser.role = 'member'` e `targetUserId != currentUser.userId` → HTTP 403
2. Buscar usuário → HTTP 404 se não encontrado
3. Se `user.avatarUrl` não é null: excluir arquivo anterior do disco
4. Construir URL: `${APP_URL}/uploads/avatars/${file.filename}`
5. Atualizar `user.avatarUrl`
6. Retornar `{ avatarUrl }`

**`removeAvatar(targetUserId: string, currentUser): Promise<void>`**
1. Verificar permissão (mesma regra acima)
2. Buscar usuário → HTTP 404
3. Se `avatarUrl = null`: retornar sem erro (idempotente)
4. Excluir arquivo do disco
5. Setar `user.avatarUrl = null`

**`uploadProjectLogo(file: Express.Multer.File, projectId: string, currentUser): Promise<{ logoUrl: string }>`**
1. Apenas `admin` ou `manager` → HTTP 403
2. Buscar projeto → HTTP 404
3. Se `project.logoUrl` não é null: excluir arquivo anterior
4. Atualizar `project.logoUrl`
5. Retornar `{ logoUrl }`

**`removeProjectLogo(projectId: string, currentUser): Promise<void>`**
1. Apenas `admin` ou `manager` → HTTP 403
2. Buscar projeto → HTTP 404
3. Excluir arquivo e setar `project.logoUrl = null`

### `src/upload/upload.controller.ts`
```
POST   /upload/avatar                        @UseInterceptors(FileInterceptor)
DELETE /upload/avatar
POST   /upload/projects/:id/logo             @UseInterceptors(FileInterceptor)
DELETE /upload/projects/:id/logo
```

### Servir arquivos estáticos em `main.ts`
```typescript
app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });
```

### `src/upload/upload.service.spec.ts`
- `uploadAvatar`: member tenta enviar avatar de outro → 403
- `uploadAvatar`: arquivo anterior é excluído antes de salvar novo
- `uploadProjectLogo`: member → 403
- `removeAvatar`: avatarUrl já null → sem erro
- Formato inválido: rejeitado pelo `fileFilter` → 422
- Arquivo acima de 2MB: rejeitado pelo Multer → 422

## Critérios de conclusão
- [ ] Upload JPEG de 1MB → retorna URL acessível
- [ ] Upload de PDF → retorna 422
- [ ] Upload de 5MB → retorna 422
- [ ] Avatar anterior é deletado do disco ao fazer upload novo
- [ ] Member não faz upload de logo de projeto (403)
- [ ] Todos os cenários de teste passam
