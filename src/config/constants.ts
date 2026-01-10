import 'dotenv/config';

export const API_URLS = {
  DEXSCREENER: process.env.DEXSCREENER_BASE_URL || 'https://api.dexscreener.com/latest/dex',
  JUPITER_PRICE: process.env.JUPITER_PRICE_URL || 'https://api.jup.ag/price/v2', // Specific to Price API
  JUPITER_TOKENS: 'https://api.jup.ag', // Using primary API domain which is reachable (tokens.jup.ag has DNS issues)
  GECKOTERMINAL: process.env.GECKOTERMINAL_BASE_URL || 'https://api.geckoterminal.com/api/v2',
};

export const RATE_LIMITS = {
  dexscreener: {
    max: parseInt(process.env.RATE_LIMIT_DEXSCREENER_MAX || '300'),
    window: parseInt(process.env.RATE_LIMIT_DEXSCREENER_WINDOW || '60000'),
  },
  jupiter: {
    max: parseInt(process.env.RATE_LIMIT_JUPITER_MAX || '50'),
    window: parseInt(process.env.RATE_LIMIT_JUPITER_WINDOW || '60000'),
  },
  geckoterminal: {
    max: parseInt(process.env.RATE_LIMIT_GECKOTERMINAL_MAX || '25'),
    window: parseInt(process.env.RATE_LIMIT_GECKOTERMINAL_WINDOW || '60000'),
  },
};

export const CACHE_CONFIG = {
  TTL: parseInt(process.env.CACHE_TTL || '30'),
  ENABLED: process.env.CACHE_ENABLED !== 'false',
  FILTERED_TTL: 60,
};

export const WEBSOCKET_CONFIG = {
  UPDATE_INTERVAL: parseInt(process.env.WS_UPDATE_INTERVAL || '10000'),
  PRICE_CHANGE_THRESHOLD: parseFloat(process.env.WS_PRICE_CHANGE_THRESHOLD || '5'),
  VOLUME_SPIKE_MULTIPLIER: parseFloat(process.env.WS_VOLUME_SPIKE_MULTIPLIER || '2'),
};

export const BACKOFF_CONFIG = {
  initialDelay: 1000,
  maxRetries: 5,
  multiplier: 2,
  maxDelay: 32000,
};

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 50,
};
