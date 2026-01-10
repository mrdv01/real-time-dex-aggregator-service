import express, { Application } from 'express';
import { corsMiddleware } from './middleware/cors';
import { errorHandler } from './middleware/errorHandler';
import tokensRouter from './routes/tokens.routes';
import dotenv from "dotenv";
dotenv.config();

const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(corsMiddleware);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Routes
app.use('/api', tokensRouter);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'Real-Time DEX Aggregator API',
    version: '1.0.0',
    endpoints: {
      tokens: '/api/tokens',
      tokenDetail: '/api/tokens/:address',
      health: '/api/health',
      stats: '/api/stats',
    },
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    timestamp: new Date().toISOString(),
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
