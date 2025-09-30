# Próximos Passos para Finalizar o Sistema de Autenticação

## ✅ Já Implementado

1. **Middleware de Autenticação** (`src/middleware/auth.js`)
2. **Serviço de Autenticação** (`src/services/auth-service.js`)
3. **Rotas de Login/Logout** (`src/routes/auth-router.js`)
4. **Rotas de Gerenciamento de Usuários** (`src/routes/users-router.js`)
5. **Página de Login** (`views/login.ejs`)
6. **Páginas de Usuários** (`views/users/*.ejs`)
7. **Schema de Banco de Dados** (`db/schema-users.sql`)

## ⏳ Falta Fazer

### 1. Instalar Dependências

```bash
cd c:\Users\Adrie\.vscode\local-orcamentos
npm install
```

Isso instalará:
- `bcrypt` - Para hash de senhas
- `express-session` - Para gerenciar sessões
- `connect-pg-simple` - Para armazenar sessões no PostgreSQL

### 2. Atualizar `src/app.js`

Adicionar ANTES da linha `app.use(express.json({...`:

```javascript
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pool from './db.js';
import authRouter from './routes/auth-router.js';
import usersRouter from './routes/users-router.js';
import { setUserLocals, requireAuth } from './middleware/auth.js';

const PgSession = connectPgSimple(session);

// Session configuration
app.use(session({
  store: new PgSession({
    pool: pool,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
}));

// Set current user in locals for all views
app.use(setUserLocals);
```

Atualizar a rota raiz (linha 145):

```javascript
app.get('/', requireAuth, async (req, res) => {
  res.redirect('/quotes/new');
});
```

Adicionar as novas rotas ANTES de `app.use('/quotes', quotesRouter)`:

```javascript
app.use('/', authRouter);
app.use('/users', usersRouter);
```

Proteger as rotas de quotes:

```javascript
app.use('/quotes', requireAuth, quotesRouter);
```

### 3. Executar Schema no Banco Neon

No Neon SQL Editor, executar:

```sql
-- 1. Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Adicionar coluna user_id em quotes
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_quotes_user ON quotes (user_id);

-- 3. Criar trigger para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE
    ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Criar tabela de sessões (para express-session)
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  PRIMARY KEY ("sid")
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- 5. Criar usuário admin padrão
-- Senha: admin123
INSERT INTO users (username, password_hash, full_name, role, email)
VALUES ('admin', '$2b$10$rKZE8VQ5YvJvKkqZ5V5V0eYZBxYUDZXFZYlvFZYUDZXFZYlvFZYU2', 'Administrador', 'admin', 'admin@pharmatec.com')
ON CONFLICT (username) DO NOTHING;
```

**IMPORTANTE**: Você precisará gerar um hash real para a senha. Execute localmente:

```javascript
import bcrypt from 'bcrypt';
const hash = await bcrypt.hash('admin123', 10);
console.log(hash);
```

### 4. Atualizar Rota de Salvar Rascunho

Em `src/routes/quotes-router.js`, procurar pela rota POST `/save` e modificar para:

```javascript
// Salvar e redirecionar agora salva com user_id
quote.user_id = req.session.userId;

// ... após salvar ...

// Não redirecionar, apenas retornar JSON
return res.json({
  success: true,
  message: `Rascunho salvo com sucesso! Código: ${quote.quote_code}`,
  quote_code: quote.quote_code
});
```

### 5. Filtrar Rascunhos por Usuário

Atualizar `src/storage/database.js` função `getAllQuotes`:

```javascript
export async function getAllQuotes(userId = null, role = null) {
  let query = 'SELECT * FROM quotes';
  const params = [];

  // Admin vê todas as cotações concluídas
  // User vê suas próprias cotações (todos os status)
  if (role === 'admin') {
    query += " WHERE status = 'Concluída'";
  } else if (userId) {
    query += " WHERE user_id = $1";
    params.push(userId);
  }

  query += ' ORDER BY updated_at DESC';

  const result = await pool.query(query, params);
  return result.rows;
}
```

### 6. Adicionar Links de Navegação

Em `views/quotes/new.ejs`, adicionar no topo:

```html
<div style="padding: 10px; background: #f3f4f6;">
  Olá, <%= currentUser.fullName %>
  <% if (currentUser.role === 'admin') { %>
    | <a href="/users">Gerenciar Usuários</a>
  <% } %>
  | <a href="/quotes">Minhas Cotações</a>
  | <a href="/logout">Sair</a>
</div>
```

### 7. Testar o Sistema

1. `npm install`
2. Executar SQL no Neon
3. `npm start`
4. Acessar http://localhost:3001
5. Fazer login com admin/admin123
6. Criar novos usuários
7. Testar salvamento de rascunhos
8. Testar permissões

## 🎯 Resultado Final

- ✅ Login/logout funcionando
- ✅ Admin pode gerenciar usuários
- ✅ Usuários veem apenas seus rascunhos
- ✅ Cotações concluídas visíveis para todos
- ✅ Salvamento mostra mensagem sem redirecionar
- ✅ Permissões por role (admin/user)
