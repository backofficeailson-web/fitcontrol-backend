const express = require('express');
const db = require('../database');
const authMiddleware = require('../middleware/auth');
const { sanitize, validateAluno } = require('../validators/validators');

const router = express.Router();
router.use(authMiddleware);

// LISTAR ALUNOS
router.get('/', (req, res, next) => {
  try {
    let query = 'SELECT * FROM alunos WHERE user_id = ?';
    const params = [req.userId];
    const { q, objetivo } = req.query;
    if (q) { query += ' AND nome LIKE ?'; params.push(`%${q}%`); }
    if (objetivo) { query += ' AND objetivo_principal = ?'; params.push(objetivo); }
    query += ' ORDER BY id DESC';
    const alunos = db.prepare(query).all(...params);
    res.json(alunos);
  } catch (err) { next(err); }
});

// CRIAR ALUNO
router.post('/', (req, res, next) => {
  try {
    sanitize(req.body);
    const errors = validateAluno(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const {
      nome, idade, peso, altura, objetivo, telefone, observacoes,
      gordura, cintura, quadril, torax, braco, coxa,
      patologias, restricoes, nivel_atividade, historico_lesoes,
      modalidade, biotipo, experiencia_anos, foco_competitivo,
      metodologia_preferida, frequencia_semanal, disponibilidade_tempo,
      objetivo_principal, objetivo_secundario, observacoes_tecnicas, status_liberacao
    } = req.body;

    const stmt = db.prepare(`INSERT INTO alunos (
      user_id, nome, idade, peso, altura, objetivo, telefone, observacoes,
      gordura, cintura, quadril, torax, braco, coxa,
      patologias, restricoes, nivel_atividade, historico_lesoes,
      modalidade, biotipo, experiencia_anos, foco_competitivo,
      metodologia_preferida, frequencia_semanal, disponibilidade_tempo,
      objetivo_principal, objetivo_secundario, observacoes_tecnicas, status_liberacao
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);

    const result = stmt.run(
      req.userId, nome.trim(), idade || null, peso || null, altura || null,
      objetivo || null, telefone || null, observacoes || null,
      gordura || null, cintura || null, quadril || null, torax || null, braco || null, coxa || null,
      patologias || null, restricoes || null, nivel_atividade || null, historico_lesoes || null,
      modalidade || null, biotipo || null, experiencia_anos || null, foco_competitivo || null,
      metodologia_preferida || null, frequencia_semanal || null, disponibilidade_tempo || null,
      objetivo_principal || null, objetivo_secundario || null, observacoes_tecnicas || null, status_liberacao || null
    );

    const aluno = db.prepare('SELECT * FROM alunos WHERE id = ? AND user_id = ?').get(result.lastInsertRowid, req.userId);
    res.status(201).json(aluno);
  } catch (err) { next(err); }
});

// ATUALIZAR ALUNO
router.put('/:id', (req, res, next) => {
  try {
    sanitize(req.body);
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM alunos WHERE id = ? AND user_id = ?').get(id, req.userId);
    if (!existing) return res.status(404).json({ error: 'Aluno não encontrado' });

    const d = req.body;
    db.prepare(`UPDATE alunos SET
      nome=?, idade=?, peso=?, altura=?, objetivo=?, telefone=?, observacoes=?,
      gordura=?, cintura=?, quadril=?, torax=?, braco=?, coxa=?,
      patologias=?, restricoes=?, nivel_atividade=?, historico_lesoes=?,
      modalidade=?, biotipo=?, experiencia_anos=?, foco_competitivo=?,
      metodologia_preferida=?, frequencia_semanal=?, disponibilidade_tempo=?,
      objetivo_principal=?, objetivo_secundario=?, observacoes_tecnicas=?, status_liberacao=?
      WHERE id=? AND user_id=?`).run(
      d.nome || existing.nome, d.idade !== undefined ? d.idade : existing.idade,
      d.peso !== undefined ? d.peso : existing.peso, d.altura !== undefined ? d.altura : existing.altura,
      d.objetivo !== undefined ? d.objetivo : existing.objetivo,
      d.telefone !== undefined ? d.telefone : existing.telefone,
      d.observacoes !== undefined ? d.observacoes : existing.observacoes,
      d.gordura !== undefined ? d.gordura : existing.gordura,
      d.cintura !== undefined ? d.cintura : existing.cintura,
      d.quadril !== undefined ? d.quadril : existing.quadril,
      d.torax !== undefined ? d.torax : existing.torax,
      d.braco !== undefined ? d.braco : existing.braco,
      d.coxa !== undefined ? d.coxa : existing.coxa,
      d.patologias !== undefined ? d.patologias : existing.patologias,
      d.restricoes !== undefined ? d.restricoes : existing.restricoes,
      d.nivel_atividade !== undefined ? d.nivel_atividade : existing.nivel_atividade,
      d.historico_lesoes !== undefined ? d.historico_lesoes : existing.historico_lesoes,
      d.modalidade !== undefined ? d.modalidade : existing.modalidade,
      d.biotipo !== undefined ? d.biotipo : existing.biotipo,
      d.experiencia_anos !== undefined ? d.experiencia_anos : existing.experiencia_anos,
      d.foco_competitivo !== undefined ? d.foco_competitivo : existing.foco_competitivo,
      d.metodologia_preferida !== undefined ? d.metodologia_preferida : existing.metodologia_preferida,
      d.frequencia_semanal !== undefined ? d.frequencia_semanal : existing.frequencia_semanal,
      d.disponibilidade_tempo !== undefined ? d.disponibilidade_tempo : existing.disponibilidade_tempo,
      d.objetivo_principal !== undefined ? d.objetivo_principal : existing.objetivo_principal,
      d.objetivo_secundario !== undefined ? d.objetivo_secundario : existing.objetivo_secundario,
      d.observacoes_tecnicas !== undefined ? d.observacoes_tecnicas : existing.observacoes_tecnicas,
      d.status_liberacao !== undefined ? d.status_liberacao : existing.status_liberacao,
      id, req.userId
    );

    const updated = db.prepare('SELECT * FROM alunos WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) { next(err); }
});

// EXCLUIR ALUNO
router.delete('/:id', (req, res, next) => {
  try {
    const result = db.prepare('DELETE FROM alunos WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    if (result.changes === 0) return res.status(404).json({ error: 'Aluno não encontrado' });
    res.json({ message: 'Aluno excluído' });
  } catch (err) { next(err); }
});

module.exports = router;