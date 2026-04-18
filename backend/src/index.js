const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const authRoutes = require('./routes/auth');
const filesRoutes = require('./routes/files');
const appsRoutes = require('./routes/apps');
const usersRoutes = require('./routes/users');
const systemRoutes = require('./routes/system');
const networkRoutes = require('./routes/network');
const storageRoutes = require('./routes/storage');
const { authMiddleware } = require('./middleware/auth');
const { attachTerminalWebSocket } = require('./services/terminalService');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Routes (must be defined BEFORE static file serving)
app.use('/api/auth', authRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/apps', appsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/storage', storageRoutes);

// Protected Sample Route
app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'NubeOS Backend is running', time: new Date() });
});

// --- Custom Wallpapers Storage ---
const wallpapersDir = path.join(__dirname, '../../data/wallpapers');
if (!fs.existsSync(wallpapersDir)) {
  fs.mkdirSync(wallpapersDir, { recursive: true });
}
// Serve custom wallpapers statically
app.use('/wallpapers/custom', express.static(wallpapersDir));

// --- Serve Frontend Static Files in Production ---
const frontendDistPath = path.join(__dirname, '../../frontend/dist');

if (fs.existsSync(frontendDistPath)) {
  console.log('📦 Serving frontend from:', frontendDistPath);

  // Serve static assets (js, css, images, etc.)
  // Disable cache to ensure updates are seen immediately
  app.use(express.static(frontendDistPath, {
    etag: false,
    maxAge: 0,
    setHeaders: (res, path) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }));

  // SPA Fallback: For any request that doesn't match an API route or
  // static file, serve index.html so Vue Router can handle client-side routing
  app.get('{*path}', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  console.log('⚠️  Frontend build not found. Running in API-only mode.');
  console.log('   (In development, use Vite dev server for the frontend)');
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 NubeOS Backend running on http://localhost:${PORT}`);
});

// Attach Terminal WebSocket to HTTP server
attachTerminalWebSocket(server);

server.timeout = 600000; // 10 minutes timeout for large uploads
