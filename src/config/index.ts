import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || '0.0.0.0',
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_TLS === 'true',
  },
  geckoTerminal: {
    apiKey: process.env.GECKOTERMINAL_API_KEY,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

export default config;
