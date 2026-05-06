const xss = require('xss');

function sanitize(obj) {
  if (typeof obj === 'string') return xss(obj.trim());
  if (typeof obj === 'object' && obj !== null) {
    for (let key in obj) {
      obj[key] = sanitize(obj[key]);
    }
  }
  return obj;
}

function isValidNumber(value, min = 0, max = 1000) {
  const n = Number(value);
  return !isNaN(n) && n >= min && n <= max;
}

function validateAluno(data) {
  const errors = [];
  if (!data.nome || !data.nome.trim()) errors.push('Nome obrigatório');
  if (data.peso && !isValidNumber(data.peso, 20, 500)) errors.push('Peso inválido (20–500 kg)');
  if (data.altura && !isValidNumber(data.altura, 0.5, 2.5)) errors.push('Altura inválida (0.5–2.5 m)');
  if (data.idade && !isValidNumber(data.idade, 1, 150)) errors.push('Idade inválida (1–150 anos)');
  if (data.gordura && !isValidNumber(data.gordura, 1, 70)) errors.push('% Gordura inválida (1–70%)');
  if (data.cintura && !isValidNumber(data.cintura, 30, 300)) errors.push('Cintura inválida (30–300 cm)');
  if (data.quadril && !isValidNumber(data.quadril, 30, 300)) errors.push('Quadril inválido (30–300 cm)');
  if (data.torax && !isValidNumber(data.torax, 30, 300)) errors.push('Tórax inválido (30–300 cm)');
  if (data.braco && !isValidNumber(data.braco, 10, 100)) errors.push('Braço inválido (10–100 cm)');
  if (data.coxa && !isValidNumber(data.coxa, 20, 150)) errors.push('Coxa inválida (20–150 cm)');
  if (data.experiencia_anos && !isValidNumber(data.experiencia_anos, 0, 80)) errors.push('Experiência inválida (0–80 anos)');
  if (data.frequencia_semanal && !isValidNumber(data.frequencia_semanal, 0, 14)) errors.push('Frequência inválida (0–14x/semana)');
  return errors;
}

function validateAuth(data) {
  const errors = [];
  if (!data.email || !data.email.includes('@')) errors.push('Email inválido');
  if (!data.password || data.password.length < 6) errors.push('Senha deve ter no mínimo 6 caracteres');
  return errors;
}

module.exports = { sanitize, isValidNumber, validateAluno, validateAuth };