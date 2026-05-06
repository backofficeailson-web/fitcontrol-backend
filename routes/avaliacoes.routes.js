const express = require('express');
const db = require('../database');
const authMiddleware = require('../middleware/auth');
const { sanitize } = require('../validators/validators');
const { calcularIMC } = require('../utils/calculos');

const router = express.Router();
router.use(authMiddleware);

// LISTAR AVALIAÇÕES
router.get('/alunos/:alunoId/avaliacoes', (req, res, next) => {
  try {
    const aluno = db.prepare('SELECT id FROM alunos WHERE id = ? AND user_id = ?').get(req.params.alunoId, req.userId);
    if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
    const avaliacoes = db.prepare('SELECT * FROM avaliacoes WHERE aluno_id = ? ORDER BY created_at DESC').all(req.params.alunoId);
    res.json(avaliacoes);
  } catch (err) { next(err); }
});

// CRIAR AVALIAÇÃO
router.post('/alunos/:alunoId/avaliacoes', (req, res, next) => {
  try {
    sanitize(req.body);
    const aluno = db.prepare('SELECT id FROM alunos WHERE id = ? AND user_id = ?').get(req.params.alunoId, req.userId);
    if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });

    const { peso, altura, gordura, cintura, quadril, torax, braco, coxa, observacoes } = req.body;
    const imc = calcularIMC(peso, altura);

    const stmt = db.prepare(`INSERT INTO avaliacoes (aluno_id, peso, altura, gordura, cintura, quadril, torax, braco, coxa, imc, observacoes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
    const result = stmt.run(req.params.alunoId, peso || null, altura || null, gordura || null, cintura || null, quadril || null,
      torax || null, braco || null, coxa || null, imc, observacoes || null);

    // Atualizar dados atuais do aluno
    db.prepare(`UPDATE alunos SET peso=?, altura=?, gordura=?, cintura=?, quadril=?, torax=?, braco=?, coxa=? WHERE id=?`)
      .run(peso || null, altura || null, gordura || null, cintura || null, quadril || null, torax || null, braco || null, coxa || null, req.params.alunoId);

    const avaliacao = db.prepare('SELECT * FROM avaliacoes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(avaliacao);
  } catch (err) { next(err); }
});

// EXCLUIR AVALIAÇÃO
router.delete('/avaliacoes/:id', (req, res, next) => {
  try {
    const av = db.prepare(`
      SELECT av.id FROM avaliacoes av
      JOIN alunos a ON av.aluno_id = a.id
      WHERE av.id = ? AND a.user_id = ?
    `).get(req.params.id, req.userId);
    if (!av) return res.status(404).json({ error: 'Avaliação não encontrada' });

    db.prepare('DELETE FROM avaliacoes WHERE id = ?').run(req.params.id);
    res.json({ message: 'Avaliação excluída' });
  } catch (err) { next(err); }
});

module.exports = router;