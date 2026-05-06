const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { sanitize, validateAuth } = require('../validators/validators');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// REGISTRO
router.post('/register', async (req, res, next) => {
  try {
    sanitize(req.body);
    const errors = validateAuth(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const { email, password } = req.body;
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Email já cadastrado' });

    const hash = await bcrypt.hash(password, 10);
    const result = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, hash);
    const token = jwt.sign({ id: result.lastInsertRowid, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: result.lastInsertRowid, email } });
  } catch (err) { next(err); }
});

// LOGIN
router.post('/login', async (req, res, next) => {
  try {
    sanitize(req.body);
    const errors = validateAuth(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) { next(err); }
});

// ME
router.get('/me', authMiddleware, (req, res, next) => {
  try {
    const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(req.userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json({ id: user.id, email: user.email });
  } catch (err) { next(err); }
});

module.exports = router;