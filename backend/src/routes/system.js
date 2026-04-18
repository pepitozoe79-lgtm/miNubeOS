const express = require('express');
const router = express.Router();
const si = require('systeminformation');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure Multer for wallpaper storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../../data/wallpapers');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'custom-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'), false);
  }
});

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [cpu, mem, disk, net, os] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.networkInterfaceDefault(),
      si.osInfo()
    ]);

    const netInfo = await si.networkInterfaces();
    const primaryNet = netInfo.find(n => n.iface === net) || netInfo[0];

    let version = '1.0.0';
    try {
      version = require('child_process').execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    } catch (e) {
      const pkg = require('../../package.json');
      version = pkg.version || '1.0.0';
    }

    res.json({
      cpu: Math.round(cpu.currentLoad),
      ram: Math.round((mem.active / mem.total) * 100),
      disk: Math.round((disk[3]?.use || disk[0]?.use || 0)),
      version: version,
      hostname: os.hostname,
      ip: primaryNet?.ip4 || '127.0.0.1',
      details: {
        memTotal: mem.total,
        memUsed: mem.active,
        diskTotal: disk[3]?.size || disk[0]?.size,
        diskUsed: disk[3]?.used || disk[0]?.used,
        uptime: si.time().uptime,
        os: os.distro + ' ' + os.release
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// List all wallpapers (Default + Custom)
router.get('/wallpapers', authMiddleware, async (req, res) => {
  const customDir = path.join(__dirname, '../../../data/wallpapers');
  const wallpapers = [
    { name: 'Abstract Blue', url: '/wallpapers/wp1.png', type: 'default' },
    { name: 'Dark Nature', url: '/wallpapers/wp2.png', type: 'default' },
    { name: 'Fluid Waves', url: '/wallpapers/wp3.png', type: 'default' },
    { name: 'Cosmic Night', url: '/wallpapers/wp0.png', type: 'default' },
    { name: 'Cyberpunk City', url: '/wallpapers/wp4.png', type: 'default' },
    { name: 'Minimalist Dawn', url: '/wallpapers/wp5.png', type: 'default' },
    { name: 'Geometric Sun', url: '/wallpapers/wp6.png', type: 'default' },
    { name: 'Forest Mist', url: '/wallpapers/wp7.png', type: 'default' },
    { name: 'Oceanic Deep', url: '/wallpapers/wp8.png', type: 'default' },
  ];

  if (fs.existsSync(customDir)) {
    try {
      const files = fs.readdirSync(customDir);
      files.forEach(file => {
        if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(path.extname(file).toLowerCase())) {
          wallpapers.push({
            name: 'Personalizado',
            url: `/wallpapers/custom/${file}`,
            type: 'custom'
          });
        }
      });
    } catch (e) {
      console.error('Error reading custom wallpapers:', e.message);
    }
  }

  res.json(wallpapers);
});

// Upload custom wallpaper
router.post('/wallpaper', authMiddleware, adminMiddleware, upload.single('wallpaper'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se ha subido ningún archivo' });
  }

  res.json({
    success: true,
    url: `/wallpapers/custom/${req.file.filename}`
  });
});

// New: Delete custom wallpaper
router.delete('/wallpaper', authMiddleware, adminMiddleware, (req, res) => {
  const { url } = req.body;
  
  if (!url || !url.startsWith('/wallpapers/custom/')) {
    return res.status(400).json({ error: 'URL de fondo inválida o no permitida' });
  }

  const filename = path.basename(url);
  const filePath = path.join(__dirname, '../../../data/wallpapers', filename);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return res.json({ success: true, message: 'Fondo eliminado' });
    } else {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar el archivo' });
  }
});

router.post('/update', authMiddleware, adminMiddleware, async (req, res) => {
  const gitRoot = path.join(__dirname, '../../../');
  const updateScript = path.join(gitRoot, 'update.sh');
  
  if (process.platform === 'linux') {
    try {
      fs.chmodSync(updateScript, '755');
    } catch (e) {
      console.warn('No se pudo dar permisos de ejecución a update.sh:', e.message);
    }
  }

  const command = process.platform === 'linux' ? `bash "${updateScript}"` : 'git pull origin main';

  console.log(`[SYS] Iniciando proceso de actualización asíncrono: ${command}`);

  res.json({ 
    success: true, 
    message: 'La actualización se ha iniciado correctamente en el servidor. El sistema sincronizará los archivos de GitHub, reconstruirá el frontend y se reiniciará automáticamente en 2-4 minutos.'
  });

  exec(command, { 
    cwd: gitRoot,
    env: { ...process.env, PATH: process.env.PATH + ':/usr/local/bin' }
  }, (error, stdout, stderr) => {
    if (error) {
      console.error(`[SYS] Error diferido en la actualización: ${error.message}`);
      // Actualizamos el archivo de estado con el error
      const statusFile = path.join(gitRoot, 'data/update_status.json');
      fs.writeFileSync(statusFile, JSON.stringify({ 
        step: 'error', 
        progress: 0, 
        message: `Error: ${stderr || error.message}`,
        timestamp: new Date()
      }));
      return;
    }
    console.log(`[SYS] Proceso de actualización finalizado en segundo plano.`);
  });
});

