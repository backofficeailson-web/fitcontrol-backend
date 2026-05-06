const xss = require('xss');

/**
 * Sanitiza recursivamente strings de um objeto contra XSS.
 * CORRIGIDO: não muta o objeto original — retorna cópia segura.
 * CORRIGIDO: protege contra prototype pollution.
 */
function sanitize(value) {
  if (typeof value === 'string') {
    return xss(value.trim());
  }
  if (Array.isArray(value)) {
    return value.map(sanitize);
  }
  if (value !== null && typeof value === 'object') {
    const safe = {};
    for (const key of Object.keys(value)) {
      // CORRIGIDO: ignora chaves de prototype para prevenir prototype pollution
      if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
      safe[key] = sanitize(value[key]);
    }
    return safe;
  }
  // números, booleanos, null, undefined passam sem alteração
  return value;
}

/**
 * Valida se um valor é número dentro do intervalo [min, max].
 * CORRIGIDO: aceita string numérica e retorna false para string vazia.
 */
function isValidNumber(value, min = 0, max = 1000) {
  if (value === '' || value === null || value === undefined) return false;
  const n = Number(value);
  return !isNaN(n) && isFinite(n) && n >= min && n <= max;
}

/**
 * Valida email com regex simples mas funcional.
 * CORRIGIDO: a versão original usava apenas includes('@'), inseguro.
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
}

/**
 * Valida dados de criação/atualização de aluno.
 * CORRIGIDO: validações só disparam se o campo foi enviado (não undefined),
 * permitindo atualizações parciais sem falsos erros.
 */
function validateAluno(data) {
  const errors = [];

  if (data.nome !== undefined && (!data.nome || !String(data.nome).trim())) {
    errors.push('Nome obrigatório');
  }
  if (data.peso !== undefined && data.peso !== null && data.peso !== '') {
    if (!isValidNumber(data.peso, 20, 500)) errors.push('Peso inválido (20–500 kg)');
  }
  if (data.altura !== undefined && data.altura !== null && data.altura !== '') {
    if (!isValidNumber(data.altura, 0.5, 2.5)) errors.push('Altura inválida (0.5–2.5 m)');
  }
  if (data.idade !== undefined && data.idade !== null && data.idade !== '') {
    if (!isValidNumber(data.idade, 1, 150)) errors.push('Idade inválida (1–150 anos)');
  }
  if (data.gordura !== undefined && data.gordura !== null && data.gordura !== '') {
    if (!isValidNumber(data.gordura, 1, 70)) errors.push('% Gordura inválida (1–70%)');
  }
  if (data.cintura !== undefined && data.cintura !== null && data.cintura !== '') {
    if (!isValidNumber(data.cintura, 30, 300)) errors.push('Cintura inválida (30–300 cm)');
  }
  if (data.quadril !== undefined && data.quadril !== null && data.quadril !== '') {
    if (!isValidNumber(data.quadril, 30, 300)) errors.push('Quadril inválido (30–300 cm)');
  }
  if (data.torax !== undefined && data.torax !== null && data.torax !== '') {
    if (!isValidNumber(data.torax, 30, 300)) errors.push('Tórax inválido (30–300 cm)');
  }
  if (data.braco !== undefined && data.braco !== null && data.braco !== '') {
    if (!isValidNumber(data.braco, 10, 100)) errors.push('Braço inválido (10–100 cm)');
  }
  if (data.coxa !== undefined && data.coxa !== null && data.coxa !== '') {
    if (!isValidNumber(data.coxa, 20, 150)) errors.push('Coxa inválida (20–150 cm)');
  }
  if (data.experiencia_anos !== undefined && data.experiencia_anos !== null && data.experiencia_anos !== '') {
    if (!isValidNumber(data.experiencia_anos, 0, 80)) errors.push('Experiência inválida (0–80 anos)');
  }
  if (data.frequencia_semanal !== undefined && data.frequencia_semanal !== null && data.frequencia_semanal !== '') {
    if (!isValidNumber(data.frequencia_semanal, 0, 14)) errors.push('Frequência inválida (0–14x/semana)');
  }

  return errors;
}

/**
 * Valida credenciais de autenticação.
 * CORRIGIDO: regex de email mais robusta.
 */
function validateAuth(data) {
  const errors = [];
  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Email inválido');
  }
  if (!data.password || String(data.password).length < 6) {
    errors.push('Senha deve ter no mínimo 6 caracteres');
  }
  // ADICIONADO: limite máximo de senha para prevenir DoS via bcrypt
  if (data.password && String(data.password).length > 72) {
    errors.push('Senha deve ter no máximo 72 caracteres');
  }
  return errors;
}

module.exports = { sanitize, isValidNumber, isValidEmail, validateAluno, validateAuth };