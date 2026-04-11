const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
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
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 NubeOS Backend running on http://localhost:${PORT}`);
});
