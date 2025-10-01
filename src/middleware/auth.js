// Authentication middleware

export function requireAuth(req, res, next) {
  console.log('[AUTH MIDDLEWARE] Checking authentication for:', req.url);
  console.log('[AUTH MIDDLEWARE] Session exists:', !!req.session);
  console.log('[AUTH MIDDLEWARE] Session userId:', req.session?.userId);
  console.log('[AUTH MIDDLEWARE] Session ID:', req.sessionID);

  if (req.session && req.session.userId) {
    console.log('[AUTH MIDDLEWARE] ✅ User authenticated:', req.session.username);
    return next();
  }

  console.log('[AUTH MIDDLEWARE] ❌ Not authenticated, redirecting to /login');
  return res.redirect('/login');
}

export function requireAdmin(req, res, next) {
  if (req.session && req.session.userId && req.session.userRole === 'admin') {
    return next();
  }
  return res.status(403).send('Acesso negado. Apenas administradores.');
}

export function setUserLocals(req, res, next) {
  res.locals.currentUser = req.session.userId ? {
    id: req.session.userId,
    username: req.session.username,
    fullName: req.session.fullName,
    role: req.session.userRole
  } : null;
  next();
}

export function redirectIfAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return res.redirect('/quotes/new');
  }
  next();
}
