const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticação JWT.
 * Injeta req.userId e req.userEmail no request autenticado.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  // CORRIGIDO: verificação de token vazio após split
  if (!token) {
    return res.status(401).json({ error: 'Token malformado' });
  }

  // CORRIGIDO: verificação de JWT_SECRET configurado
  if (!process.env.JWT_SECRET) {
    console.error('[Auth] JWT_SECRET não configurado!');
    return res.status(500).json({ error: 'Erro de configuração do servidor' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // CORRIGIDO: verificar se o payload tem os campos esperados
    if (!decoded.id) {
      return res.status(401).json({ error: 'Token com payload inválido' });
    }

    req.userId    = decoded.id;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    if (err.name === 'NotBeforeError') {
      return res.status(401).json({ error: 'Token ainda não válido' });
    }
    // Erro inesperado: passa para errorHandler global
    return next(err);
  }
}

module.exports = authMiddleware;