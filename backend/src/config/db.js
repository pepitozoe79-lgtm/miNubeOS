const Database = require('better-sqlite3');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const dbPath = path.isAbsolute(process.env.DB_PATH || '') 
  ? process.env.DB_PATH 
  : path.resolve(__dirname, '../../', process.env.DB_PATH || '../data/db/nubeos.sqlite');

const fs = require('fs');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath, { verbose: console.log });

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

console.log('Connected to SQLite database at:', dbPath);

module.exports = db;
