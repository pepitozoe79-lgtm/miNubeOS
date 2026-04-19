const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { authMiddleware } = require('../middleware/auth');
const { getSafePath } = require('../utils/fileHelper');

const NUBEOS_ROOT = path.resolve(__dirname, '../../../..');

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
    const { path: libPath, name, type } = req.body;
    db.prepare('INSERT INTO eo_libraries (path, name, type) VALUES (?, ?, ?)').run(libPath, name, type || 'movie');
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

// Helper for recursive file scanning
const getAllFiles = (dirPath, arrayOfFiles) => {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
};

// 7. Admin - Scan Libraries
router.post('/admin/scan', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const libraries = db.prepare('SELECT * FROM eo_libraries').all();
    let newItems = 0;

    libraries.forEach(lib => {
      const libPath = lib.path;
      if (!fs.existsSync(libPath)) return;

      const allFiles = getAllFiles(libPath);
      
      allFiles.forEach(filePath => {
        const file = path.basename(filePath);
        const ext = path.extname(file).toLowerCase();
        const isVideo = ['.mp4', '.mkv', '.webm', '.avi'].includes(ext);
        const isAudio = ['.mp3', '.wav', '.flac', '.aac'].includes(ext);

        if (isVideo || isAudio) {
          const fileNameNoExt = path.parse(file).name;
          const seriesMatch = fileNameNoExt.match(/S(\d+)E(\d+)|[S\s](\d+)E(\d+)|\s(\d+)x(\d+)/i);
          const isSeriesRegex = !!seriesMatch;
          
          // Use library type as primary source, or regex if generic
          let type = lib.type;
          if (lib.type === 'generic') {
             type = isVideo ? (isSeriesRegex ? 'series' : 'movie') : 'music';
          }
          
          const isSeries = type === 'series' || (type === 'generic' && isSeriesRegex);

          let season = null;
          let episode = null;
          let seriesName = null;
          let title = fileNameNoExt;

          if (isSeries) {
            const s = seriesMatch[1] || seriesMatch[3] || seriesMatch[5];
            const e = seriesMatch[2] || seriesMatch[4] || seriesMatch[6];
            season = parseInt(s);
            episode = parseInt(e);
            seriesName = fileNameNoExt.split(seriesMatch[0])[0].replace(/[._-]/g, ' ').trim();
            title = `${seriesName} - S${s}E${e}`;
          } else {
             title = fileNameNoExt
              .replace(/\((19|20)\d{2}\)|(19|20)\d{2}/g, '')
              .replace(/[._-]/g, ' ')
              .trim();
          }
          
          const yearMatch = fileNameNoExt.match(/\((19|20)\d{2}\)|(19|20)\d{2}/);
          const year = yearMatch ? parseInt(yearMatch[0].replace(/[()]/g, '')) : new Date().getFullYear();
          
          let posterPath = null;
          // Check for posters in the SAME folder as the movie
          const currentDir = path.dirname(filePath);
          ['.jpg', '.jpeg', '.png', '.webp'].forEach(imgExt => {
            const potentialPoster = path.join(currentDir, fileNameNoExt + imgExt);
            if (fs.existsSync(potentialPoster)) {
              posterPath = potentialPoster;
            }
          });

          const genre = lib.name || 'Desconocido';

          try {
            const result = db.prepare(`
              INSERT OR IGNORE INTO eo_media (title, series_name, season, episode, type, file_path, genre, year, poster_path, is_new)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            `).run(title, seriesName, season, episode, type, filePath, genre, year, posterPath);
            
            if (result.changes > 0) {
              newItems++;
            }
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

// 8. Admin - Get Stats
router.get('/admin/stats', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const stats = {
      movies: db.prepare("SELECT COUNT(*) as count FROM eo_media WHERE type = 'movie'").get().count,
      series: db.prepare("SELECT COUNT(*) as count FROM eo_media WHERE type = 'series'").get().count,
      music: db.prepare("SELECT COUNT(*) as count FROM eo_media WHERE type = 'music'").get().count,
      noPoster: db.prepare("SELECT COUNT(*) as count FROM eo_media WHERE poster_path IS NULL").get().count,
      lastAdded: db.prepare("SELECT title FROM eo_media ORDER BY created_at DESC LIMIT 5").all()
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Admin - List All Media for Management
router.get('/admin/media', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const media = db.prepare('SELECT * FROM eo_media ORDER BY title ASC').all();
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Admin - Update Media Metadata
router.put('/admin/media/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  try {
    const { title, description, genre, year, stars } = req.body;
    db.prepare(`
      UPDATE eo_media 
      SET title = ?, description = ?, genre = ?, year = ?, stars = ?
      WHERE id = ?
    `).run(title, description, genre, year, stars, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 11. Admin - Delete Media
router.delete('/admin/media/:id', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  try {
    db.prepare('DELETE FROM eo_media WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 12. Admin - Browse System Files (Folders Only)
router.get('/admin/browse-fs', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' });
  try {
    let requestedPath = req.query.path || NUBEOS_ROOT;
    let currentPath = path.resolve(requestedPath);
    
    if (!currentPath.startsWith(NUBEOS_ROOT)) {
      currentPath = NUBEOS_ROOT;
    }

    if (!fs.existsSync(currentPath)) {
      currentPath = NUBEOS_ROOT;
    }

    const items = fs.readdirSync(currentPath, { withFileTypes: true });
    const folders = items
      .filter(item => item.isDirectory())
      .map(item => ({
        name: item.name,
        path: path.join(currentPath, item.name).replace(/\\/g, '/')
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      currentPath: currentPath.replace(/\\/g, '/'),
      parentPath: currentPath === NUBEOS_ROOT ? null : path.dirname(currentPath).replace(/\\/g, '/'),
      folders,
      isRoot: currentPath === NUBEOS_ROOT
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
