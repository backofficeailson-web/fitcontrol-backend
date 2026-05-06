const express = require('express');
const db      = require('../database');
const authMiddleware = require('../middleware/auth');
const { sanitize, validateAluno } = require('../validators/validators');

const router = express.Router();
router.use(authMiddleware);

// ─── LISTAR ALUNOS ────────────────────────────────────────────────────────────
router.get('/', (req, res, next) => {
  try {
    let query  = 'SELECT * FROM alunos WHERE user_id = ?';
    const params = [req.userId];

    const { q, objetivo, modalidade, status } = req.query;

    if (q) {
      // CORRIGIDO: busca também por telefone e email
      query += ' AND (nome LIKE ? OR telefone LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }
    if (objetivo)   { query += ' AND objetivo_principal = ?'; params.push(objetivo); }
    if (modalidade) { query += ' AND modalidade = ?';         params.push(modalidade); }
    if (status)     { query += ' AND status_liberacao = ?';   params.push(status); }

    query += ' ORDER BY nome ASC'; // CORRIGIDO: ordenar por nome é mais útil que por id DESC

    const alunos = db.prepare(query).all(...params);
    return res.json(alunos);
  } catch (err) { next(err); }
});

// ─── BUSCAR ALUNO POR ID ──────────────────────────────────────────────────────
// ADICIONADO: rota GET /:id que estava faltando
router.get('/:id', (req, res, next) => {
  try {
    const aluno = db.prepare('SELECT * FROM alunos WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.userId);
    if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
    return res.json(aluno);
  } catch (err) { next(err); }
});

// ─── CRIAR ALUNO ──────────────────────────────────────────────────────────────
router.post('/', (req, res, next) => {
  try {
    // CORRIGIDO: sanitize retorna cópia — não muta req.body
    const body   = sanitize(req.body);

    // Validação com nome obrigatório na criação
    if (!body.nome || !String(body.nome).trim()) {
      return res.status(400).json({ errors: ['Nome obrigatório'] });
    }
    const errors = validateAluno(body);
    if (errors.length) return res.status(400).json({ errors });

    const {
      nome, idade, peso, altura, objetivo, telefone, observacoes,
      gordura, cintura, quadril, torax, braco, coxa,
      patologias, restricoes, nivel_atividade, historico_lesoes,
      modalidade, biotipo, experiencia_anos, foco_competitivo,
      metodologia_preferida, frequencia_semanal, disponibilidade_tempo,
      objetivo_principal, objetivo_secundario, observacoes_tecnicas, status_liberacao
    } = body;

    const stmt = db.prepare(`
      INSERT INTO alunos (
        user_id, nome, idade, peso, altura, objetivo, telefone, observacoes,
        gordura, cintura, quadril, torax, braco, coxa,
        patologias, restricoes, nivel_atividade, historico_lesoes,
        modalidade, biotipo, experiencia_anos, foco_competitivo,
        metodologia_preferida, frequencia_semanal, disponibilidade_tempo,
        objetivo_principal, objetivo_secundario, observacoes_tecnicas, status_liberacao
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);

    const result = stmt.run(
      req.userId,
      String(nome).trim(),
      idade              || null,
      peso               || null,
      altura             || null,
      objetivo           || null,
      telefone           || null,
      observacoes        || null,
      gordura            || null,
      cintura            || null,
      quadril            || null,
      torax              || null,
      braco              || null,
      coxa               || null,
      patologias         || null,
      restricoes         || null,
      nivel_atividade    || null,
      historico_lesoes   || null,
      modalidade         || null,
      biotipo            || null,
      experiencia_anos   || null,
      foco_competitivo   || null,
      metodologia_preferida  || null,
      frequencia_semanal     || null,
      disponibilidade_tempo  || null,
      objetivo_principal     || null,
      objetivo_secundario    || null,
      observacoes_tecnicas   || null,
      status_liberacao       || null
    );

    const aluno = db.prepare('SELECT * FROM alunos WHERE id = ? AND user_id = ?')
      .get(result.lastInsertRowid, req.userId);
    return res.status(201).json(aluno);
  } catch (err) { next(err); }
});

// ─── ATUALIZAR ALUNO ──────────────────────────────────────────────────────────
router.put('/:id', (req, res, next) => {
  try {
    const body = sanitize(req.body);
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM alunos WHERE id = ? AND user_id = ?')
      .get(id, req.userId);
    if (!existing) return res.status(404).json({ error: 'Aluno não encontrado' });

    // Validações só para campos enviados
    const errors = validateAluno(body);
    if (errors.length) return res.status(400).json({ errors });

    // CORRIGIDO: merge seguro — usa valor enviado se definido, caso contrário mantém existente
    const merge = (field) => body[field] !== undefined ? body[field] : existing[field];

    db.prepare(`
      UPDATE alunos SET
        nome=?, idade=?, peso=?, altura=?, objetivo=?, telefone=?, observacoes=?,
        gordura=?, cintura=?, quadril=?, torax=?, braco=?, coxa=?,
        patologias=?, restricoes=?, nivel_atividade=?, historico_lesoes=?,
        modalidade=?, biotipo=?, experiencia_anos=?, foco_competitivo=?,
        metodologia_preferida=?, frequencia_semanal=?, disponibilidade_tempo=?,
        objetivo_principal=?, objetivo_secundario=?, observacoes_tecnicas=?, status_liberacao=?
      WHERE id=? AND user_id=?
    `).run(
      merge('nome') || existing.nome,
      merge('idade'), merge('peso'), merge('altura'),
      merge('objetivo'), merge('telefone'), merge('observacoes'),
      merge('gordura'), merge('cintura'), merge('quadril'),
      merge('torax'), merge('braco'), merge('coxa'),
      merge('patologias'), merge('restricoes'), merge('nivel_atividade'),
      merge('historico_lesoes'), merge('modalidade'), merge('biotipo'),
      merge('experiencia_anos'), merge('foco_competitivo'),
      merge('metodologia_preferida'), merge('frequencia_semanal'),
      merge('disponibilidade_tempo'), merge('objetivo_principal'),
      merge('objetivo_secundario'), merge('observacoes_tecnicas'),
      merge('status_liberacao'),
      id, req.userId
    );

    const updated = db.prepare('SELECT * FROM alunos WHERE id = ? AND user_id = ?')
      .get(id, req.userId);
    return res.json(updated);
  } catch (err) { next(err); }
});

// ─── EXCLUIR ALUNO ────────────────────────────────────────────────────────────
router.delete('/:id', (req, res, next) => {
  try {
    const result = db.prepare('DELETE FROM alunos WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.userId);
    if (result.changes === 0) return res.status(404).json({ error: 'Aluno não encontrado' });
    return res.json({ message: 'Aluno excluído com sucesso' });
  } catch (err) { next(err); }
});

module.exports = router;