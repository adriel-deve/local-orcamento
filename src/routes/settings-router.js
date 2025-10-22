import express from 'express';
import { getAllSettings, updateMultipleSettings, getSettingsByCategory } from '../services/settings-service.js';

const router = express.Router();

// Middleware para verificar se é admin
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.redirect('/login');
  }

  if (req.session.userRole !== 'admin') {
    return res.status(403).render('403', {
      message: 'Acesso negado. Apenas administradores podem acessar esta página.'
    });
  }

  next();
}

// Página de configurações (GET)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const settings = await getAllSettings();

    // Agrupar por categoria
    const settingsByCategory = {
      quote: [],
      payment: [],
      contact: [],
      services: [],
      import: []
    };

    settings.forEach(setting => {
      if (settingsByCategory[setting.category]) {
        settingsByCategory[setting.category].push(setting);
      }
    });

    res.render('settings/index', {
      settings: settingsByCategory,
      success: req.query.success === 'true'
    });
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    res.status(500).send('Erro ao carregar configurações');
  }
});

// Salvar configurações (POST)
router.post('/save', requireAdmin, async (req, res) => {
  try {
    const userId = req.session.userId;
    const settings = req.body;

    console.log('[SETTINGS] Salvando configurações:', settings);

    await updateMultipleSettings(settings, userId);

    console.log('[SETTINGS] Configurações salvas com sucesso');
    res.redirect('/settings?success=true');
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    res.status(500).send('Erro ao salvar configurações');
  }
});

export default router;
