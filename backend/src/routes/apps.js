const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const dockerService = require('../services/dockerService');

// List installed apps (containers)
router.get('/installed', authMiddleware, async (req, res) => {
  try {
    const containers = await dockerService.getContainers();
    res.json(containers);
  } catch (error) {
    res.status(500).json({ error: 'Error al conectar con Docker' });
  }
});

// List available apps (Store)
router.get('/store', authMiddleware, (req, res) => {
  res.json(dockerService.getAvailableApps());
});

// Install App
router.post('/install/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await dockerService.installApp(req.params.id);
    res.json({ message: 'App instalada e iniciada con éxito' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start App
router.post('/:id/start', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await dockerService.startContainer(req.params.id);
    res.json({ message: 'App iniciada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop App
router.post('/:id/stop', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await dockerService.stopContainer(req.params.id);
    res.json({ message: 'App detenida' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
