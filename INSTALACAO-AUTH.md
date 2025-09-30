# Instalação do Sistema de Autenticação

Este guia explica como instalar e configurar o sistema de autenticação multi-usuário no Local Orçamentos.

## Pré-requisitos

- Banco de dados PostgreSQL/Neon já configurado
- Node.js instalado
- Acesso ao banco de dados via DATABASE_URL

## Passos de Instalação

### 1. Instalar dependências

```bash
npm install
```

As dependências necessárias já estão no package.json:
- bcrypt: para hash de senhas
- express-session: gerenciamento de sessões
- connect-pg-simple: armazenamento de sessões no PostgreSQL

### 2. Executar scripts SQL no banco de dados

Execute os seguintes scripts SQL **na ordem**:

#### a) Criar tabela de usuários
```bash
psql $DATABASE_URL -f db/schema-users.sql
```

#### b) Adicionar coluna user_id à tabela quotes
```bash
psql $DATABASE_URL -f db/add-user-id-column.sql
```

#### c) Inicializar sistema de autenticação (tabela session e admin)
```bash
psql $DATABASE_URL -f db/init-auth-system.sql
```

### 3. Credenciais do Administrador Inicial

Após executar os scripts, você terá um usuário administrador:

- **Usuário**: `admin`
- **Senha**: `admin123`

⚠️ **IMPORTANTE**: Altere esta senha após o primeiro login!

### 4. Configurar SESSION_SECRET (Opcional)

Para produção, defina uma chave secreta personalizada no arquivo `.env.production`:

```
SESSION_SECRET=sua-chave-secreta-aleatoria-aqui
```

### 5. Iniciar o servidor

```bash
npm start
```

## Funcionalidades do Sistema de Autenticação

### Usuário Comum
- Pode criar e editar seus próprios rascunhos
- Vê apenas seus rascunhos
- Vê todas as cotações concluídas
- Não pode deletar cotações
- Não pode gerenciar usuários

### Administrador
- Pode criar, editar e deletar qualquer cotação
- Vê todos os rascunhos de todos os usuários
- Vê todas as cotações concluídas
- Pode gerenciar usuários (criar, editar, desativar)
- Acesso à interface de gerenciamento em `/users`

## Páginas Disponíveis

- `/login` - Página de login
- `/logout` - Fazer logout
- `/quotes/new` - Criar nova cotação (requer autenticação)
- `/quotes/:code` - Ver cotação específica (requer autenticação)
- `/users` - Gerenciar usuários (apenas admin)

## Comportamentos Especiais

### Salvar Rascunho
Ao salvar um rascunho, o sistema:
- Não redireciona mais para a página principal
- Permanece no formulário
- Exibe mensagem de sucesso com o código da cotação
- Associa automaticamente o rascunho ao usuário logado

### Filtro de Cotações
O sistema filtra automaticamente as cotações baseado no usuário:
- **Rascunhos**: Cada usuário vê apenas seus próprios
- **Concluídas**: Todos vêem todas as concluídas
- **Admin**: Vê tudo

## Solução de Problemas

### Erro: "relation 'users' does not exist"
Execute o script: `db/schema-users.sql`

### Erro: "column 'user_id' does not exist"
Execute o script: `db/add-user-id-column.sql`

### Erro: "relation 'session' does not exist"
Execute o script: `db/init-auth-system.sql`

### Não consigo fazer login
Verifique se o usuário admin foi criado corretamente:
```sql
SELECT * FROM users WHERE username = 'admin';
```

Se não existir, execute novamente: `db/init-auth-system.sql`
