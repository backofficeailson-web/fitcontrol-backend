const express = require('express');
const db = require('../database');
const authMiddleware = require('../middleware/auth');
const { sanitize } = require('../validators/validators');

const router = express.Router();
router.use(authMiddleware);

// LISTAR EXERCÍCIOS DO TREINO
router.get('/treinos/:treinoId/exercicios', (req, res, next) => {
  try {
    const treino = db.prepare(`
      SELECT t.id FROM treinos t
      JOIN alunos a ON t.aluno_id = a.id
      WHERE t.id = ? AND a.user_id = ?
    `).get(req.params.treinoId, req.userId);
    if (!treino) return res.status(404).json({ error: 'Treino não encontrado' });

    const exercicios = db.prepare('SELECT * FROM exercicios WHERE treino_id = ? ORDER BY id').all(req.params.treinoId);
    res.json(exercicios);
  } catch (err) { next(err); }
});

// CRIAR EXERCÍCIO
router.post('/treinos/:treinoId/exercicios', (req, res, next) => {
  try {
    sanitize(req.body);
    const { nome, series, repeticoes, carga, descanso, observacoes } = req.body;
    if (!nome || !nome.trim()) return res.status(400).json({ error: 'Nome do exercício obrigatório' });

    const treino = db.prepare(`
      SELECT t.id FROM treinos t
      JOIN alunos a ON t.aluno_id = a.id
      WHERE t.id = ? AND a.user_id = ?
    `).get(req.params.treinoId, req.userId);
    if (!treino) return res.status(404).json({ error: 'Treino não encontrado' });

    const stmt = db.prepare('INSERT INTO exercicios (treino_id, nome, series, repeticoes, carga, descanso, observacoes) VALUES (?,?,?,?,?,?,?)');
    const result = stmt.run(req.params.treinoId, nome.trim(), series || null, repeticoes || null, carga || null, descanso || null, observacoes || null);
    const exercicio = db.prepare('SELECT * FROM exercicios WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(exercicio);
  } catch (err) { next(err); }
});

// ATUALIZAR EXERCÍCIO
router.put('/exercicios/:id', (req, res, next) => {
  try {
    sanitize(req.body);
    const exercicio = db.prepare(`
      SELECT e.* FROM exercicios e
      JOIN treinos t ON e.treino_id = t.id
      JOIN alunos a ON t.aluno_id = a.id
      WHERE e.id = ? AND a.user_id = ?
    `).get(req.params.id, req.userId);
    if (!exercicio) return res.status(404).json({ error: 'Exercício não encontrado' });

    const d = req.body;
    db.prepare('UPDATE exercicios SET nome=?, series=?, repeticoes=?, carga=?, descanso=?, observacoes=? WHERE id=?').run(
      d.nome || exercicio.nome,
      d.series !== undefined ? d.series : exercicio.series,
      d.repeticoes !== undefined ? d.repeticoes : exercicio.repeticoes,
      d.carga !== undefined ? d.carga : exercicio.carga,
      d.descanso !== undefined ? d.descanso : exercicio.descanso,
      d.observacoes !== undefined ? d.observacoes : exercicio.observacoes,
      req.params.id
    );
    const updated = db.prepare('SELECT * FROM exercicios WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) { next(err); }
});

// EXCLUIR EXERCÍCIO
router.delete('/exercicios/:id', (req, res, next) => {
  try {
    const exercicio = db.prepare(`
      SELECT e.id FROM exercicios e
      JOIN treinos t ON e.treino_id = t.id
      JOIN alunos a ON t.aluno_id = a.id
      WHERE e.id = ? AND a.user_id = ?
    `).get(req.params.id, req.userId);
    if (!exercicio) return res.status(404).json({ error: 'Exercício não encontrado' });

    db.prepare('DELETE FROM exercicios WHERE id = ?').run(req.params.id);
    res.json({ message: 'Exercício excluído' });
  } catch (err) { next(err); }
});

module.exports = router;