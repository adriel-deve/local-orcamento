import { authenticateUser } from '../services/auth-service.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente de produção
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.production') });

async function testLogin() {
  console.log('🧪 Testando sistema de autenticação...\n');

  try {
    // Testar login com credenciais corretas
    console.log('1️⃣ Testando login com credenciais corretas:');
    console.log('   Username: admin');
    console.log('   Password: admin123');

    const user = await authenticateUser('admin', 'admin123');

    if (user) {
      console.log('   ✅ Login bem-sucedido!');
      console.log('   Dados do usuário:');
      console.log('      - ID:', user.id);
      console.log('      - Username:', user.username);
      console.log('      - Nome:', user.full_name);
      console.log('      - Email:', user.email);
      console.log('      - Role:', user.role);
      console.log('      - Ativo:', user.active);
    } else {
      console.log('   ❌ Login falhou (retornou null)');
    }

    // Testar login com senha incorreta
    console.log('\n2️⃣ Testando login com senha incorreta:');
    console.log('   Username: admin');
    console.log('   Password: senhaerrada');

    const userInvalid = await authenticateUser('admin', 'senhaerrada');

    if (userInvalid) {
      console.log('   ❌ ERRO: Login deveria falhar mas foi bem-sucedido!');
    } else {
      console.log('   ✅ Login corretamente negado (retornou null)');
    }

    // Testar login com usuário inexistente
    console.log('\n3️⃣ Testando login com usuário inexistente:');
    console.log('   Username: usuario_que_nao_existe');
    console.log('   Password: qualquersenha');

    const userNotFound = await authenticateUser('usuario_que_nao_existe', 'qualquersenha');

    if (userNotFound) {
      console.log('   ❌ ERRO: Login deveria falhar mas foi bem-sucedido!');
    } else {
      console.log('   ✅ Login corretamente negado (retornou null)');
    }

    console.log('\n✅ Todos os testes passaram!');
    console.log('\n🔗 Sistema de autenticação está funcionando corretamente.');
    console.log('   Você pode fazer login com:');
    console.log('   - Usuário: admin');
    console.log('   - Senha: admin123');

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.message);
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

testLogin();
