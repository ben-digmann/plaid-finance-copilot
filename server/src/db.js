
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'db.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Basic schema
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  access_token TEXT,
  institution_name TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cursors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER,
  cursor TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER,
  account_id TEXT UNIQUE,
  name TEXT,
  official_name TEXT,
  type TEXT,
  subtype TEXT,
  mask TEXT,
  available REAL,
  current REAL,
  iso_currency_code TEXT,
  unofficial_currency_code TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER,
  account_id TEXT,
  transaction_id TEXT UNIQUE,
  amount REAL,
  iso_currency_code TEXT,
  date TEXT,
  authorized_date TEXT,
  name TEXT,
  merchant_name TEXT,
  category TEXT,
  pending INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  month TEXT,        -- '2025-08'
  category TEXT,     -- e.g., 'Food and Drink'
  amount REAL
);

CREATE TABLE IF NOT EXISTS securities (
  security_id TEXT PRIMARY KEY,
  ticker TEXT,
  name TEXT,
  type TEXT,
  close_price REAL,
  close_price_as_of TEXT,
  iso_currency_code TEXT
);

CREATE TABLE IF NOT EXISTS holdings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER,
  account_id TEXT,
  security_id TEXT,
  quantity REAL,
  institution_value REAL,
  cost_basis REAL,
  iso_currency_code TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(security_id) REFERENCES securities(security_id)
);
`);

export default db;
