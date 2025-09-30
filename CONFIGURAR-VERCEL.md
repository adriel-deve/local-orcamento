# Configuração das Variáveis de Ambiente no Vercel

Para o sistema funcionar corretamente no Vercel, você precisa adicionar as seguintes variáveis de ambiente:

## Como adicionar no Vercel:

1. Acesse: https://vercel.com/seu-usuario/local-orcamento/settings/environment-variables
2. Adicione cada variável abaixo:

## Variáveis Necessárias:

### 1. DATABASE_URL (OBRIGATÓRIO)
```
DATABASE_URL=postgresql://neondb_owner:npg_nk0EB9PqrCQV@ep-ancient-voice-adoo5ffm-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```
**Importante:** Disponível em todos os ambientes (Production, Preview, Development)

### 2. SESSION_SECRET (OBRIGATÓRIO)
```
SESSION_SECRET=pharmatec-orcamentos-secret-key-change-in-production-2024
```
**Importante:** Disponível em todos os ambientes (Production, Preview, Development)

### 3. NODE_ENV (OBRIGATÓRIO)
```
NODE_ENV=production
```
**Importante:** Disponível apenas em Production

### 4. DB_TYPE (OBRIGATÓRIO)
```
DB_TYPE=postgresql
```
**Importante:** Disponível em todos os ambientes (Production, Preview, Development)

## Após adicionar as variáveis:

1. Clique em "Save" para cada variável
2. Faça um novo deploy (ou espere o deploy automático após o próximo commit)
3. Teste o login em: https://local-orcamento.vercel.app/login

## Credenciais de teste:
- Usuário: `admin`
- Senha: `admin123`

## Se ainda não funcionar:

Verifique os logs do Vercel:
1. Acesse: https://vercel.com/seu-usuario/local-orcamento/deployments
2. Clique no último deployment
3. Vá em "Functions" e veja os logs
4. Procure por erros relacionados a banco de dados ou sessão
