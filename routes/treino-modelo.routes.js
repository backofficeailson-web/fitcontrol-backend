const express = require('express');
const authMiddleware = require('../middleware/auth');
const { gerarTreinoModelo } = require('../services/treino.service');

const router = express.Router();
router.use(authMiddleware);

router.post('/alunos/:alunoId/gerar-treino-modelo', (req, res, next) => {
  try {
    const treino = gerarTreinoModelo(req.params.alunoId, req.userId);
    res.status(201).json(treino);
  } catch (err) {
    if (err.message === 'Aluno não encontrado') return res.status(404).json({ error: err.message });
    next(err);
  }
});

module.exports = router;