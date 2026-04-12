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

// 2. Standard Upload (for small files)
router.post('/upload', authMiddleware, upload.array('files'), (req, res) => {
  res.json({ message: 'Archivos subidos correctamente' });
});

// 2b. Chunked Upload (for large files)
router.post('/upload/chunk', authMiddleware, multer({ storage: multer.memoryStorage() }).single('chunk'), async (req, res) => {
  let tempDir = '';
  try {
    const { 
      chunkIndex, 
      totalChunks, 
      fileName, 
      path: relPath,
      uploadId 
    } = req.body;

    if (!req.file) throw new Error('No se recibió el fragmento (chunk)');

    const dataDir = path.resolve(__dirname, '../../../data');
    tempDir = path.join(dataDir, 'temp', uploadId);
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const chunkPath = path.join(tempDir, `chunk-${chunkIndex}`);
    fs.writeFileSync(chunkPath, req.file.buffer);

    // Check if all chunks are uploaded
    const uploadedChunks = fs.readdirSync(tempDir).filter(f => f.startsWith('chunk-')).length;
    
    if (uploadedChunks === parseInt(totalChunks)) {
      const finalPath = getSafePath(req.user.username, path.join(relPath || '', fileName));
      const writeStream = fs.createWriteStream(finalPath);

      console.log(`📦 Ensamblando ${totalChunks} fragmentos para: ${fileName}`);

      for (let i = 0; i < totalChunks; i++) {
        const partPath = path.join(tempDir, `chunk-${i}`);
        if (!fs.existsSync(partPath)) {
          throw new Error(`Falta el fragmento ${i} para reensamblar el archivo.`);
        }
        const partBuffer = fs.readFileSync(partPath);
        writeStream.write(partBuffer);
      }

      writeStream.end();
      
      // Wait for stream to finish before cleaning up
      writeStream.on('finish', () => {
        try {
          // Cleanup chunks
          for (let i = 0; i < totalChunks; i++) {
            const partPath = path.join(tempDir, `chunk-${i}`);
            if (fs.existsSync(partPath)) fs.unlinkSync(partPath);
          }
          if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
          console.log(`✅ Archivo reensamblado con éxito: ${fileName}`);
        } catch (e) {
          console.warn('Error limpiando temporales:', e.message);
        }
      });

      return res.json({ message: 'Archivo recibido, procesando ensamblado...', completed: true });
    }

    res.json({ message: `Fragmento ${chunkIndex} recibido`, completed: false });
  } catch (error) {
    console.error('❌ Error en chunked upload:', error.message);
    res.status(500).json({ error: error.message });
  }
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
    const { items, path: relPath } = req.body;
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

// 5. Preview/Serve file (inline viewing without download)
router.get('/preview', authMiddleware, (req, res) => {
  try {
    const relPath = req.query.path || '';
    const fileName = req.query.name;
    if (!fileName) return res.status(400).json({ error: 'Nombre de archivo requerido' });

    const fullPath = getSafePath(req.user.username, path.join(relPath, fileName));

    if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    // Determine MIME type
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes = {
      // Images
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
      '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
      '.bmp': 'image/bmp', '.ico': 'image/x-icon',
      // Video
      '.mp4': 'video/mp4', '.webm': 'video/webm', '.ogg': 'video/ogg',
      '.mov': 'video/quicktime', '.mkv': 'video/x-matroska',
      // Audio
      '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.flac': 'audio/flac',
      '.aac': 'audio/aac', '.m4a': 'audio/mp4',
      // Documents
      '.pdf': 'application/pdf',
      '.txt': 'text/plain', '.md': 'text/plain', '.log': 'text/plain',
      '.json': 'application/json', '.xml': 'text/xml',
      '.html': 'text/html', '.htm': 'text/html',
      '.css': 'text/css', '.js': 'text/javascript',
      '.py': 'text/plain', '.sh': 'text/plain', '.bat': 'text/plain',
      '.yml': 'text/plain', '.yaml': 'text/plain',
      '.ini': 'text/plain', '.conf': 'text/plain', '.cfg': 'text/plain',
      '.csv': 'text/csv',
    };

    const mime = mimeTypes[ext] || 'application/octet-stream';

    // Set headers for inline viewing
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

    const stream = fs.createReadStream(fullPath);
    stream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Download file
router.get('/download', authMiddleware, (req, res) => {
  try {
    const relPath = req.query.path || '';
    const fileName = req.query.name;
    if (!fileName) return res.status(400).json({ error: 'Nombre de archivo requerido' });

    const fullPath = getSafePath(req.user.username, path.join(relPath, fileName));

    if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    res.download(fullPath, fileName);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Rename item
router.post('/rename', authMiddleware, async (req, res) => {
  try {
    const { path: relPath, oldName, newName } = req.body;
    const oldPath = getSafePath(req.user.username, path.join(relPath || '', oldName));
    const newPath = getSafePath(req.user.username, path.join(relPath || '', newName));

    if (fs.existsSync(newPath)) {
      return res.status(400).json({ error: 'Ya existe un archivo con ese nombre' });
    }

    fs.renameSync(oldPath, newPath);
    res.json({ message: 'Elemento renombrado con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Copy item
router.post('/copy', authMiddleware, async (req, res) => {
  try {
    const { fromPath, toPath, name } = req.body;
    const source = getSafePath(req.user.username, path.join(fromPath || '', name));
    const destination = getSafePath(req.user.username, path.join(toPath || '', name));

    if (fs.existsSync(destination)) {
      return res.status(400).json({ error: 'Ya existe un archivo con ese nombre en el destino' });
    }

    const fsExtra = require('fs-extra');
    await fsExtra.copy(source, destination);
    res.json({ message: 'Elemento copiado con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Move item (Cut/Paste)
router.post('/move', authMiddleware, async (req, res) => {
  try {
    const { fromPath, toPath, name } = req.body;
    const source = getSafePath(req.user.username, path.join(fromPath || '', name));
    const destination = getSafePath(req.user.username, path.join(toPath || '', name));

    if (fs.existsSync(destination)) {
      return res.status(400).json({ error: 'Ya existe un archivo con ese nombre en el destino' });
    }

    const fsExtra = require('fs-extra');
    await fsExtra.move(source, destination);
    res.json({ message: 'Elemento movido con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
