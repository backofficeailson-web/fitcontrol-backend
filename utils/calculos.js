function calcularIMC(peso, altura) {
  if (!peso || !altura || altura <= 0 || peso <= 0) return null;
  return parseFloat((peso / (altura * altura)).toFixed(2));
}

function classificarIMC(imc) {
  if (!imc) return "—";
  if (imc < 18.5) return "Abaixo do peso";
  if (imc < 25) return "Normal";
  if (imc < 30) return "Sobrepeso";
  return "Obesidade";
}

module.exports = { calcularIMC, classificarIMC };