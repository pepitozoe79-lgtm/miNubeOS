const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

// Resolve DB path: support absolute paths (production) and relative paths (development)
let dbPath;
const envDbPath = process.env.DB_PATH || '';

if (envDbPath && path.isAbsolute(envDbPath)) {
  // Production: absolute path like /opt/nubeos/data/db/nubeos.sqlite
  dbPath = envDbPath;
} else {
  // Development: relative path from backend folder
  dbPath = path.resolve(__dirname, '../../', envDbPath || 'data/db/nubeos.sqlite');
}

// Ensure the database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

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
