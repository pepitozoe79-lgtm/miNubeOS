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

module.exports = router;
