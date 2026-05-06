function errorHandler(err, req, res, next) {
  console.error('Erro:', err.stack || err.message || err);
  const status = err.status || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message
  });
}

module.exports = errorHandler;