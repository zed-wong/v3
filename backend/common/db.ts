import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// SQLite database configuration
const DB_DIR = process.env.DB_DIR || path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'mrm.db');

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Create and export database instance
export const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initializeDatabase() {
  // Strategies tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS strategies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      parameters TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'inactive',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS executions (
      id TEXT PRIMARY KEY,
      strategy_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'running',
      started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      stopped_at DATETIME,
      error TEXT,
      metrics TEXT NOT NULL DEFAULT '{}',
      FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_strategies_status ON strategies(status);
    CREATE INDEX IF NOT EXISTS idx_strategies_type ON strategies(type);
    CREATE INDEX IF NOT EXISTS idx_executions_strategy_id ON executions(strategy_id);
    CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);
  `);

  // Market making tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      pair TEXT NOT NULL,
      exchange TEXT NOT NULL,
      strategy_id TEXT NOT NULL,
      config TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'pending',
      started_at DATETIME,
      stopped_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      exchange_order_id TEXT,
      side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
      price REAL NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      filled_at DATETIME,
      cancelled_at DATETIME,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS metrics (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      spread REAL,
      volume_24h REAL,
      orders_placed INTEGER DEFAULT 0,
      orders_filled INTEGER DEFAULT 0,
      orders_cancelled INTEGER DEFAULT 0,
      pnl REAL DEFAULT 0,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
    CREATE INDEX IF NOT EXISTS idx_sessions_exchange ON sessions(exchange);
    CREATE INDEX IF NOT EXISTS idx_orders_session_id ON orders(session_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_metrics_session_id ON metrics(session_id);
    CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp);
  `);

  // TEE tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS attestations (
      attestation_id TEXT PRIMARY KEY,
      instance_id TEXT NOT NULL,
      verified INTEGER NOT NULL DEFAULT 1,
      signature TEXT NOT NULL,
      timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS instances (
      instance_id TEXT PRIMARY KEY,
      public_key TEXT NOT NULL,
      enclave_quote TEXT,
      tee_provider TEXT NOT NULL,
      attested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_attestations_instance_id ON attestations(instance_id);
    CREATE INDEX IF NOT EXISTS idx_instances_tee_provider ON instances(tee_provider);
  `);

  // Create update trigger for updated_at columns
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_strategies_updated_at
    AFTER UPDATE ON strategies
    BEGIN
      UPDATE strategies SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

    CREATE TRIGGER IF NOT EXISTS update_sessions_updated_at  
    AFTER UPDATE ON sessions
    BEGIN
      UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);
}

// Initialize database on module load
initializeDatabase();

// Helper functions for common operations
export const prepare = (sql: string) => db.prepare(sql);
export const transaction = (fn: () => void) => db.transaction(fn)();