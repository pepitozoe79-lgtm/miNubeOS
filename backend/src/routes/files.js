const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { authMiddleware } = require('../middleware/auth');
const { getSafePath } = require('../utils/fileHelper');

// Configure multer for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const relPath = req.query.path || '';
      const dest = getSafePath(req.user.username, relPath);
      cb(null, dest);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// 1. List files and folders
router.get('/list', authMiddleware, (req, res) => {
  try {
    const relPath = req.query.path || '';
    const fullPath = getSafePath(req.user.username, relPath);

    const items = fs.readdirSync(fullPath, { withFileTypes: true });
    
    const result = items.map(item => {
      const stats = fs.statSync(path.join(fullPath, item.name));
      return {
        name: item.name,
        isDirectory: item.isDirectory(),
        size: stats.size,
        modified: stats.mtime,
        extension: path.extname(item.name).toLowerCase()
      };
    });

    res.json({
      currentPath: relPath,
      items: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Upload files
router.post('/upload', authMiddleware, upload.array('files'), (req, res) => {
  res.json({ message: 'Archivos subidos correctamente' });
});

// 3. Create Folder
router.post('/mkdir', authMiddleware, (req, res) => {
  try {
    const { folderName, path: relPath } = req.body;
    if (!folderName) return res.status(400).json({ error: 'Nombre de carpeta requerido' });

    const fullPath = getSafePath(req.user.username, path.join(relPath || '', folderName));
    
    if (fs.existsSync(fullPath)) {
      return res.status(400).json({ error: 'La carpeta ya existe' });
    }

    fs.mkdirSync(fullPath);
    res.json({ message: 'Carpeta creada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Delete File/Folder
router.delete('/delete', authMiddleware, (req, res) => {
  try {
    const { items, path: relPath } = req.body; // Array of names
    if (!items || !Array.isArray(items)) return res.status(400).json({ error: 'Lista de items requerida' });

    items.forEach(itemName => {
      const fullPath = getSafePath(req.user.username, path.join(relPath || '', itemName));
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    });

    res.json({ message: 'Elementos eliminados' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
