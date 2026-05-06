const db = require('../database');

function gerarTreinoModelo(alunoId, userId) {
  const aluno = db.prepare('SELECT * FROM alunos WHERE id = ? AND user_id = ?').get(alunoId, userId);
  if (!aluno) throw new Error('Aluno não encontrado');

  const modalidade = (aluno.modalidade || '').toLowerCase().trim();
  const objetivo = (aluno.objetivo_principal || aluno.objetivo || '').toLowerCase().trim();
  const patologias = (aluno.patologias || '').toLowerCase();
  const restricoes = (aluno.restricoes || '').toLowerCase();
  const status = (aluno.status_liberacao || '').toLowerCase().trim();
  
  let nome = 'Treino Adaptativo';
  let divisao = 'Full Body';
  let observacoes = '';
  const exerciciosPadrao = [];

  // Define treino conforme modalidade/objetivo
  if (modalidade.includes('powerlifting')) {
    nome = 'Powerlifting – Força Máxima';
    divisao = 'ABC';
    observacoes = 'Ciclo de força com periodização ondulatória. Priorizar agachamento, supino e terra.';
    exerciciosPadrao.push('Agachamento livre', 'Supino reto', 'Levantamento terra', 'Supino fechado', 'Remada curvada');
  } else if (modalidade.includes('crossfit')) {
    nome = 'CrossFit – Condicionamento';
    divisao = 'WOD';
    observacoes = 'Alta intensidade, variação diária. Foco em técnica e intensidade.';
    exerciciosPadrao.push('Air Squat', 'Burpee', 'Kettlebell Swing', 'Remada alta', 'Prancha');
  } else if (modalidade.includes('beach tennis') || modalidade.includes('tenis')) {
    nome = 'Beach Tennis – Potência & Agilidade';
    divisao = 'AB';
    observacoes = 'Ênfase em deslocamento lateral, core e explosão de pernas.';
    exerciciosPadrao.push('Deslocamento lateral', 'Afundo com rotação', 'Remada unilateral', 'Rotação de tronco', 'Prancha dinâmica');
  } else if (modalidade.includes('bodybuilder')) {
    nome = 'Bodybuilder – Hipertrofia Avançada';
    divisao = 'ABCDE';
    observacoes = 'Alto volume, técnicas de intensidade (drop-set, rest-pause). Enfoque em simetria.';
    exerciciosPadrao.push('Supino inclinado', 'Agachamento hack', 'Remada cavalinho', 'Desenvolvimento Arnold', 'Rosca concentrada');
  } else if (modalidade.includes('lipedema')) {
    nome = 'Lipedema – Drenagem & Circulação';
    divisao = 'AB';
    observacoes = 'Baixo impacto. Priorizar drenagem muscular e circulação. Fortalecimento leve/moderado.';
    exerciciosPadrao.push('Elevação pélvica', 'Caminhada inclinada', 'Bicicleta horizontal', 'Adução/abdução com faixa', 'Mobilidade de quadril');
  } else if (modalidade.includes('gestante')) {
    nome = 'Gestante – Segurança & Mobilidade';
    divisao = 'Leve';
    observacoes = 'Treino conservador. Baixo impacto, evitar Valsalva e cargas máximas.';
    exerciciosPadrao.push('Agachamento sumô leve', 'Remada elástica', 'Elevação lateral', 'Mobilidade pélvica', 'Respiração diafragmática');
    if (status !== 'liberado') observacoes += ' Necessária liberação profissional antes de qualquer progressão.';
  } else if (modalidade.includes('reabilitacao')) {
    nome = 'Reabilitação – Fortalecimento & Correção';
    divisao = 'AB';
    observacoes = 'Foco em mobilidade, estabilidade e controle motor.';
    exerciciosPadrao.push('Ponte de glúteo', 'Prancha isométrica', 'Remada com elástico', 'Mobilidade de ombro', 'Alongamento de cadeia posterior');
  } else if (objetivo.includes('emagrecimento')) {
    nome = 'Circuito Emagrecimento';
    divisao = 'Circuito';
    observacoes = 'Circuito metabólico. Baixo impacto se houver restrições.';
    exerciciosPadrao.push('Agachamento sumô', 'Remada elástica', 'Avanço alternado', 'Prancha', 'Bicicleta estacionária');
  } else if (modalidade.includes('condicionamento')) {
    nome = 'Condicionamento Geral';
    divisao = 'Full Body';
    observacoes = 'Treino equilibrado para condicionamento físico geral.';
    exerciciosPadrao.push('Agachamento', 'Flexão de braço', 'Remada', 'Abdominal', 'Polichinelo');
  } else {
    // Musculação / padrão
    nome = 'Musculação – Hipertrofia Base';
    divisao = 'AB';
    observacoes = 'Divisão A/B clássica com séries de 8 a 12 repetições.';
    exerciciosPadrao.push('Agachamento', 'Supino reto', 'Remada curvada', 'Desenvolvimento', 'Abdominal');
  }

  // Restrições especiais
  if (patologias.includes('joelho')) observacoes += ' Evitar saltos e agachamento profundo.';
  if (restricoes.includes('coluna')) observacoes += ' Evitar levantamento terra pesado e cargas axiais excessivas.';
  if (status !== 'liberado' && status !== '') observacoes += ' Necessária liberação profissional antes de alta intensidade.';

  // Insere treino
  const stmt = db.prepare('INSERT INTO treinos (aluno_id, nome, divisao, observacoes) VALUES (?,?,?,?)');
  const result = stmt.run(alunoId, nome, divisao, observacoes);
  const treinoId = result.lastInsertRowid;

  const insere = db.prepare('INSERT INTO exercicios (treino_id, nome) VALUES (?,?)');
  for (const ex of exerciciosPadrao) {
    insere.run(treinoId, ex);
  }

  return db.prepare('SELECT * FROM treinos WHERE id = ?').get(treinoId);
}

module.exports = { gerarTreinoModelo };