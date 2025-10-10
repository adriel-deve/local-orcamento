# Configuração do Cloudinary

O sistema agora usa Cloudinary para armazenar as imagens dos equipamentos de forma persistente.

## Por que Cloudinary?

Na Vercel, o sistema de arquivos é **efêmero** (temporário). Isso significa que:
- ❌ Imagens salvas localmente são perdidas após reiniciar o servidor
- ❌ A cada deploy, todas as imagens são apagadas
- ✅ Cloudinary armazena as imagens permanentemente na nuvem

## Como configurar (Gratuito!)

### 1. Criar conta no Cloudinary

1. Acesse: https://cloudinary.com/users/register/free
2. Preencha o formulário de cadastro
3. Confirme seu email

### 2. Obter as credenciais

1. Faça login em: https://console.cloudinary.com/console
2. Na página inicial (Dashboard), você verá:
   - **Cloud name** (ex: `dxxxxxxxx`)
   - **API Key** (ex: `123456789012345`)
   - **API Secret** (ex: `abcdefghijk...`) - clique em "Show" para revelar

### 3. Configurar as variáveis de ambiente

#### No arquivo `.env` (local):

```env
CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=seu_api_key
CLOUDINARY_API_SECRET=seu_api_secret
```

#### Na Vercel (produção):

1. Acesse seu projeto na Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione as 3 variáveis:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
4. Clique em **Save**
5. Faça um novo deploy (ou aguarde o próximo push)

## Plano Gratuito

O plano gratuito do Cloudinary inclui:
- ✅ 25 GB de armazenamento
- ✅ 25 GB de bandwidth/mês
- ✅ Transformações de imagem ilimitadas
- ✅ Sem limite de uploads

Isso é mais que suficiente para um sistema de cotações!

## Como funciona

Quando você faz upload de uma imagem de equipamento:
1. A imagem é enviada para o Cloudinary
2. O Cloudinary retorna uma URL permanente (ex: `https://res.cloudinary.com/...`)
3. Essa URL é salva no banco de dados
4. A imagem fica disponível para sempre, mesmo após reiniciar o servidor

## Benefícios adicionais

- 🚀 CDN global (imagens carregam rápido em qualquer lugar)
- 🔄 Otimização automática de imagens
- 📦 Redimensionamento automático
- 💾 Backup automático
