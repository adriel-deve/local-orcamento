import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { getAllUsers, createUser, getUserById, updateUser, deleteUser, changePassword } from '../services/auth-service.js';

const router = express.Router();

// All routes require admin
router.use(requireAdmin);

// List all users
router.get('/', async (req, res) => {
  try {
    const users = await getAllUsers();
    res.render('users/index', { users, message: req.query.message });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).send('Erro ao listar usuários');
  }
});

// New user form
router.get('/new', (req, res) => {
  res.render('users/new', { error: null });
});

// Create user
router.post('/', async (req, res) => {
  const { username, password, fullName, email, role } = req.body;

  if (!username || !password || !fullName) {
    return res.render('users/new', { error: 'Por favor, preencha todos os campos obrigatórios.' });
  }

  try {
    await createUser({ username, password, fullName, email, role: role || 'user' });
    res.redirect('/users?message=Usuário criado com sucesso!');
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === '23505') { // Unique violation
      return res.render('users/new', { error: 'Nome de usuário já existe.' });
    }
    res.render('users/new', { error: 'Erro ao criar usuário.' });
  }
});

// Edit user form
router.get('/:id/edit', async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).send('Usuário não encontrado');
    }
    res.render('users/edit', { user, error: null });
  } catch (error) {
    console.error('Error loading user:', error);
    res.status(500).send('Erro ao carregar usuário');
  }
});

// Update user
router.post('/:id', async (req, res) => {
  const { fullName, email, role, active } = req.body;

  try {
    await updateUser(req.params.id, {
      fullName,
      email,
      role,
      active: active === 'true'
    });
    res.redirect('/users?message=Usuário atualizado com sucesso!');
  } catch (error) {
    console.error('Error updating user:', error);
    const user = await getUserById(req.params.id);
    res.render('users/edit', { user, error: 'Erro ao atualizar usuário.' });
  }
});

// Delete user
router.post('/:id/delete', async (req, res) => {
  try {
    // Don't allow deleting yourself
    if (parseInt(req.params.id) === req.session.userId) {
      return res.redirect('/users?message=Você não pode deletar seu próprio usuário!');
    }

    await deleteUser(req.params.id);
    res.redirect('/users?message=Usuário desativado com sucesso!');
  } catch (error) {
    console.error('Error deleting user:', error);
    res.redirect('/users?message=Erro ao desativar usuário.');
  }
});

export default router;
