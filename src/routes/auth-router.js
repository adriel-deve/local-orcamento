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
  const startTime = Date.now();
  const { username, password } = req.body;

  console.log('[AUTH] Login attempt for username:', username);

  if (!username || !password) {
    console.log('[AUTH] Missing username or password');
    return res.render('login', { error: 'Por favor, preencha todos os campos.' });
  }

  try {
    console.log('[AUTH] Attempting to authenticate user...');
    const authStart = Date.now();
    const user = await authenticateUser(username, password);
    console.log(`[AUTH] Authentication completed in ${Date.now() - authStart}ms`);

    if (!user) {
      console.log('[AUTH] Authentication failed - invalid credentials');
      return res.render('login', { error: 'Usuário ou senha inválidos.' });
    }

    console.log('[AUTH] Authentication successful for user:', user.username);

    // Set session
    console.log('[AUTH] Setting session values...');
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.fullName = user.full_name;
    req.session.userRole = user.role;

    console.log('[AUTH] Session values set:', {
      userId: req.session.userId,
      username: req.session.username,
      sessionID: req.sessionID
    });

    // Save session explicitly before redirect
    console.log('[AUTH] Saving session...');
    const saveStart = Date.now();
    req.session.save((err) => {
      console.log(`[AUTH] Session save callback executed in ${Date.now() - saveStart}ms`);

      if (err) {
        console.error('[AUTH] Error saving session:', err);
        return res.render('login', { error: 'Erro ao salvar sessão. Tente novamente.' });
      }

      const totalTime = Date.now() - startTime;
      console.log(`[AUTH] Session saved successfully in ${totalTime}ms total, redirecting to dashboard`);
      res.redirect('/');
    });
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    console.error('[AUTH] Error stack:', error.stack);
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
