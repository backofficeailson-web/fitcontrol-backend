const Database = require('better-sqlite3');

const db = new Database('database.db');

// Criar tabelas
db.prepare(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  password TEXT
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS alunos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT,
  idade INTEGER,
  peso REAL
)
`).run();

module.exports = db;