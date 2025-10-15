# 🤖 Configuração da IA para Extração Automática de Documentos

Este guia explica como configurar a funcionalidade de extração automática de documentos usando Google Gemini AI (GRATUITO).

## 📋 Visão Geral

A funcionalidade de IA permite:
- ✅ Upload de PDF, imagens ou documentos de cotação
- ✅ Extração automática de dados do cliente, itens, preços
- ✅ Preenchimento automático do formulário
- ✅ Extração de especificações técnicas
- ✅ TOTALMENTE GRATUITO (até 1 milhão de tokens/mês)

## 🔑 Passo 1: Obter Chave da API Google Gemini

### 1.1. Acesse o Google AI Studio
Abra seu navegador e vá para: **https://makersuite.google.com/app/apikey**

### 1.2. Faça Login
- Use sua conta Google (Gmail)
- Se não tiver uma conta Google, crie uma gratuitamente

### 1.3. Crie uma Nova Chave
1. Clique em **"Get API Key"** ou **"Create API Key"**
2. Selecione um projeto existente ou crie um novo
3. Clique em **"Create API key in new project"**
4. Sua chave será gerada instantaneamente

### 1.4. Copie a Chave
- A chave terá o formato: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX`
- **IMPORTANTE**: Copie e guarde esta chave em um local seguro
- Você não poderá ver a chave novamente depois de fechar a janela

## ⚙️ Passo 2: Configurar no Sistema

### 2.1. Abra o Arquivo .env
No diretório raiz do projeto, abra ou crie o arquivo `.env`

### 2.2. Adicione a Chave da API
Adicione a seguinte linha ao arquivo:

```env
GEMINI_API_KEY=SUA_CHAVE_AQUI
```

**Exemplo:**
```env
GEMINI_API_KEY=AIzaSyABC123def456GHI789jkl012MNO345pqr
```

### 2.3. Salve o Arquivo
Salve o arquivo `.env` e reinicie o servidor:

```bash
# Parar o servidor (Ctrl+C no terminal)
# Iniciar novamente
npm start
```

## 🎉 Passo 3: Testar a Funcionalidade

1. Acesse a página de **Nova Cotação**
2. Você verá uma nova seção roxa no topo: **"✨ Extração Automática com IA"**
3. Clique em **"Escolher arquivo"** e selecione um PDF ou imagem de cotação
4. Clique em **"🤖 Extrair Dados"**
5. Aguarde alguns segundos
6. O formulário será preenchido automaticamente! 🎉

## 📊 Formatos Suportados

### Arquivos Aceitos:
- ✅ PDF (.pdf)
- ✅ Imagens JPEG (.jpg, .jpeg)
- ✅ Imagens PNG (.png)
- ✅ Arquivos de texto (.txt)

### Tamanho Máximo:
- 10 MB por arquivo

### O que a IA Pode Extrair:
| Dado | Descrição |
|------|-----------|
| **Cliente** | Nome da empresa cliente |
| **CNPJ** | CNPJ da empresa (se disponível) |
| **Itens** | Descrição, quantidade e preço de produtos/serviços |
| **Especificações Técnicas** | Parâmetros técnicos do equipamento |
| **Prazo de Entrega** | Tempo estimado para entrega |
| **Observações** | Notas importantes da cotação |
| **Princípio de Funcionamento** | Descrição de como o equipamento funciona |

## 💰 Custos

### Plano Gratuito do Google Gemini:
- **✅ GRATUITO até 1 milhão de tokens/mês**
- 1 cotação típica = ~2.000-5.000 tokens
- **Você pode processar ~200-500 cotações/mês GRÁTIS**
- Sem necessidade de cartão de crédito
- Sem taxas ocultas

### Se Exceder o Limite Gratuito:
- O sistema mostrará uma mensagem de erro
- Você pode aguardar o próximo mês (limite renova automaticamente)
- Ou atualizar para um plano pago (muito barato: ~$3 por milhão de tokens adicionais)

## 🔒 Segurança

### ⚠️ IMPORTANTE - Proteção da Chave da API:

1. **NUNCA** compartilhe sua chave da API publicamente
2. **NUNCA** faça commit do arquivo `.env` no Git
3. O arquivo `.env` já está no `.gitignore` (não será enviado ao GitHub)
4. Se você acidentalmente expor sua chave:
   - Vá para https://makersuite.google.com/app/apikey
   - Delete a chave comprometida
   - Crie uma nova chave imediatamente

### Dados Enviados para a IA:
- Apenas o conteúdo do documento que você faz upload
- Nenhum dado pessoal adicional é enviado
- A Google Gemini API segue as políticas de privacidade da Google
- Documentos não são armazenados permanentemente pela Google

## 🛠️ Solução de Problemas

### Problema: "Serviço de IA não configurado"
**Solução:**
- Verifique se a chave está correta no arquivo `.env`
- Certifique-se de que não há espaços extras antes/depois da chave
- Reinicie o servidor após adicionar a chave

### Problema: "Erro ao processar documento"
**Possíveis causas:**
- Arquivo muito grande (máximo 10MB)
- Formato não suportado
- Documento de baixa qualidade (imagem borrada)
- Limite de API excedido

**Soluções:**
- Reduza o tamanho do arquivo
- Use um formato suportado (PDF, JPG, PNG)
- Use uma imagem de melhor qualidade
- Aguarde até o próximo mês se excedeu o limite

### Problema: Dados extraídos incorretamente
**Solução:**
- A IA pode não reconhecer todos os dados perfeitamente
- Revise e corrija os campos preenchidos manualmente
- Documentos bem formatados e legíveis têm melhores resultados
- Use documentos com texto claro e estrutura organizada

## 📞 Suporte

Se você tiver problemas:
1. Verifique se seguiu todos os passos acima
2. Consulte os logs do servidor para mensagens de erro
3. Verifique o console do navegador (F12) para erros JavaScript
4. Entre em contato com o suporte técnico

## 🎯 Dicas para Melhores Resultados

### ✅ Documentos Ideais:
- PDFs gerados digitalmente (não escaneados)
- Texto claro e legível
- Estrutura organizada (títulos, tabelas)
- Boa resolução de imagem (mínimo 300 DPI)

### ❌ Evite:
- Documentos manuscritos
- Imagens muito borradas ou escuras
- PDFs escaneados de baixa qualidade
- Documentos com muitas marcações ou anotações

---

**🚀 Pronto! Agora você pode usar IA para acelerar a criação de cotações!**
