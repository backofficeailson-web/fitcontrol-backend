const express = require('express');
const db = require('../database');
const authMiddleware = require('../middleware/auth');
const { sanitize } = require('../validators/validators');

const router = express.Router();
router.use(authMiddleware);

// LISTAR FOTOS
router.get('/alunos/:alunoId/fotos-posturais', (req, res, next) => {
  try {
    const aluno = db.prepare('SELECT id FROM alunos WHERE id = ? AND user_id = ?').get(req.params.alunoId, req.userId);
    if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
    const fotos = db.prepare('SELECT id, tipo, data_url, created_at FROM fotos_posturais WHERE aluno_id = ? ORDER BY created_at DESC').all(req.params.alunoId);
    res.json(fotos);
  } catch (err) { next(err); }
});

// ENVIAR FOTO
router.post('/alunos/:alunoId/fotos-posturais', (req, res, next) => {
  try {
    sanitize(req.body);
    const { tipo, data_url } = req.body;
    if (!tipo || !data_url) return res.status(400).json({ error: 'Tipo e imagem obrigatórios' });

    // Limite de 5 MB para base64
    if (data_url.length > 5_000_000) {
      return res.status(400).json({ error: 'Imagem muito grande. Máximo 5 MB.' });
    }

    const aluno = db.prepare('SELECT id FROM alunos WHERE id = ? AND user_id = ?').get(req.params.alunoId, req.userId);
    if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });

    const result = db.prepare('INSERT INTO fotos_posturais (aluno_id, tipo, data_url) VALUES (?,?,?)').run(req.params.alunoId, tipo, data_url);
    const foto = db.prepare('SELECT * FROM fotos_posturais WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(foto);
  } catch (err) { next(err); }
});

// EXCLUIR FOTO
router.delete('/fotos-posturais/:id', (req, res, next) => {
  try {
    const foto = db.prepare(`
      SELECT f.id FROM fotos_posturais f
      JOIN alunos a ON f.aluno_id = a.id
      WHERE f.id = ? AND a.user_id = ?
    `).get(req.params.id, req.userId);
    if (!foto) return res.status(404).json({ error: 'Foto não encontrada' });

    db.prepare('DELETE FROM fotos_posturais WHERE id = ?').run(req.params.id);
    res.json({ message: 'Foto excluída' });
  } catch (err) { next(err); }
});

module.exports = router;