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
const { authMiddleware } = require('./middleware/auth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Allow inline scripts from Vite build
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// API Routes (must be defined BEFORE static file serving)
app.use('/api/auth', authRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/apps', appsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/system', systemRoutes);

// Protected Sample Route
app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'NubeOS Backend is running', time: new Date() });
});

// --- Serve Frontend Static Files in Production ---
const frontendDistPath = path.join(__dirname, '../../frontend/dist');

if (fs.existsSync(frontendDistPath)) {
  console.log('📦 Serving frontend from:', frontendDistPath);

  // Serve static assets (js, css, images, etc.)
  app.use(express.static(frontendDistPath));

  // SPA Fallback: For any request that doesn't match an API route or
  // static file, serve index.html so Vue Router can handle client-side routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  console.log('⚠️  Frontend build not found. Running in API-only mode.');
  console.log('   (In development, use Vite dev server for the frontend)');
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 NubeOS Backend running on http://localhost:${PORT}`);
});
