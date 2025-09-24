// Configurações de proxy para resolver erros comuns
export const proxyConfig = {
  // Desabilitar proxy para localhost
  no_proxy: 'localhost,127.0.0.1,::1',

  // Headers obrigatórios para evitar problemas de CORS
  defaultHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  },

  // Configurações de timeout
  timeout: {
    request: 30000,  // 30 segundos
    connect: 10000,  // 10 segundos
    server: 300000   // 5 minutos
  },

  // Configurações do servidor
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || '0.0.0.0',
    trustProxy: true
  }
};

// Função para verificar se está sendo executado atrás de um proxy
export function isProxied(req) {
  return !!(
    req.headers['x-forwarded-for'] ||
    req.headers['x-forwarded-host'] ||
    req.headers['x-forwarded-proto'] ||
    req.headers['x-real-ip'] ||
    req.headers['cf-connecting-ip'] ||
    req.headers['x-client-ip']
  );
}

// Função para obter o IP real do cliente
export function getRealIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return (
    req.headers['x-real-ip'] ||
    req.headers['cf-connecting-ip'] ||
    req.headers['x-client-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
}

// Middleware para detectar e configurar proxy
export function proxyDetectionMiddleware(req, res, next) {
  const realIP = getRealIP(req);
  const proxied = isProxied(req);

  // Adicionar informações de proxy ao request
  req.clientIP = realIP;
  req.isProxied = proxied;

  // Log de debug para proxy
  if (proxied) {
    console.log(`[PROXY] Request from ${realIP} via proxy`);
    console.log(`[PROXY] Headers:`, {
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-forwarded-host': req.headers['x-forwarded-host'],
      'x-forwarded-proto': req.headers['x-forwarded-proto'],
      'x-real-ip': req.headers['x-real-ip']
    });
  }

  next();
}