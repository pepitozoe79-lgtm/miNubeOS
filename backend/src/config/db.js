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

  CREATE TABLE IF NOT EXISTS eo_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    series_name TEXT,
    season INTEGER,
    episode INTEGER,
    description TEXT,
    type TEXT CHECK(type IN ('movie', 'series', 'music')) NOT NULL,
    genre TEXT,
    year INTEGER,
    rating TEXT,
    poster_path TEXT,
    banner_path TEXT,
    file_path TEXT UNIQUE NOT NULL,
    stars INTEGER DEFAULT 5,
    is_new INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS eo_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    media_id INTEGER NOT NULL,
    seconds INTEGER DEFAULT 0,
    is_finished INTEGER DEFAULT 0,
    last_watched DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(media_id) REFERENCES eo_media(id),
    UNIQUE(user_id, media_id)
  );

  CREATE TABLE IF NOT EXISTS eo_libraries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// --- Multimedia Structure Initialization ---
const multimediaBase = path.resolve(__dirname, '../../data/multimedia');
const defaultLibs = [
  { name: 'Películas', folder: 'Peliculas' },
  { name: 'Series', folder: 'Series' },
  { name: 'Música', folder: 'Musica' }
];

try {
  defaultLibs.forEach(lib => {
    const fullPath = path.join(multimediaBase, lib.folder).replace(/\\/g, '/');
    
    // 1. Create directory if missing
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Carpeta multimedia creada: ${fullPath}`);
    }

    // 2. Register in DB if missing
    const exists = db.prepare('SELECT id FROM eo_libraries WHERE path = ?').get(fullPath);
    if (!exists) {
      db.prepare('INSERT INTO eo_libraries (path, name) VALUES (?, ?)').run(fullPath, lib.name);
      console.log(`✅ Librería por defecto mapeada en DB: ${lib.name}`);
    }
  });
} catch (err) {
  console.error('⚠️ Error inicializando estructura multimedia:', err.message);
}

console.log('Connected to SQLite database at:', dbPath);

module.exports = db;
