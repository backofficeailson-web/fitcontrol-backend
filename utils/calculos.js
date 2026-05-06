/**
 * Calcula o IMC (Índice de Massa Corporal).
 * @param {number} peso   - em kg
 * @param {number} altura - em metros
 * @returns {number|null}
 */
function calcularIMC(peso, altura) {
  const p = Number(peso);
  const a = Number(altura);
  if (!p || !a || a <= 0 || p <= 0 || isNaN(p) || isNaN(a)) return null;
  return parseFloat((p / (a * a)).toFixed(2));
}

/**
 * Classifica o IMC segundo a OMS.
 * @param {number|null} imc
 * @returns {string}
 */
function classificarIMC(imc) {
  if (imc === null || imc === undefined || isNaN(imc)) return '—';
  if (imc < 18.5) return 'Abaixo do peso';
  if (imc < 25)   return 'Peso normal';
  if (imc < 30)   return 'Sobrepeso';
  if (imc < 35)   return 'Obesidade grau I';
  if (imc < 40)   return 'Obesidade grau II';
  return 'Obesidade grau III';
}

/**
 * Calcula a Relação Cintura-Quadril (RCQ).
 * @param {number} cintura - em cm
 * @param {number} quadril - em cm
 * @returns {number|null}
 */
function calcularRCQ(cintura, quadril) {
  const c = Number(cintura);
  const q = Number(quadril);
  if (!c || !q || q <= 0 || isNaN(c) || isNaN(q)) return null;
  return parseFloat((c / q).toFixed(3));
}

/**
 * Estima a Taxa Metabólica Basal (TMB) pela fórmula de Mifflin-St Jeor.
 * @param {number} peso   - kg
 * @param {number} altura - metros (convertido para cm internamente)
 * @param {number} idade  - anos
 * @param {'M'|'F'} sexo
 * @returns {number|null} kcal/dia
 */
function calcularTMB(peso, altura, idade, sexo) {
  const p = Number(peso);
  const a = Number(altura) * 100; // converte para cm
  const i = Number(idade);
  if (!p || !a || !i || isNaN(p) || isNaN(a) || isNaN(i)) return null;
  const base = (10 * p) + (6.25 * a) - (5 * i);
  return sexo === 'F' ? Math.round(base - 161) : Math.round(base + 5);
}

module.exports = { calcularIMC, classificarIMC, calcularRCQ, calcularTMB };