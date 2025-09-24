# Vercel Development Workflow

## Para desenvolvimento sem fazer deploy a cada mudança:

### 1. Usando Vercel CLI para desenvolvimento local:
```bash
# Login na Vercel (uma vez)
vercel login

# Link com o projeto da Vercel (uma vez)
vercel link

# Executar em modo desenvolvimento local
vercel dev
```

### 2. Usando desenvolvimento local normal:
```bash
# Executar localmente
npm start
# Acessa em http://localhost:3001
```

### 3. Para fazer deploy apenas quando necessário:
```bash
# Deploy para preview (branch)
vercel

# Deploy para produção
vercel --prod
```

## Configuração de ambiente:

1. **Local (.env)**:
   - DATABASE_URL com Neon
   - NODE_ENV=development

2. **Vercel (Environment Variables)**:
   - DATABASE_URL=sua_neon_url
   - NODE_ENV=production

## Workflow recomendado:

1. Desenvolver localmente com `npm start`
2. Testar com `vercel dev` (simula ambiente Vercel)
3. Fazer deploy apenas quando estável com `vercel --prod`