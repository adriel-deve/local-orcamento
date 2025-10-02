import fetch from 'node-fetch';

async function testSessionPersistence() {
  console.log('🧪 Testando persistência de sessão no Vercel...\n');

  const baseUrl = 'https://local-orcamento.vercel.app';
  let sessionCookie = null;

  try {
    // Step 1: Login
    console.log('1️⃣ Fazendo login...');
    const loginResponse = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'username=admin&password=admin123',
      redirect: 'manual'
    });

    // Extract session cookie
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    if (setCookieHeader) {
      sessionCookie = setCookieHeader.split(';')[0]; // Get just the cookie value
      console.log('   ✅ Login bem-sucedido!');
      console.log('   Session cookie:', sessionCookie);
    } else {
      console.log('   ❌ Nenhum cookie de sessão retornado!');
      return;
    }

    // Step 2: Try to access protected route WITH cookie
    console.log('\n2️⃣ Acessando /quotes/new COM cookie de sessão...');
    const quotesResponse = await fetch(`${baseUrl}/quotes/new`, {
      headers: {
        'Cookie': sessionCookie
      },
      redirect: 'manual'
    });

    console.log('   Status:', quotesResponse.status);

    if (quotesResponse.status === 200) {
      console.log('   ✅ Acesso autorizado! Sessão está funcionando!');

      // Check if it's actually the quotes page, not login page
      const body = await quotesResponse.text();
      if (body.includes('Nova Cotação') || body.includes('Cotação')) {
        console.log('   ✅ Página de cotações carregada corretamente!');
      } else if (body.includes('login') || body.includes('Login')) {
        console.log('   ❌ Redirecionou para login - SESSÃO NÃO PERSISTIU');
      }
    } else if (quotesResponse.status === 302) {
      const location = quotesResponse.headers.get('location');
      console.log('   Redirecionando para:', location);

      if (location === '/login' || location.includes('/login')) {
        console.log('   ❌ Sessão não está sendo preservada!');
      } else {
        console.log('   ⚠️  Redirecionamento inesperado');
      }
    }

    // Step 3: Try accessing without cookie
    console.log('\n3️⃣ Acessando /quotes/new SEM cookie (teste de segurança)...');
    const unauthorizedResponse = await fetch(`${baseUrl}/quotes/new`, {
      redirect: 'manual'
    });

    console.log('   Status:', unauthorizedResponse.status);

    if (unauthorizedResponse.status === 302) {
      const location = unauthorizedResponse.headers.get('location');
      if (location === '/login' || location.includes('/login')) {
        console.log('   ✅ Corretamente redirecionado para login (proteção funcionando)');
      }
    }

    console.log('\n✅ Teste de sessão concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error(error);
  }
}

testSessionPersistence();
