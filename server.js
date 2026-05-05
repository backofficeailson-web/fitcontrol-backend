require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();

app.use(cors());
app.use(express.json());

const SECRET = "segredo123";

// ================= LOGIN =================

app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body;

  const hash = bcrypt.hashSync(password, 10);

  try {
    db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, hash);
    res.json({ message: 'Usuário criado' });
  } catch (err) {
    res.status(400).json({ error: 'Usuário já existe' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user) return res.status(400).json({ error: 'Usuário não encontrado' });

  const valid = bcrypt.compareSync(password, user.password);

  if (!valid) return res.status(400).json({ error: 'Senha inválida' });

  const token = jwt.sign({ id: user.id }, SECRET);

  res.json({ token });
});

// ================= ALUNOS =================

app.get('/api/alunos', (req, res) => {
  const alunos = db.prepare('SELECT * FROM alunos').all();
  res.json(alunos);
});

app.post('/api/alunos', (req, res) => {
  const { nome, idade, peso } = req.body;

  const result = db
    .prepare('INSERT INTO alunos (nome, idade, peso) VALUES (?, ?, ?)')
    .run(nome, idade, peso);

  res.json({ id: result.lastInsertRowid });
});

app.put('/api/alunos/:id', (req, res) => {
  const { nome, idade, peso } = req.body;

  db.prepare(`
    UPDATE alunos
    SET nome = ?, idade = ?, peso = ?
    WHERE id = ?
  `).run(nome, idade, peso, req.params.id);

  res.json({ message: 'Atualizado' });
});

app.delete('/api/alunos/:id', (req, res) => {
  db.prepare('DELETE FROM alunos WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deletado' });
});

// ================= SERVER =================
app.get("/", (req, res) => {
  res.send("FitControl Backend online");
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});