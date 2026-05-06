require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'https://fitcontrol-ailson.vercel.app';

// Segurança
app.use(helmet());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Muitas requisições. Tente novamente mais tarde.' }
}));

// CORS
const allowedOrigins = [CORS_ORIGIN];

if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173');
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Bloqueado pelo CORS'));
  },
  credentials: true
}));

// JSON body
app.use(express.json({ limit: '10mb' }));

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'FitControl Backend online'
  });
});

// Healthcheck
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Rotas da API
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/alunos', require('./routes/alunos.routes'));
app.use('/api', require('./routes/treinos.routes'));
app.use('/api', require('./routes/exercicios.routes'));
app.use('/api', require('./routes/avaliacoes.routes'));
app.use('/api', require('./routes/fotos.routes'));
app.use('/api', require('./routes/treino-modelo.routes'));
app.use('/api/export', require('./routes/export.routes'));

// Rota não encontrada
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// Tratamento global de erros
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});