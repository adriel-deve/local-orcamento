# Plano de Implementação - Sistema de Autenticação

## Mudanças Implementadas

### 1. ✅ Correção de Layout
- Botões agora não sobrepõem (flex-wrap, max-width)

### 2. ✅ Preparação para Autenticação
- Adicionadas dependências: bcrypt, express-session, connect-pg-simple
- Criado schema de banco de dados para usuários

## Próximas Etapas (Requerem Implementação Completa)

### 3. Sistema de Autenticação

#### Arquivos a criar:
- `src/middleware/auth.js` - Middleware de autenticação
- `src/routes/auth-router.js` - Rotas de login/logout
- `src/routes/users-router.js` - Gerenciamento de usuários (admin)
- `src/services/auth-service.js` - Lógica de autenticação
- `views/login.ejs` - Página de login
- `views/users/index.ejs` - Listagem de usuários (admin)
- `views/users/new.ejs` - Criar novo usuário (admin)

#### Funcionalidades:
1. **Login/Logout**
   - Tela de login com username/password
   - Sessões com express-session + PostgreSQL
   - Hash de senhas com bcrypt

2. **Roles**
   - `admin`: Pode gerenciar usuários e deletar cotações concluídas
   - `user`: Pode criar/editar suas próprias cotações

3. **Gestão de Rascunhos**
   - Cada usuário vê apenas seus próprios rascunhos
   - Cotações concluídas são visíveis para todos

4. **Mudança no Salvamento**
   - Não redirecionar após salvar rascunho
   - Mostrar mensagem: "Rascunho salvo com sucesso! Código: COT-XXX"
   - Permanecer no formulário

### 4. Modificações no Banco de Dados

```sql
-- Executar no Neon:
ALTER TABLE quotes ADD COLUMN user_id INTEGER REFERENCES users(id);
CREATE INDEX idx_quotes_user ON quotes (user_id);
```

### 5. Atualizações nas Rotas Existentes

- Proteger todas as rotas com middleware de autenticação
- Filtrar rascunhos por user_id
- Permitir deletar cotações apenas se status='Concluída' e role='admin'

## Estimativa de Complexidade

Esta é uma mudança arquitetural significativa que requer:
- ~10-15 novos arquivos
- ~500-800 linhas de código
- ~2-3 horas de desenvolvimento
- Testes extensivos

## Recomendação

Devido à complexidade, sugiro implementar em fases:

**Fase 1**: Sistema básico de login
**Fase 2**: Gestão de usuários (admin)
**Fase 3**: Filtros de rascunhos por usuário
**Fase 4**: Permissões de deleção

Você gostaria que eu continue com a implementação completa ou prefere fazer isso em outra sessão?