// New: Check update status
router.get('/update/status', authMiddleware, (req, res) => {
  const statusFile = path.join(__dirname, '../../../data/update_status.json');
  
  if (!fs.existsSync(statusFile)) {
    return res.json({ step: 'idle', progress: 100, message: 'Sistema listo' });
  }

  try {
    const statusData = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
    
    // Si el estado es "idle" o el archivo es muy antiguo (p. ej. > 10 min), 
    // consideramos que no hay actualización activa.
    const lastUpdate = new Date(statusData.timestamp);
    const now = new Date();
    if (statusData.step === 'idle' || (now - lastUpdate > 600000)) {
      return res.json({ step: 'idle', progress: 100, message: 'Listo', lastStatus: statusData });
    }

    res.json(statusData);
  } catch (e) {
    res.status(500).json({ error: 'Error al leer el estado' });
  }
});

router.post('/reboot', authMiddleware, adminMiddleware, async (req, res) => {
  res.json({ success: true, message: 'El equipo se está reiniciando...' });
  setTimeout(() => {
    exec('reboot');
  }, 1000);
});

router.post('/shutdown', authMiddleware, adminMiddleware, async (req, res) => {
  res.json({ success: true, message: 'El equipo se está apagando...' });
  setTimeout(() => {
    exec('poweroff');
  }, 1000);
});

// New: Get external removable drives for desktop icons (with auto-mount)
router.get('/external-drives', authMiddleware, (req, res) => {
  if (process.platform !== 'linux') {
    return res.json([]);
  }

  try {
    const { execSync } = require('child_process');
    const fs = require('fs');

    // 1. Get raw info about removable devices including TRAN (transport)
    const raw = execSync('lsblk -J -o NAME,LABEL,MOUNTPOINT,RM,HOTPLUG,MODEL,TYPE,FSTYPE,TRAN').toString();
    const data = JSON.parse(raw);
    
    const drives = [];
    data.blockdevices.forEach(disk => {
      // BROAD DETECTION: Removable, Hotplug, OR Transport is USB
      const isExternal = disk.rm === "1" || disk.hotplug === "1" || disk.tran === "usb";
      
      if (isExternal) {
        const parts = disk.children || [disk];
        
        parts.forEach(part => {
          // Skip swap or empty parts without filesystem
          if (part.type !== 'part' && part.type !== 'disk') return;

          let mountPoint = part.mountpoint;

          // 2. AUTO-MOUNT LOGIC: If it has FSTYPE but no mountpoint, try to mount it
          if (!mountPoint && part.fstype && part.fstype !== 'swap') {
            const safeName = part.name.replace(/[^a-zA-Z0-9]/g, '');
            const targetDir = `/media/nubeos/${safeName}`;
            
            try {
              if (!fs.existsSync('/media/nubeos')) execSync('sudo mkdir -p /media/nubeos');
              if (!fs.existsSync(targetDir)) execSync(`sudo mkdir -p ${targetDir}`);
              
              // Mounting with permissions
              execSync(`sudo mount /dev/${part.name} ${targetDir} -o uid=1000,gid=1000,umask=000 || sudo mount /dev/${part.name} ${targetDir}`);
              mountPoint = targetDir;
            } catch (mountError) {
              console.error(`Failed to auto-mount ${part.name}`, mountError.message);
            }
          }

          if (mountPoint) {
            drives.push({
              id: `usb_${part.name}`,
              label: part.label || part.name || disk.model || 'Unidad USB',
              path: mountPoint,
              icon: 'HardDrive',
              color: 'orange',
              type: 'drive'
            });
          }
        });
      }
    });

    res.json(drives);
  } catch (e) {
    res.json([]);
  }
});

module.exports = router;
