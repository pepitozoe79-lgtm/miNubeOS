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
  
  // The git root is the parent folder of 'backend' (3 levels up from routes/system.js)
  const gitRoot = path.join(__dirname, '../../../');
  
  exec('git pull origin main', { cwd: gitRoot }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error de actualización: ${error.message}`);
      return res.status(500).json({ 
        error: 'Error al actualizar desde GitHub', 
        details: stderr || error.message,
        path: gitRoot 
      });
    }
    
    console.log(`Actualización exitosa: ${stdout}`);
    res.json({ 
      success: true, 
      message: 'Aplicación actualizada con éxito',
      output: stdout
    });
  });
});

module.exports = router;
