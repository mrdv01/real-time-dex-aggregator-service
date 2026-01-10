export interface Token {
  token_address: string;
  token_name: string;
  token_ticker: string;
  
  price_sol: number;
  market_cap_sol: number;
  liquidity_sol: number;
  transaction_count: number;

  
  volume_sol: number; 
  volume_1h: number;
  volume_24h: number;
  volume_7d: number;
  

  price_1hr_change: number;
  price_24h_change: number;
  price_7d_change: number;

  protocol: string | string[];
  sources: string[];
  last_updated: string;
  metadata?: {
    image_url?: string;
    description?: string;
    website?: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  cached?: boolean;
  timestamp: string;
}

export interface FilterOptions {
  period?: '1h' | '24h' | '7d';
  sortBy?: 'volume' | 'price_change' | 'market_cap';
  order?: 'asc' | 'desc';
  limit?: number;
  cursor?: string;
}

export interface PaginationInfo {
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
  limit: number;
}

export interface TokenListResponse {
  tokens: Token[];
  pagination: PaginationInfo;
  cached: boolean;
  sources: string[];
}

export interface WebSocketEvent {
  type: 'token:update' | 'token:volume_spike' | 'token:new';
  data: Token;
  timestamp: string;
  metadata?: {
    change?: number;
    direction?: 'up' | 'down';
  };
}

export interface RateLimitConfig {
  max: number;
  window: number;
}

export interface DexApiResponse {
  source: 'dexscreener' | 'jupiter' | 'geckoterminal';
  tokens: Token[];
  timestamp: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  redis: 'connected' | 'disconnected';
  uptime: number;
  memory: {
    used: number;
    total: number;
  };
}

export interface StatsResponse {
  totalRequests: number;
  cacheHitRate: number;
  averageResponseTime: number;
  activeWebSocketConnections: number;
}

export interface GeckoTerminalDex {
  id: string;
  type: string;
  attributes: {
    name: string;
  };
}

export interface GeckoTerminalDexResponse {
  data: GeckoTerminalDex[];
  links: {
    first: string;
    prev: string | null;
    next: string | null;
    last: string;
  };
}
