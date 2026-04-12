const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Setup Initial Admin (Sólo si no hay usuarios)
router.post('/setup', (req, res) => {
  const { username, password } = req.body;

  try {
    const count = db.prepare('SELECT count(*) as total FROM users').get().total;
    if (count > 0) {
      return res.status(400).json({ error: 'El sistema ya ha sido configurado' });
    }

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
      .run(username, hashedPassword, 'admin');

    res.json({ message: 'Administrador creado correctamente' });
  } catch (error) {
    console.error('Error durante el setup inicial:', error);
    res.status(500).json({ error: `Error en el servidor: ${error.message}` });
  }
});

// Check if setup is needed
router.get('/status', (req, res) => {
  try {
    const count = db.prepare('SELECT count(*) as total FROM users').get().total;
    res.json({
      isConfigured: count > 0
    });
  } catch (error) {
    console.error('Error al verificar el estado del sistema:', error);
    res.status(500).json({ error: `Error al verificar estado: ${error.message}` });
  }
});

module.exports = router;
