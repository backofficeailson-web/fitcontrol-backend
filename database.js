const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

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
    peso REAL,
    altura REAL,
    objetivo TEXT,
    telefone TEXT,
    observacoes TEXT,
    gordura REAL,
    cintura REAL,
    quadril REAL,
    torax REAL,
    braco REAL,
    coxa REAL
  );

  CREATE TABLE IF NOT EXISTS treinos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aluno_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    divisao TEXT,
    observacoes TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS exercicios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    treino_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    series TEXT,
    repeticoes TEXT,
    carga TEXT,
    descanso TEXT,
    observacoes TEXT,
    FOREIGN KEY (treino_id) REFERENCES treinos(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS avaliacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aluno_id INTEGER NOT NULL,
    peso REAL,
    altura REAL,
    gordura REAL,
    cintura REAL,
    quadril REAL,
    torax REAL,
    braco REAL,
    coxa REAL,
    imc REAL,
    observacoes TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE
  );
`);

// Adiciona colunas novas se não existirem (segurança para migrations)
const colunasAlunos = [
  ['altura', 'REAL'], ['objetivo', 'TEXT'], ['telefone', 'TEXT'],
  ['observacoes', 'TEXT'], ['gordura', 'REAL'], ['cintura', 'REAL'],
  ['quadril', 'REAL'], ['torax', 'REAL'], ['braco', 'REAL'], ['coxa', 'REAL']
];

colunasAlunos.forEach(([nome, tipo]) => {
  try {
    db.exec(`ALTER TABLE alunos ADD COLUMN ${nome} ${tipo}`);
  } catch (e) {
    if (!e.message.includes('duplicate column name')) console.log(e.message);
  }
});

module.exports = db;