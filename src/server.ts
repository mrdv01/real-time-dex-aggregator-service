import http from 'http';
import app from './app';
import config from './config';
import { getRedisClient, closeRedisConnection } from './config/redis';
import websocketService from './services/websocket.service';
import dataRefreshJob from './jobs/dataRefresh.job';

const server = http.createServer(app);

// Initialize WebSocket
websocketService.init(server);

// Start background jobs
dataRefreshJob.start();

// Start server
server.listen(config.port, config.host, () => {
  console.log(`\nServer running on http://${config.host}:${config.port}`);
  console.log(`Environment: ${config.env}`);
  console.log(`WebSocket: Enabled`);
  console.log(`Redis: ${config.redis.url}\n`);
});

// Initialize Redis connection
const redis = getRedisClient();
redis.on('ready', () => {
  console.log('Redis connection established\n');
});

// Graceful shutdown
const shutdown = async () => {
  console.log('\n Shutting down gracefully...');

  server.close(() => {
    console.log('HTTP server closed');
  });

  websocketService.stop();
  console.log('WebSocket service stopped');

  dataRefreshJob.stop();
  console.log('Background jobs stopped');

  await closeRedisConnection();
  console.log('Redis connection closed');

  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

export default server;
