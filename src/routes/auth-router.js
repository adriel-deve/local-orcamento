import express from 'express';
import { authenticateUser } from '../services/auth-service.js';
import { redirectIfAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Login page
router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('login', { error: null });
});

// Login POST
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  console.log('[AUTH] Login attempt for username:', username);

  if (!username || !password) {
    console.log('[AUTH] Missing username or password');
    return res.render('login', { error: 'Por favor, preencha todos os campos.' });
  }

  try {
    console.log('[AUTH] Attempting to authenticate user');
    const user = await authenticateUser(username, password);

    if (!user) {
      console.log('[AUTH] Authentication failed - invalid credentials');
      return res.render('login', { error: 'Usuário ou senha inválidos.' });
    }

    console.log('[AUTH] Authentication successful for user:', user.username);

    // Set session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.fullName = user.full_name;
    req.session.userRole = user.role;

    console.log('[AUTH] Session set, redirecting to /quotes/new');
    res.redirect('/quotes/new');
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    res.render('login', { error: 'Erro ao fazer login. Tente novamente.' });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
});

export default router;
