const express = require('express');
const db = require('../database');
const authMiddleware = require('../middleware/auth');
const { sanitize } = require('../validators/validators');

const router = express.Router();
router.use(authMiddleware);

// LISTAR TREINOS DO ALUNO
router.get('/alunos/:alunoId/treinos', (req, res, next) => {
  try {
    const aluno = db.prepare('SELECT id FROM alunos WHERE id = ? AND user_id = ?').get(req.params.alunoId, req.userId);
    if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
    const treinos = db.prepare('SELECT * FROM treinos WHERE aluno_id = ? ORDER BY id DESC').all(req.params.alunoId);
    res.json(treinos);
  } catch (err) { next(err); }
});

// CRIAR TREINO
router.post('/alunos/:alunoId/treinos', (req, res, next) => {
  try {
    sanitize(req.body);
    const { nome, divisao, observacoes } = req.body;
    if (!nome || !nome.trim()) return res.status(400).json({ error: 'Nome do treino obrigatório' });

    const aluno = db.prepare('SELECT id FROM alunos WHERE id = ? AND user_id = ?').get(req.params.alunoId, req.userId);
    if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });

    const stmt = db.prepare('INSERT INTO treinos (aluno_id, nome, divisao, observacoes) VALUES (?,?,?,?)');
    const result = stmt.run(req.params.alunoId, nome.trim(), divisao || null, observacoes || null);
    const treino = db.prepare('SELECT * FROM treinos WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(treino);
  } catch (err) { next(err); }
});

// ATUALIZAR TREINO
router.put('/treinos/:id', (req, res, next) => {
  try {
    sanitize(req.body);
    const treino = db.prepare(`
      SELECT t.* FROM treinos t
      JOIN alunos a ON t.aluno_id = a.id
      WHERE t.id = ? AND a.user_id = ?
    `).get(req.params.id, req.userId);
    if (!treino) return res.status(404).json({ error: 'Treino não encontrado' });

    const { nome, divisao, observacoes } = req.body;
    db.prepare('UPDATE treinos SET nome=?, divisao=?, observacoes=? WHERE id=?').run(
      nome || treino.nome,
      divisao !== undefined ? divisao : treino.divisao,
      observacoes !== undefined ? observacoes : treino.observacoes,
      req.params.id
    );
    const updated = db.prepare('SELECT * FROM treinos WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) { next(err); }
});

// EXCLUIR TREINO
router.delete('/treinos/:id', (req, res, next) => {
  try {
    const treino = db.prepare(`
      SELECT t.id FROM treinos t
      JOIN alunos a ON t.aluno_id = a.id
      WHERE t.id = ? AND a.user_id = ?
    `).get(req.params.id, req.userId);
    if (!treino) return res.status(404).json({ error: 'Treino não encontrado' });

    db.prepare('DELETE FROM treinos WHERE id = ?').run(req.params.id);
    res.json({ message: 'Treino excluído' });
  } catch (err) { next(err); }
});

module.exports = router;