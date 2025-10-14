import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import os from 'os';
import fs from 'fs';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pool from './db.js';
import pg from 'pg';
import quotesRouter from './routes/quotes-router.js';
import authRouter from './routes/auth-router.js';
import usersRouter from './routes/users-router.js';
import { setUserLocals, requireAuth } from './middleware/auth.js';
import { proxyConfig, proxyDetectionMiddleware } from '../proxy-config.js';
import { initDatabase } from './storage/database.js';

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

// Image folder
const imagePath = path.join(__dirname, '..', 'image');
app.use('/image', express.static(imagePath));

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

// Session configuration
let sessionConfig = {
  secret: process.env.SESSION_SECRET || 'pharmatec-orcamentos-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: 'lax'
  }
};

// Use PostgreSQL session store only if DATABASE_URL is provided (production/Vercel)
if (process.env.DATABASE_URL) {
  const { Pool: PgPool } = pg;
  const sessionPool = new PgPool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    max: 5
  });

  const PgSession = connectPgSimple(session);

  sessionConfig.store = new PgSession({
    pool: sessionPool,
    tableName: 'session',
    createTableIfMissing: false
  });
  sessionConfig.proxy = true; // Trust the reverse proxy (Vercel)

  console.log('Using PostgreSQL session store');
} else {
  console.log('Using memory session store (development only)');
}

app.use(session(sessionConfig));

// Set current user in locals for all views
app.use(setUserLocals);

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
  if (!req.session || !req.session.userId) {
    return res.redirect('/login');
  }

  // Renderizar dashboard
  try {
    res.render('index', {
      currentUser: {
        id: req.session.userId,
        username: req.session.username,
        fullName: req.session.fullName,
        role: req.session.userRole
      }
    });
  } catch (error) {
    console.error('Erro ao renderizar dashboard:', error);
    res.redirect('/quotes/new');
  }
});

app.get('/health', async (req, res) => {
  try {
    // Testar conexão com o banco
    await pool.execute('SELECT 1');
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
      env: {
        NODE_ENV: process.env.NODE_ENV,
        hasDatabase: !!process.env.DATABASE_URL,
        hasSessionSecret: !!process.env.SESSION_SECRET
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Auth routes
app.use('/', authRouter);
app.use('/users', usersRouter);

// Protected routes
app.use('/quotes', requireAuth, quotesRouter);

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
