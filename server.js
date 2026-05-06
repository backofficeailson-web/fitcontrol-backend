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

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Token não fornecido' });
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

app.get('/', (req, res) => res.json({ message: 'FitControl Backend online' }));

// AUTH
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatórios' });
    if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) return res.status(409).json({ error: 'Email já cadastrado' });
    const hash = await bcrypt.hash(password, 10);
    const result = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, hash);
    const token = jwt.sign({ id: result.lastInsertRowid }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: result.lastInsertRowid, email } });
  } catch (e) { res.status(500).json({ error: 'Erro ao registrar' }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Credenciais inválidas' });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (e) { res.status(500).json({ error: 'Erro ao fazer login' }); }
});

// ALUNOS
app.get('/api/alunos', auth, (req, res) => {
  try { res.json(db.prepare('SELECT * FROM alunos ORDER BY id DESC').all()); }
  catch (e) { res.status(500).json({ error: 'Erro ao buscar alunos' }); }
});

app.post('/api/alunos', auth, (req, res) => {
  try {
    const { nome, idade, peso, altura, objetivo, telefone, observacoes, gordura, cintura, quadril, torax, braco, coxa } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome obrigatório' });
    const result = db.prepare(`INSERT INTO alunos (nome, idade, peso, altura, objetivo, telefone, observacoes, gordura, cintura, quadril, torax, braco, coxa)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(nome, idade||null, peso||null, altura||null, objetivo||null, telefone||null,
      observacoes||null, gordura||null, cintura||null, quadril||null, torax||null, braco||null, coxa||null);
    res.status(201).json(db.prepare('SELECT * FROM alunos WHERE id = ?').get(result.lastInsertRowid));
  } catch (e) { res.status(500).json({ error: 'Erro ao cadastrar aluno' }); }
});

app.put('/api/alunos/:id', auth, (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM alunos WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Aluno não encontrado' });
    const d = req.body;
    db.prepare(`UPDATE alunos SET nome=?, idade=?, peso=?, altura=?, objetivo=?, telefone=?, observacoes=?, gordura=?, cintura=?, quadril=?, torax=?, braco=?, coxa=? WHERE id=?`)
      .run(d.nome||existing.nome, d.idade!==undefined?d.idade:existing.idade, d.peso!==undefined?d.peso:existing.peso,
        d.altura!==undefined?d.altura:existing.altura, d.objetivo!==undefined?d.objetivo:existing.objetivo,
        d.telefone!==undefined?d.telefone:existing.telefone, d.observacoes!==undefined?d.observacoes:existing.observacoes,
        d.gordura!==undefined?d.gordura:existing.gordura, d.cintura!==undefined?d.cintura:existing.cintura,
        d.quadril!==undefined?d.quadril:existing.quadril, d.torax!==undefined?d.torax:existing.torax,
        d.braco!==undefined?d.braco:existing.braco, d.coxa!==undefined?d.coxa:existing.coxa, id);
    res.json(db.prepare('SELECT * FROM alunos WHERE id = ?').get(id));
  } catch (e) { res.status(500).json({ error: 'Erro ao atualizar' }); }
});

app.delete('/api/alunos/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM alunos WHERE id = ?').run(req.params.id);
    res.json({ message: 'Aluno excluído' });
  } catch (e) { res.status(500).json({ error: 'Erro ao excluir' }); }
});

// TREINOS
app.get('/api/alunos/:alunoId/treinos', auth, (req, res) => {
  try { res.json(db.prepare('SELECT * FROM treinos WHERE aluno_id = ? ORDER BY id DESC').all(req.params.alunoId)); }
  catch (e) { res.status(500).json({ error: 'Erro ao buscar treinos' }); }
});

app.post('/api/alunos/:alunoId/treinos', auth, (req, res) => {
  try {
    const { nome, divisao, observacoes } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome do treino obrigatório' });
    const result = db.prepare('INSERT INTO treinos (aluno_id, nome, divisao, observacoes) VALUES (?,?,?,?)')
      .run(req.params.alunoId, nome, divisao||null, observacoes||null);
    res.status(201).json(db.prepare('SELECT * FROM treinos WHERE id = ?').get(result.lastInsertRowid));
  } catch (e) { res.status(500).json({ error: 'Erro ao criar treino' }); }
});

app.put('/api/treinos/:id', auth, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM treinos WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Treino não encontrado' });
    const { nome, divisao, observacoes } = req.body;
    db.prepare('UPDATE treinos SET nome=?, divisao=?, observacoes=? WHERE id=?')
      .run(nome||existing.nome, divisao!==undefined?divisao:existing.divisao, observacoes!==undefined?observacoes:existing.observacoes, req.params.id);
    res.json(db.prepare('SELECT * FROM treinos WHERE id = ?').get(req.params.id));
  } catch (e) { res.status(500).json({ error: 'Erro ao atualizar' }); }
});

app.delete('/api/treinos/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM treinos WHERE id = ?').run(req.params.id);
    res.json({ message: 'Treino excluído' });
  } catch (e) { res.status(500).json({ error: 'Erro ao excluir' }); }
});

// EXERCICIOS
app.get('/api/treinos/:treinoId/exercicios', auth, (req, res) => {
  try { res.json(db.prepare('SELECT * FROM exercicios WHERE treino_id = ? ORDER BY id').all(req.params.treinoId)); }
  catch (e) { res.status(500).json({ error: 'Erro ao buscar exercícios' }); }
});

app.post('/api/treinos/:treinoId/exercicios', auth, (req, res) => {
  try {
    const { nome, series, repeticoes, carga, descanso, observacoes } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome do exercício obrigatório' });
    const result = db.prepare('INSERT INTO exercicios (treino_id, nome, series, repeticoes, carga, descanso, observacoes) VALUES (?,?,?,?,?,?,?)')
      .run(req.params.treinoId, nome, series||null, repeticoes||null, carga||null, descanso||null, observacoes||null);
    res.status(201).json(db.prepare('SELECT * FROM exercicios WHERE id = ?').get(result.lastInsertRowid));
  } catch (e) { res.status(500).json({ error: 'Erro ao criar exercício' }); }
});

app.put('/api/exercicios/:id', auth, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM exercicios WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Exercício não encontrado' });
    const d = req.body;
    db.prepare('UPDATE exercicios SET nome=?, series=?, repeticoes=?, carga=?, descanso=?, observacoes=? WHERE id=?')
      .run(d.nome||existing.nome, d.series!==undefined?d.series:existing.series, d.repeticoes!==undefined?d.repeticoes:existing.repeticoes,
        d.carga!==undefined?d.carga:existing.carga, d.descanso!==undefined?d.descanso:existing.descanso,
        d.observacoes!==undefined?d.observacoes:existing.observacoes, req.params.id);
    res.json(db.prepare('SELECT * FROM exercicios WHERE id = ?').get(req.params.id));
  } catch (e) { res.status(500).json({ error: 'Erro ao atualizar' }); }
});

app.delete('/api/exercicios/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM exercicios WHERE id = ?').run(req.params.id);
    res.json({ message: 'Exercício excluído' });
  } catch (e) { res.status(500).json({ error: 'Erro ao excluir' }); }
});

// AVALIACOES
app.get('/api/alunos/:alunoId/avaliacoes', auth, (req, res) => {
  try { res.json(db.prepare('SELECT * FROM avaliacoes WHERE aluno_id = ? ORDER BY created_at DESC').all(req.params.alunoId)); }
  catch (e) { res.status(500).json({ error: 'Erro ao buscar avaliações' }); }
});

app.post('/api/alunos/:alunoId/avaliacoes', auth, (req, res) => {
  try {
    const { peso, altura, gordura, cintura, quadril, torax, braco, coxa, observacoes } = req.body;
    let imc = null;
    if (peso && altura && altura > 0) imc = parseFloat((peso / (altura * altura)).toFixed(2));
    const result = db.prepare(`INSERT INTO avaliacoes (aluno_id, peso, altura, gordura, cintura, quadril, torax, braco, coxa, imc, observacoes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(req.params.alunoId, peso||null, altura||null, gordura||null, cintura||null,
      quadril||null, torax||null, braco||null, coxa||null, imc, observacoes||null);
    // Atualizar dados atuais do aluno
    db.prepare(`UPDATE alunos SET peso=?, altura=?, gordura=?, cintura=?, quadril=?, torax=?, braco=?, coxa=? WHERE id=?`)
      .run(peso||null, altura||null, gordura||null, cintura||null, quadril||null, torax||null, braco||null, coxa||null, req.params.alunoId);
    res.status(201).json(db.prepare('SELECT * FROM avaliacoes WHERE id = ?').get(result.lastInsertRowid));
  } catch (e) { res.status(500).json({ error: 'Erro ao criar avaliação' }); }
});

app.delete('/api/avaliacoes/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM avaliacoes WHERE id = ?').run(req.params.id);
    res.json({ message: 'Avaliação excluída' });
  } catch (e) { res.status(500).json({ error: 'Erro ao excluir' }); }
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));