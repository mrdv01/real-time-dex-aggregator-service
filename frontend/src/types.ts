export interface Token {
  token_address: string;
  token_name: string;
  token_ticker: string;
  price_sol: number;
  volume_sol: number;
  liquidity_sol: number;
  market_cap_sol: number;
  transaction_count: number;
  last_updated: string;
  price_1hr_change?: number;
  lastTransition?: 'up' | 'down';
}

export interface TokenMetadata {
  change?: number;
  direction?: 'up' | 'down';
}

export interface WebSocketEvent {
  type: 'token:new' | 'token:update' | 'token:volume_spike';
  data: Token;
  timestamp: string;
  metadata?: TokenMetadata;
}

export type Period = '1h' | '24h' | '7d';
export type SortBy = 'volume' | 'price_change' | 'market_cap';
export type SortOrder = 'asc' | 'desc';

export interface FilterState {
  period: Period;
  sortBy: SortBy;
  order: SortOrder;
}

export interface PaginationState {
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ApiResponse {
  success: boolean;
  data: Token[];
  pagination?: {
    nextCursor?: string;
    hasMore: boolean;
  };
}
