// server/index.js - Express API server for Brightloop
import express from 'express';
import cors from 'cors';
import path from 'path';
import { apiRouter } from './routes/api.js';
import './db/database.js'; // Ensures DB init and seed

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve static frontend build if dist exists
app.use(express.static('dist'));

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api')) {
      console.log(`[API] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Mount API routes
app.use('/api', apiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Single Page Application fallback
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && req.path !== '/health') {
    return res.sendFile(path.resolve('dist/index.html'), err => {
      if (err) next();
    });
  }
  next();
});

// Start listening
export const server = app.listen(PORT, () => {
  console.log(`⚡ Brightloop Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 REST API ready at http://localhost:${PORT}/api`);
});

export { app };
