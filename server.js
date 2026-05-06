require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Middleware de autenticação
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// Rota raiz
app.get('/', (req, res) => {
  res.json({ message: 'FitControl Backend online' });
});

// AUTH
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatórios' });
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Email já cadastrado' });
    const hash = await bcrypt.hash(password, 10);
    const result = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, hash);
    const token = jwt.sign({ id: result.lastInsertRowid }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: result.lastInsertRowid, email } });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// ALUNOS
app.get('/api/alunos', authMiddleware, (req, res) => {
  try {
    const alunos = db.prepare('SELECT * FROM alunos ORDER BY id DESC').all();
    res.json(alunos);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar alunos' });
  }
});

app.post('/api/alunos', authMiddleware, (req, res) => {
  try {
    const { nome, idade, peso, altura, objetivo, telefone, observacoes, gordura, cintura, quadril, torax, braco, coxa } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome obrigatório' });
    
    const result = db.prepare(`
      INSERT INTO alunos (nome, idade, peso, altura, objetivo, telefone, observacoes, gordura, cintura, quadril, torax, braco, coxa)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      nome,
      idade || null,
      peso || null,
      altura || null,
      objetivo || null,
      telefone || null,
      observacoes || null,
      gordura || null,
      cintura || null,
      quadril || null,
      torax || null,
      braco || null,
      coxa || null
    );
    
    const aluno = db.prepare('SELECT * FROM alunos WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(aluno);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cadastrar aluno' });
  }
});

app.put('/api/alunos/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM alunos WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Aluno não encontrado' });
    
    const { nome, idade, peso, altura, objetivo, telefone, observacoes, gordura, cintura, quadril, torax, braco, coxa } = req.body;
    
    db.prepare(`
      UPDATE alunos SET
        nome = ?, idade = ?, peso = ?, altura = ?, objetivo = ?, telefone = ?,
        observacoes = ?, gordura = ?, cintura = ?, quadril = ?, torax = ?, braco = ?, coxa = ?
      WHERE id = ?
    `).run(
      nome || existing.nome,
      idade !== undefined ? idade : existing.idade,
      peso !== undefined ? peso : existing.peso,
      altura !== undefined ? altura : existing.altura,
      objetivo !== undefined ? objetivo : existing.objetivo,
      telefone !== undefined ? telefone : existing.telefone,
      observacoes !== undefined ? observacoes : existing.observacoes,
      gordura !== undefined ? gordura : existing.gordura,
      cintura !== undefined ? cintura : existing.cintura,
      quadril !== undefined ? quadril : existing.quadril,
      torax !== undefined ? torax : existing.torax,
      braco !== undefined ? braco : existing.braco,
      coxa !== undefined ? coxa : existing.coxa,
      id
    );
    
    const updated = db.prepare('SELECT * FROM alunos WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar aluno' });
  }
});

app.delete('/api/alunos/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM alunos WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Aluno não encontrado' });
    db.prepare('DELETE FROM alunos WHERE id = ?').run(id);
    res.json({ message: 'Aluno excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir aluno' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});