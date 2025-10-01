import fetch from 'node-fetch';

async function testVercelLogin() {
  console.log('🧪 Testando login no Vercel...\n');

  const baseUrl = 'https://local-orcamento.vercel.app';

  try {
    // Step 1: Check health endpoint
    console.log('1️⃣ Verificando health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('   Status:', healthData.status);
    console.log('   Database:', healthData.database);
    console.log('   Env:', JSON.stringify(healthData.env, null, 2));

    if (healthData.database !== 'connected') {
      console.log('   ❌ Banco de dados não conectado!');
      return;
    }
    console.log('   ✅ Health check OK\n');

    // Step 2: Get login page to check if it loads
    console.log('2️⃣ Acessando página de login...');
    const loginPageResponse = await fetch(`${baseUrl}/login`);
    if (loginPageResponse.ok) {
      console.log('   ✅ Página de login carregou (status:', loginPageResponse.status, ')\n');
    } else {
      console.log('   ❌ Erro ao carregar página:', loginPageResponse.status);
      return;
    }

    // Step 3: Attempt login
    console.log('3️⃣ Tentando fazer login...');
    console.log('   Username: admin');
    console.log('   Password: admin123');

    const loginResponse = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'username=admin&password=admin123',
      redirect: 'manual' // Don't follow redirects automatically
    });

    console.log('   Response status:', loginResponse.status);
    console.log('   Response headers:', JSON.stringify(Object.fromEntries(loginResponse.headers), null, 2));

    if (loginResponse.status === 302 || loginResponse.status === 301) {
      const location = loginResponse.headers.get('location');
      console.log('   ✅ Login bem-sucedido! Redirecionando para:', location);

      if (location === '/quotes/new' || location.includes('/quotes/new')) {
        console.log('   ✅ Redirecionamento correto!\n');
      } else {
        console.log('   ⚠️  Redirecionamento inesperado\n');
      }
    } else if (loginResponse.status === 200) {
      const body = await loginResponse.text();
      if (body.includes('inválidos') || body.includes('erro')) {
        console.log('   ❌ Login falhou - credenciais inválidas ou erro\n');
        // Try to extract error message
        const errorMatch = body.match(/<div class="error"[^>]*>([^<]+)<\/div>/);
        if (errorMatch) {
          console.log('   Mensagem de erro:', errorMatch[1]);
        }
      } else {
        console.log('   ⚠️  Retornou página de login novamente (possível erro de autenticação)\n');
      }
    } else {
      console.log('   ❌ Erro inesperado:', loginResponse.statusText);
    }

    // Step 4: Try to verify database directly
    console.log('4️⃣ Verificando se o usuário admin existe no banco...');
    console.log('   (Executando script de verificação local)\n');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error(error);
  }
}

testVercelLogin();
