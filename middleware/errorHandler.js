/**
 * Middleware global de tratamento de erros.
 * Deve ser o ÚLTIMO middleware registrado no server.js.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // CORRIGIDO: log estruturado com contexto da requisição
  console.error('[ErrorHandler]', {
    method: req.method,
    url:    req.originalUrl,
    status: err.status || 500,
    message: err.message,
    // Stack só em desenvolvimento
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });

  // CORRIGIDO: erro CORS especifico
  if (err.message === 'Bloqueado pelo CORS') {
    return res.status(403).json({ error: 'Origem não permitida' });
  }

  // CORRIGIDO: erro de payload JSON malformado (SyntaxError do express.json)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'JSON inválido no corpo da requisição' });
  }

  const status = err.status || err.statusCode || 500;

  res.status(status).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor'
      : (err.message || 'Erro desconhecido')
  });
}

module.exports = errorHandler;