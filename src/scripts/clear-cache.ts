
import dotenv from 'dotenv';
dotenv.config();

import Redis from 'ioredis';

async function clearCache() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.error('REDIS_URL not found in environment variables');
    process.exit(1);
  }

  console.log('Connecting to Redis...');
  const redis = new Redis(redisUrl, {
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
  });

  try {
    console.log('Flushing all keys...');
    await redis.flushall();
    console.log('Successfully cleared Redis cache.');
  } catch (error) {
    console.error('Error clearing cache:', error);
  } finally {
    await redis.quit();
  }
}

clearCache();
