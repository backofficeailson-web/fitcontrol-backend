const express = require('express');
const db = require('../database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res, next) => {
  try {
    const alunos = db.prepare('SELECT * FROM alunos WHERE user_id = ?').all(req.userId);
    const data = alunos.map(aluno => {
      const treinos = db.prepare('SELECT * FROM treinos WHERE aluno_id = ?').all(aluno.id).map(t => ({
        ...t,
        exercicios: db.prepare('SELECT * FROM exercicios WHERE treino_id = ?').all(t.id)
      }));
      const avaliacoes = db.prepare('SELECT * FROM avaliacoes WHERE aluno_id = ? ORDER BY created_at DESC').all(aluno.id);
      const fotos = db.prepare('SELECT id, tipo, data_url, created_at FROM fotos_posturais WHERE aluno_id = ?').all(aluno.id);
      return { ...aluno, treinos, avaliacoes, fotos_posturais: fotos };
    });
    res.setHeader('Content-Disposition', 'attachment; filename=fitcontrol_backup.json');
    res.json(data);
  } catch (err) { next(err); }
});

module.exports = router;