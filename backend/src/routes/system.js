const express = require('express');
const router = express.Router();
const si = require('systeminformation');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [cpu, mem, disk] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize()
    ]);

    res.json({
      cpu: Math.round(cpu.currentLoad),
      ram: Math.round((mem.active / mem.total) * 100),
      disk: Math.round((disk[0].use)),
      details: {
        memTotal: mem.total,
        memUsed: mem.active,
        diskTotal: disk[0].size,
        diskUsed: disk[0].used,
        uptime: si.time().uptime
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

router.post('/update', authMiddleware, adminMiddleware, async (req, res) => {
  const { exec } = require('child_process');
  const path = require('path');
  const fs = require('fs');
  
  const gitRoot = path.join(__dirname, '../../../');
  const updateScript = path.join(gitRoot, 'update.sh');
  
  // En Linux, nos aseguramos que el script sea ejecutable
  if (process.platform === 'linux') {
    try {
      fs.chmodSync(updateScript, '755');
    } catch (e) {
      console.warn('No se pudo dar permisos de ejecución a update.sh:', e.message);
    }
  }

  // Si estamos en Windows (desarrollo), solo hacemos git pull para no fallar
  const command = process.platform === 'linux' ? `bash ${updateScript}` : 'git pull origin main';

  console.log(`Ejecutando comando de actualización: ${command}`);

  exec(command, { cwd: gitRoot }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error de actualización: ${error.message}`);
      return res.status(500).json({ 
        error: 'Error al ejecutar la actualización', 
        details: stderr || error.message,
        path: gitRoot 
      });
    }
    
    console.log(`Salida de actualización: ${stdout}`);
    res.json({ 
      success: true, 
      message: 'Actualización iniciada. El sistema se reiniciará en unos segundos para aplicar los cambios.',
      output: stdout
    });
  });
});

router.post('/reboot', authMiddleware, adminMiddleware, async (req, res) => {
  const { exec } = require('child_process');
  res.json({ success: true, message: 'El equipo se está reiniciando...' });
  setTimeout(() => {
    exec('reboot');
  }, 1000);
});

router.post('/shutdown', authMiddleware, adminMiddleware, async (req, res) => {
  const { exec } = require('child_process');
  res.json({ success: true, message: 'El equipo se está apagando...' });
  setTimeout(() => {
    exec('poweroff');
  }, 1000);
});

module.exports = router;
