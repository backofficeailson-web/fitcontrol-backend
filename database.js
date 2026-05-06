const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, 'database.db');

const db = new Database(dbPath);

// ─── PRAGMAs de performance e segurança ──────────────────────────────────────
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000');
db.pragma('temp_store = memory'); // ADICIONADO: melhora performance de queries temporárias

// ─── CRIAÇÃO DE TABELAS ───────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    email    TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS alunos (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id               INTEGER NOT NULL,
    nome                  TEXT NOT NULL,
    idade                 INTEGER,
    peso                  REAL,
    altura                REAL,
    objetivo              TEXT,
    telefone              TEXT,
    observacoes           TEXT,
    gordura               REAL,
    cintura               REAL,
    quadril               REAL,
    torax                 REAL,
    braco                 REAL,
    coxa                  REAL,
    patologias            TEXT,
    restricoes            TEXT,
    nivel_atividade       TEXT,
    historico_lesoes      TEXT,
    modalidade            TEXT,
    biotipo               TEXT,
    experiencia_anos      INTEGER,
    foco_competitivo      TEXT,
    metodologia_preferida TEXT,
    frequencia_semanal    INTEGER,
    disponibilidade_tempo TEXT,
    objetivo_principal    TEXT,
    objetivo_secundario   TEXT,
    observacoes_tecnicas  TEXT,
    status_liberacao      TEXT,
    created_at            TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS treinos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    aluno_id    INTEGER NOT NULL,
    nome        TEXT NOT NULL,
    divisao     TEXT,
    observacoes TEXT,
    created_at  TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS exercicios (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    treino_id   INTEGER NOT NULL,
    nome        TEXT NOT NULL,
    series      TEXT,
    repeticoes  TEXT,
    carga       TEXT,
    descanso    TEXT,
    observacoes TEXT,
    ordem       INTEGER DEFAULT 0,
    FOREIGN KEY (treino_id) REFERENCES treinos(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS avaliacoes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    aluno_id    INTEGER NOT NULL,
    peso        REAL,
    altura      REAL,
    gordura     REAL,
    cintura     REAL,
    quadril     REAL,
    torax       REAL,
    braco       REAL,
    coxa        REAL,
    imc         REAL,
    observacoes TEXT,
    created_at  TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS fotos_posturais (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    aluno_id   INTEGER NOT NULL,
    tipo       TEXT NOT NULL CHECK(tipo IN ('frontal','lateral','posterior')),
    data_url   TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE
  );
`);

// ─── ÍNDICES ──────────────────────────────────────────────────────────────────
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_alunos_user_id       ON alunos(user_id);
  CREATE INDEX IF NOT EXISTS idx_treinos_aluno_id     ON treinos(aluno_id);
  CREATE INDEX IF NOT EXISTS idx_exercicios_treino_id ON exercicios(treino_id);
  CREATE INDEX IF NOT EXISTS idx_avaliacoes_aluno_id  ON avaliacoes(aluno_id);
  CREATE INDEX IF NOT EXISTS idx_fotos_aluno_id       ON fotos_posturais(aluno_id);
  CREATE INDEX IF NOT EXISTS idx_users_email          ON users(email);
`);

// ─── MIGRAÇÕES SEGURAS ────────────────────────────────────────────────────────
// Apenas adiciona colunas que ainda não existem — nunca destrói dados.
const migrations = [
  // users
  { table: 'users', col: 'created_at', type: "TEXT DEFAULT (datetime('now','localtime'))" },
  // alunos
  { table: 'alunos', col: 'user_id',               type: 'INTEGER' },
  { table: 'alunos', col: 'altura',                type: 'REAL' },
  { table: 'alunos', col: 'objetivo',              type: 'TEXT' },
  { table: 'alunos', col: 'telefone',              type: 'TEXT' },
  { table: 'alunos', col: 'observacoes',           type: 'TEXT' },
  { table: 'alunos', col: 'gordura',               type: 'REAL' },
  { table: 'alunos', col: 'cintura',               type: 'REAL' },
  { table: 'alunos', col: 'quadril',               type: 'REAL' },
  { table: 'alunos', col: 'torax',                 type: 'REAL' },
  { table: 'alunos', col: 'braco',                 type: 'REAL' },
  { table: 'alunos', col: 'coxa',                  type: 'REAL' },
  { table: 'alunos', col: 'patologias',            type: 'TEXT' },
  { table: 'alunos', col: 'restricoes',            type: 'TEXT' },
  { table: 'alunos', col: 'nivel_atividade',       type: 'TEXT' },
  { table: 'alunos', col: 'historico_lesoes',      type: 'TEXT' },
  { table: 'alunos', col: 'modalidade',            type: 'TEXT' },
  { table: 'alunos', col: 'biotipo',               type: 'TEXT' },
  { table: 'alunos', col: 'experiencia_anos',      type: 'INTEGER' },
  { table: 'alunos', col: 'foco_competitivo',      type: 'TEXT' },
  { table: 'alunos', col: 'metodologia_preferida', type: 'TEXT' },
  { table: 'alunos', col: 'frequencia_semanal',    type: 'INTEGER' },
  { table: 'alunos', col: 'disponibilidade_tempo', type: 'TEXT' },
  { table: 'alunos', col: 'objetivo_principal',    type: 'TEXT' },
  { table: 'alunos', col: 'objetivo_secundario',   type: 'TEXT' },
  { table: 'alunos', col: 'observacoes_tecnicas',  type: 'TEXT' },
  { table: 'alunos', col: 'status_liberacao',      type: 'TEXT' },
  { table: 'alunos', col: 'created_at',            type: "TEXT DEFAULT (datetime('now','localtime'))" },
  // exercicios
  { table: 'exercicios', col: 'ordem', type: 'INTEGER DEFAULT 0' },
];

for (const m of migrations) {
  try {
    db.exec(`ALTER TABLE ${m.table} ADD COLUMN ${m.col} ${m.type}`);
  } catch (e) {
    // Ignora silenciosamente apenas "duplicate column name" — outros erros são logados
    if (!e.message.includes('duplicate column name')) {
      console.warn(`[DB migration] ${m.table}.${m.col}: ${e.message}`);
    }
  }
}

// ─── DADOS DE DESENVOLVIMENTO ─────────────────────────────────────────────────
// Apenas em ambiente não-produção: atribuir user_id padrão para alunos orphans
if (process.env.NODE_ENV !== 'production') {
  try {
    const defaultUser = db.prepare('SELECT id FROM users LIMIT 1').get();
    if (defaultUser) {
      const r = db.prepare('UPDATE alunos SET user_id = ? WHERE user_id IS NULL').run(defaultUser.id);
      if (r.changes > 0) console.log(`[DB] ${r.changes} aluno(s) sem owner corrigido(s)`);
    }
  } catch (e) {
    // Silencioso: não crítico para boot
  }
}

module.exports = db;