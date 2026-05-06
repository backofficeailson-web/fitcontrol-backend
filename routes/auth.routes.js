const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../database');
const { sanitize, validateAuth } = require('../validators/validators');
const authMiddleware             = require('../middleware/auth');

const router = express.Router();

// ─── REGISTRO ─────────────────────────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    // CORRIGIDO: sanitize retorna cópia, não muta req.body
    const body   = sanitize(req.body);
    const errors = validateAuth(body);
    if (errors.length) return res.status(400).json({ errors });

    const { email, password } = body;

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) return res.status(409).json({ error: 'Email já cadastrado' });

    // CORRIGIDO: armazenar email normalizado (lowercase)
    const hash   = await bcrypt.hash(password, 12); // CORRIGIDO: 12 rounds (10 é mínimo aceitável, 12 é padrão seguro)
    const result = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email.toLowerCase(), hash);

    const token = jwt.sign(
      { id: result.lastInsertRowid, email: email.toLowerCase() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: { id: result.lastInsertRowid, email: email.toLowerCase() }
    });
  } catch (err) {
    next(err);
  }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const body   = sanitize(req.body);
    const errors = validateAuth(body);
    if (errors.length) return res.status(400).json({ errors });

    const { email, password } = body;

    // CORRIGIDO: buscar por email lowercase
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());

    // CORRIGIDO: comparar hash mesmo quando usuário não existe (evita timing attack)
    const dummyHash = '$2a$12$invalidhashfortimingnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn';
    const valid = user
      ? await bcrypt.compare(password, user.password)
      : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!user || !valid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    next(err);
  }
});

// ─── ME (dados do usuário logado) ────────────────────────────────────────────
router.get('/me', authMiddleware, (req, res, next) => {
  try {
    const user = db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(req.userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    return res.json(user);
  } catch (err) {
    next(err);
  }
});

// ─── REFRESH TOKEN (preparado para Fase 2) ───────────────────────────────────
// TODO: implementar refresh token com rotação segura na Fase 2
// router.post('/refresh', ...)

module.exports = router;