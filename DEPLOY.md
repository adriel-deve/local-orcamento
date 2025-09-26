# 🚀 Deploy Guide - Local Orçamentos

## 📋 Configuração do Banco de Dados Neon

### 1. Criar Banco no Neon
1. Acesse https://console.neon.tech/
2. Crie um novo projeto
3. Copie a connection string (DATABASE_URL)

### 2. Configurar Variáveis de Ambiente no Vercel
No painel do Vercel, adicione estas variáveis:

```bash
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
NODE_ENV=production
```

### 3. Executar Schema SQL
Execute o arquivo `db/schema-postgresql.sql` no console SQL do Neon:

```sql
-- Cotação principal com todos os campos
CREATE TABLE IF NOT EXISTS quotes (
  id SERIAL PRIMARY KEY,
  quote_code VARCHAR(32) NOT NULL UNIQUE,
  date DATE NOT NULL,
  company VARCHAR(255) NOT NULL,
  client VARCHAR(255) DEFAULT NULL,
  cnpj VARCHAR(20) DEFAULT NULL,
  machine_model VARCHAR(255) DEFAULT NULL,
  tech_spec TEXT DEFAULT NULL,
  principle TEXT DEFAULT NULL,
  representative VARCHAR(255) NOT NULL,
  supplier VARCHAR(255) NOT NULL,
  services VARCHAR(512) DEFAULT '',
  validity_days INTEGER DEFAULT 15,
  delivery_time VARCHAR(128) DEFAULT NULL,
  notes TEXT,
  status VARCHAR(32) DEFAULT 'Rascunho',
  contact_email VARCHAR(255) DEFAULT NULL,
  contact_phone VARCHAR(50) DEFAULT NULL,
  seller_name VARCHAR(255) DEFAULT NULL,
  equipment_image VARCHAR(512) DEFAULT NULL,
  include_payment_conditions BOOLEAN DEFAULT FALSE,
  payment_intro TEXT DEFAULT NULL,
  payment_usd_conditions TEXT DEFAULT NULL,
  payment_brl_intro TEXT DEFAULT NULL,
  payment_brl_with_sat TEXT DEFAULT NULL,
  payment_brl_without_sat TEXT DEFAULT NULL,
  payment_additional_notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Especificações
CREATE TABLE IF NOT EXISTS specs (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER NOT NULL,
  spec_index INTEGER NOT NULL,
  description TEXT,
  image_path VARCHAR(512) DEFAULT NULL,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
  UNIQUE(quote_id, spec_index)
);

-- Itens por especificação
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER NOT NULL,
  spec_index INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(12,2) DEFAULT 0,
  qty INTEGER DEFAULT 1,
  currency VARCHAR(10) DEFAULT 'BRL',
  days INTEGER DEFAULT NULL,
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

-- Índices auxiliares
CREATE INDEX IF NOT EXISTS idx_items_quote ON items (quote_id);
CREATE INDEX IF NOT EXISTS idx_specs_quote ON specs (quote_id);

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE
    ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 🌐 Deploy no Vercel

### Automático via GitHub
1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Manual
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## ✅ Funcionalidades Implementadas

- ✅ **Sistema Completo de Cotações**
- ✅ **Salvar Rascunho / Concluir Cotação**
- ✅ **Dashboard com Estatísticas**
- ✅ **Páginas Dedicadas para Rascunhos e Concluídas**
- ✅ **Carregar Cotação Existente no Formulário**
- ✅ **PDF Gerado Direto da Tela (Layout Idêntico)**
- ✅ **Condições de Pagamento Completas**
- ✅ **Interface Moderna e Responsiva**

## 🔧 Estrutura do Sistema

```
📁 Sistema de Status
├── Rascunho (pode editar/continuar)
├── Concluída (pode visualizar/duplicar)
└── Fluxo: Novo → Rascunho → Editar → Concluir

📁 Funcionalidades
├── Criar Nova Cotação
├── Salvar como Rascunho
├── Carregar Cotação Existente
├── Finalizar como Concluída
├── Gerar PDF da Pré-visualização
├── Gerenciar Rascunhos
└── Visualizar Concluídas
```

## 🎯 URLs do Sistema

- **Home**: `/`
- **Nova Cotação**: `/quotes/new`
- **Rascunhos**: `/quotes/drafts`
- **Concluídas**: `/quotes/completed`
- **API Lista**: `/quotes/list`
- **API Carregar**: `/quotes/load/:code`

Sistema completo e funcional! 🎉