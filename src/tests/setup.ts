
jest.mock('../config/redis', () => ({
  getRedisClient: jest.fn(),
  closeRedisConnection: jest.fn(),
}));

jest.mock('node-cron');

process.env.NODE_ENV = 'test';
process.env.CACHE_ENABLED = 'false';
process.env.REDIS_URL = 'redis://localhost:6379';
