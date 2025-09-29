import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import os from 'os';
import fs from 'fs';
import quotesRouter from './routes/quotes-router.js';
import { proxyConfig, proxyDetectionMiddleware } from '../proxy-config.js';
import { getAllQuotes, initDatabase } from './storage/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy settings for proper IP handling
app.set('trust proxy', true);

// View engine
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'ejs');

// Proxy detection middleware
app.use(proxyDetectionMiddleware);

// CORS and Security Headers
app.use((req, res, next) => {
  // Apply default headers from proxy config
  Object.entries(proxyConfig.defaultHeaders).forEach(([key, value]) => {
    res.header(key, value);
  });

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.clientIP || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  const proxyStatus = req.isProxied ? '[PROXY]' : '[DIRECT]';

  console.log(`[${timestamp}] ${proxyStatus} ${req.method} ${req.originalUrl || req.url} - IP: ${ip} - UA: ${userAgent.substring(0, 50)}`);

  // Add request timeout
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      console.error(`[${timestamp}] REQUEST TIMEOUT - ${req.method} ${req.url}`);
      res.status(408).json({ error: 'Request timeout' });
    }
  }, proxyConfig.timeout.request);

  res.on('finish', () => {
    clearTimeout(timeout);
    console.log(`[${new Date().toISOString()}] ${proxyStatus} ${req.method} ${req.url} - ${res.statusCode} - Completed`);
  });

  res.on('close', () => {
    clearTimeout(timeout);
    if (!res.finished) {
      console.log(`[${new Date().toISOString()}] ${proxyStatus} ${req.method} ${req.url} - Connection closed by client`);
    }
  });

  next();
});

// Static files - Root level for Vercel
const rootPath = process.cwd();
const tempRoot = path.join(os.tmpdir(), 'local-orcamentos');

console.log('Serving static files from root:', rootPath);

// Ensure writable directories exist when running in production
if (process.env.NODE_ENV === 'production') {
  fs.mkdirSync(tempRoot, { recursive: true });
}

// Serve CSS and JS directly from root folders
app.use('/css', express.static(path.join(rootPath, 'css'), {
  maxAge: process.env.NODE_ENV === 'production' ? 31536000000 : 0,
  setHeaders: (res, filePath) => {
    res.setHeader('Content-Type', 'text/css');
    if (process.env.NODE_ENV !== 'production') {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

app.use('/js', express.static(path.join(rootPath, 'js'), {
  maxAge: process.env.NODE_ENV === 'production' ? 31536000000 : 0,
  setHeaders: (res, filePath) => {
    res.setHeader('Content-Type', 'application/javascript');
    if (process.env.NODE_ENV !== 'production') {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// Fallback: serve public folder for any remaining static files
const publicPath = process.env.NODE_ENV === 'production' ?
  path.join(rootPath, 'public') :
  path.join(__dirname, '..', 'public');

app.use('/static', express.static(publicPath));

// Uploads and output folders
const uploadsPath = process.env.NODE_ENV === 'production' ?
  path.join(tempRoot, 'uploads') :
  path.join(__dirname, '..', 'uploads');

const outputPath = process.env.NODE_ENV === 'production' ?
  path.join(tempRoot, 'output') :
  path.join(__dirname, '..', 'output');

fs.mkdirSync(uploadsPath, { recursive: true });
fs.mkdirSync(outputPath, { recursive: true });

app.use('/uploads', express.static(uploadsPath));
app.use('/output', express.static(outputPath));

// Body parsing with better error handling
app.use(express.json({
  limit: '5mb',
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      console.error('JSON Parse Error:', e.message);
    }
  }
}));
app.use(express.urlencoded({
  extended: true,
  limit: '5mb'
}));

// Routes
app.get('/', async (req, res) => {
  try {
    const quotes = await getAllQuotes();
    res.render('index', { quotes });
  } catch (error) {
    console.error('Error loading quotes:', error);
    res.render('index', { quotes: [] });
  }
});
app.get('/health', (req, res) => res.status(200).send('ok'));
app.use('/quotes', quotesRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;

  console.error(`[${timestamp}] ERROR - IP: ${ip}`);
  console.error('Request:', req.method, req.url);
  console.error('Headers:', req.headers);
  console.error('Error:', err);

  // Handle different types of errors
  if (err.code === 'ECONNRESET') {
    console.error('Connection reset by client');
    return res.status(499).end();
  }

  if (err.code === 'ENOTFOUND') {
    console.error('DNS lookup failed');
    return res.status(502).json({ error: 'Proxy error: DNS lookup failed' });
  }

  if (err.code === 'ECONNREFUSED') {
    console.error('Connection refused');
    return res.status(502).json({ error: 'Proxy error: Connection refused' });
  }

  if (err.code === 'ETIMEDOUT') {
    console.error('Request timeout');
    return res.status(504).json({ error: 'Proxy error: Request timeout' });
  }

  // Generic error response
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Erro interno do servidor';

  if (req.accepts('json')) {
    res.status(status).json({
      error: message,
      timestamp,
      request_id: req.headers['x-request-id'] || 'unknown'
    });
  } else {
    res.status(status).send(`Erro ${status}: ${message}`);
  }
});

// 404 handler
app.use((req, res) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  console.log(`[${timestamp}] 404 - ${req.method} ${req.url} - IP: ${ip}`);

  if (req.accepts('json')) {
    res.status(404).json({ error: 'Recurso não encontrado' });
  } else {
    res.status(404).render('404');
  }
});

// Server startup with better error handling
const port = Number(proxyConfig.server.port);
const host = proxyConfig.server.host;

// Initialize database
try {
  await initDatabase();
  console.log('✅ Database initialized successfully');
} catch (error) {
  console.error('❌ Database initialization failed:', error.message);
}

const server = app.listen(port, host, () => {
  console.log(`Local Orçamentos rodando em http://localhost:${port}`);
  console.log(`Servidor iniciado em ${new Date().toISOString()}`);
  console.log(`Host: ${host}, Port: ${port}`);
  console.log(`Trust Proxy: ${proxyConfig.server.trustProxy}`);
  console.log(`No Proxy: ${proxyConfig.no_proxy}`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('Erro do servidor:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Porta ${port} já está em uso. Tente uma porta diferente.`);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Recebido SIGTERM, encerrando servidor...');
  server.close(() => {
    console.log('Servidor encerrado.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Recebido SIGINT, encerrando servidor...');
  server.close(() => {
    console.log('Servidor encerrado.');
    process.exit(0);
  });
});
