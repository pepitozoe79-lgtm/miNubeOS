const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function setup() {
  const count = db.prepare('SELECT count(*) as total FROM users').get().total;
  if (count > 0) {
    console.log('Admin already exists.');
    return;
  }

  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
    .run('admin', hashedPassword, 'admin');
  
  console.log('Admin created: user: admin, pass: admin123');
}

setup();
