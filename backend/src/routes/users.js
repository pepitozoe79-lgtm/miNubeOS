const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// List users
router.get('/', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, role, created_at FROM users').all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user
router.post('/', authMiddleware, adminMiddleware, (req, res) => {
  const { username, password, role } = req.body;
  
  if (!username || !password) return res.status(400).json({ error: 'Usuario y clave requeridos' });

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
      .run(username, hashedPassword, role || 'user');
    
    res.json({ message: 'Usuario creado' });
  } catch (error) {
    res.status(400).json({ error: 'El usuario ya existe o datos inválidos' });
  }
});

// Delete user
router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    if (id == req.user.id) return res.status(400).json({ error: 'No puedes borrar tu propio usuario' });

    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
