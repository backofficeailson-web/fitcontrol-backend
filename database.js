const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Criar tabelas
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS alunos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    idade INTEGER,
    peso REAL
  );
`);

// Adicionar colunas novas com segurança (só se não existirem)
const novasColunas = [
  { nome: 'altura', tipo: 'REAL' },
  { nome: 'objetivo', tipo: 'TEXT' },
  { nome: 'telefone', tipo: 'TEXT' },
  { nome: 'observacoes', tipo: 'TEXT' },
  { nome: 'gordura', tipo: 'REAL' },
  { nome: 'cintura', tipo: 'REAL' },
  { nome: 'quadril', tipo: 'REAL' },
  { nome: 'torax', tipo: 'REAL' },
  { nome: 'braco', tipo: 'REAL' },
  { nome: 'coxa', tipo: 'REAL' },
];

for (const coluna of novasColunas) {
  try {
    db.exec(`ALTER TABLE alunos ADD COLUMN ${coluna.nome} ${coluna.tipo}`);
    console.log(`Coluna ${coluna.nome} adicionada.`);
  } catch (e) {
    // Coluna já existe — ignora
    if (!e.message.includes('duplicate column name')) {
      console.log(`Erro ao adicionar ${coluna.nome}: ${e.message}`);
    }
  }
}

module.exports = db;