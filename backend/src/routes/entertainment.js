const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { getSafePath } = require('../utils/fileHelper');

// 1. Get Catalog (Media + User Progress)
router.get('/catalog', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    const query = `
      SELECT m.*, p.seconds as progress, p.is_finished, p.last_watched
      FROM eo_media m
      LEFT JOIN eo_progress p ON m.id = p.media_id AND p.user_id = ?
    `;
    const catalog = db.prepare(query).all(userId);
    res.json(catalog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Stream Media
router.get('/stream/:id', authMiddleware, (req, res) => {
  try {
    const mediaId = req.params.id;
    const media = db.prepare('SELECT * FROM eo_media WHERE id = ?').get(mediaId);
    
    if (!media) return res.status(404).json({ error: 'Media no encontrada' });

    const filePath = media.file_path;
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Archivo de video no encontrado en el servidor' });

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2b. Get Poster Image
router.get('/poster/:id', authMiddleware, (req, res) => {
  try {
    const mediaId = req.params.id;
    const media = db.prepare('SELECT poster_path FROM eo_media WHERE id = ?').get(mediaId);
    
    if (!media || !media.poster_path || !fs.existsSync(media.poster_path)) {
      return res.redirect('/entertainment/posters/stellar_horizon.png');
    }

    const ext = path.extname(media.poster_path).toLowerCase();
    const mimeTypes = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
    res.setHeader('Content-Type', mimeTypes[ext] || 'image/jpeg');
    
    fs.createReadStream(media.poster_path).pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Update Progress
router.post('/progress', authMiddleware, (req, res) => {
  try {
    const { mediaId, seconds, isFinished } = req.body;
    const userId = req.user.id;

    const query = `
      INSERT INTO eo_progress (user_id, media_id, seconds, is_finished, last_watched)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, media_id) DO UPDATE SET
        seconds = excluded.seconds,
        is_finished = excluded.is_finished,
        last_watched = CURRENT_TIMESTAMP
    `;
    db.prepare(query).run(userId, mediaId, seconds, isFinished ? 1 : 0);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Admin - Add Library
router.post('/admin/libraries', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const { path: libPath, name } = req.body;
    db.prepare('INSERT INTO eo_libraries (path, name) VALUES (?, ?)').run(libPath, name);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Admin - List Libraries
router.get('/admin/libraries', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const libs = db.prepare('SELECT * FROM eo_libraries').all();
    res.json(libs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Admin - Remove Library
router.delete('/admin/libraries/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  try {
    db.prepare('DELETE FROM eo_libraries WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Admin - Scan Libraries
router.post('/admin/scan', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const libraries = db.prepare('SELECT * FROM eo_libraries').all();
    let newItems = 0;

    libraries.forEach(lib => {
      const libPath = lib.path;
      if (!fs.existsSync(libPath)) return;

      const files = fs.readdirSync(libPath);
      files.forEach(file => {
        const ext = path.extname(file).toLowerCase();
        if (['.mp4', '.mkv', '.webm', '.avi'].includes(ext)) {
          const filePath = path.join(libPath, file);
          const fileNameNoExt = path.parse(file).name;
          
          const yearMatch = fileNameNoExt.match(/\((19|20)\d{2}\)|(19|20)\d{2}/);
          const year = yearMatch ? parseInt(yearMatch[0].replace(/[()]/g, '')) : new Date().getFullYear();
          
          let title = fileNameNoExt
            .replace(/\((19|20)\d{2}\)|(19|20)\d{2}/g, '')
            .replace(/[._-]/g, ' ')
            .trim();
          
          let posterPath = null;
          ['.jpg', '.jpeg', '.png', '.webp'].forEach(imgExt => {
            const potentialPoster = path.join(libPath, fileNameNoExt + imgExt);
            if (fs.existsSync(potentialPoster)) {
              posterPath = potentialPoster;
            }
          });

          const genre = lib.name || 'Desconocido';

          try {
            db.prepare(`
              INSERT OR IGNORE INTO eo_media (title, type, file_path, genre, year, poster_path, is_new)
              VALUES (?, 'movie', ?, ?, ?, ?, 1)
            `).run(title, filePath, genre, year, posterPath);
            newItems++;
          } catch (e) { 
            console.error('Error inserting media:', e.message);
          }
        }
      });
    });

    res.json({ success: true, newItems });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
