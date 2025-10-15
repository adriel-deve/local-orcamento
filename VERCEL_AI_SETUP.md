# 🚀 Configuração de IA na Vercel - Passo a Passo

## ⚠️ IMPORTANTE
O erro `require is not defined` que você está vendo é porque as **variáveis de ambiente não foram configuradas na Vercel**.

Siga este guia passo a passo para resolver:

---

## 📋 Passo 1: Acessar o Painel da Vercel

1. Abra seu navegador
2. Acesse: https://vercel.com/dashboard
3. Faça login com sua conta
4. Você verá uma lista dos seus projetos

---

## 📋 Passo 2: Abrir Configurações do Projeto

1. Procure o projeto **"local-orcamento"** na lista
2. Clique nele para abrir
3. No menu superior, clique em **"Settings"** (Configurações)

---

## 📋 Passo 3: Configurar Variáveis de Ambiente

1. No menu lateral esquerdo, clique em **"Environment Variables"**
2. Você verá uma página para adicionar variáveis

### **Adicionar NODE_ENV:**

1. No campo **"Key"** (Nome), digite: `NODE_ENV`
2. No campo **"Value"** (Valor), digite: `production`
3. Em **"Environment"**, deixe marcado: **Production**, **Preview**, e **Development**
4. Clique em **"Save"** (Salvar)

### **Adicionar GEMINI_API_KEY:**

1. Clique no botão **"Add Another"** (Adicionar Outra)
2. No campo **"Key"** (Nome), digite: `GEMINI_API_KEY`
3. No campo **"Value"** (Valor), cole: `AIzaSyCv9IYvOcycP7tXHzc-c2pJc3r9qyom0eo`
4. Em **"Environment"**, deixe marcado: **Production**, **Preview**, e **Development**
5. Clique em **"Save"** (Salvar)

### **Resultado esperado:**

Você deve ver 2 variáveis na lista:
```
NODE_ENV = production
GEMINI_API_KEY = AIzaSyCv9IYv... (truncado)
```

---

## 📋 Passo 4: Fazer Redeploy

Agora você precisa fazer um novo deploy para que as variáveis sejam aplicadas:

1. No menu superior, clique em **"Deployments"**
2. Você verá uma lista de deploys
3. No deploy mais recente (primeiro da lista), clique nos **3 pontinhos** `⋮` no lado direito
4. No menu que aparecer, clique em **"Redeploy"**
5. Na confirmação, clique em **"Redeploy"** novamente

### **Aguarde o deploy terminar:**
- O status mudará de "Building" → "Ready"
- Isso leva ~2-3 minutos
- Você verá um ✅ verde quando estiver pronto

---

## 📋 Passo 5: Testar se Está Funcionando

### **5.1. Verificar Status da IA**

Abra no navegador:
```
https://local-orcamento.vercel.app/ai-status
```

**Se estiver CORRETO**, você verá:
```json
{
  "success": true,
  "status": {
    "environment": "production",
    "aiEnabled": true,
    "hasApiKey": true,
    "apiKeyPreview": "AIzaSyCv9IYvOcycP7tX..."
  },
  "message": "✅ AI está configurada e funcionando!"
}
```

**Se ainda estiver ERRADO**, você verá:
```json
{
  "status": {
    "environment": "development",
    "aiEnabled": false,
    "hasApiKey": false
  }
}
```

Se estiver errado, volte ao **Passo 3** e verifique se as variáveis foram salvas corretamente.

---

### **5.2. Testar no Site**

1. Acesse: https://local-orcamento.vercel.app
2. Faça login
3. Vá em **"Nova Cotação"**
4. **VOCÊ DEVE VER** a seção roxa no topo:
   ```
   ✨ Extração Automática com IA
   ```
5. Se NÃO aparecer, significa que `NODE_ENV` não está configurado como `production`
6. Escolha um arquivo PDF ou imagem
7. Você deve ver o indicador:
   ```
   📎 arquivo.pdf (2.5 MB)
   ```
8. Clique em **"🤖 Extrair Dados"**
9. Aguarde ~5 segundos
10. O formulário deve ser preenchido automaticamente!

---

## 🐛 Solução de Problemas

### **Problema 1: Seção de IA não aparece**

**Causa:** `NODE_ENV` não está configurado como `production`

**Solução:**
1. Volte para Settings > Environment Variables
2. Verifique se `NODE_ENV = production`
3. Se não existir, adicione
4. Faça Redeploy

---

### **Problema 2: Erro "require is not defined"**

**Causa:** Deploy antigo ainda em cache

**Solução:**
1. Vá em Deployments
2. Verifique se o último deploy tem status **Ready** ✅
3. Se sim, faça um **Hard Refresh** no navegador:
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
4. Ou abra em aba anônima/privada

---

### **Problema 3: Erro 500 ao extrair dados**

**Causa:** `GEMINI_API_KEY` não configurada

**Solução:**
1. Volte para Settings > Environment Variables
2. Verifique se `GEMINI_API_KEY` existe
3. Verifique se o valor está correto: `AIzaSyCv9IYvOcycP7tXHzc-c2pJc3r9qyom0eo`
4. Faça Redeploy

---

### **Problema 4: Indicador de arquivo não aparece**

**Causa:** Código JavaScript não foi atualizado (cache do navegador)

**Solução:**
1. Faça **Hard Refresh**:
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
2. Ou limpe o cache do navegador
3. Ou abra em aba anônima

---

## ✅ Checklist Final

Antes de testar, certifique-se de que:

- [ ] `NODE_ENV = production` está configurado na Vercel
- [ ] `GEMINI_API_KEY = AIzaSyC...` está configurado na Vercel
- [ ] Você fez **Redeploy** depois de adicionar as variáveis
- [ ] O deploy mais recente está com status **Ready** ✅
- [ ] Você fez **Hard Refresh** (Ctrl+Shift+R) no navegador
- [ ] Você acessou `/ai-status` e viu `aiEnabled: true`

---

## 📞 Ainda com Problemas?

Se depois de seguir todos os passos ainda não funcionar:

1. Tire um **screenshot** da página Environment Variables mostrando as 2 variáveis
2. Tire um **screenshot** do erro que aparece no console (F12)
3. Acesse `/ai-status` e copie o JSON que aparece
4. Envie essas informações para análise

---

**🎉 Depois de configurar corretamente, a IA vai funcionar perfeitamente!**
