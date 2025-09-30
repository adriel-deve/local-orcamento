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

  if (!username || !password) {
    return res.render('login', { error: 'Por favor, preencha todos os campos.' });
  }

  try {
    const user = await authenticateUser(username, password);

    if (!user) {
      return res.render('login', { error: 'Usuário ou senha inválidos.' });
    }

    // Set session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.fullName = user.full_name;
    req.session.userRole = user.role;

    res.redirect('/quotes/new');
  } catch (error) {
    console.error('Login error:', error);
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
