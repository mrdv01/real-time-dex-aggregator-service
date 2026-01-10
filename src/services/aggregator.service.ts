import { Token, FilterOptions, TokenListResponse, PaginationInfo } from '../types';
import { PAGINATION, CACHE_CONFIG } from '../config/constants';
import dexScreenerService from './dex/dexscreener.service';
import jupiterService from './dex/jupiter.service';
import geckoTerminalService from './dex/geckoterminal.service';
import cacheService from './cache.service';
import tokenMerger from '../utils/tokenMerger';

export class AggregatorService {
  async getTokens(filters?: FilterOptions): Promise<TokenListResponse> {
    const baseCacheKey = 'tokens:base';
    
    // 1. Try cache
    let allTokens = await cacheService.get<Token[]>(baseCacheKey);
    let isCached = true;

    if (!allTokens) {
      isCached = false;
      await cacheService.incrementMisses();

      // 2. Fetch from APIs
      const results = await Promise.allSettled([
        dexScreenerService.getTokens(),
        jupiterService.getTokens(),
        geckoTerminalService.getTokens(),
      ]);

      // Log errors if any failed, but continue with successful ones
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const sources = ['DexScreener', 'Jupiter', 'GeckoTerminal'];
          console.error(`[${sources[index]}] failed:`, result.reason);
        }
      });

      // 3. Combine raw tokens
      const rawTokens: Token[] = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => (r as PromiseFulfilledResult<Token[]>).value);

      // 4. Merge
      allTokens = tokenMerger.merge(rawTokens);

      // 5. Cache base list
      await cacheService.set(baseCacheKey, allTokens, CACHE_CONFIG.TTL);
    } else {
      await cacheService.incrementHits();
    }

    // 6. Filtering & sorting
    const filteredTokens = this.applyFilters(allTokens, filters);

    // 7. Pagination
    const { tokens, pagination } = this.paginate(filteredTokens, filters);

    return {
      tokens,
      pagination,
      cached: isCached,
      sources: ['dexscreener', 'jupiter', 'geckoterminal'],
    };
  }

  async getTokenByAddress(address: string): Promise<Token | null> {
    const cacheKey = `token:detail:${address.toLowerCase()}`;
    const cached = await cacheService.get<Token>(cacheKey);

    if (cached) {
      return cached;
    }

    const { tokens } = await this.getTokens();
    const token = tokens.find(
      t => t.token_address.toLowerCase() === address.toLowerCase()
    );

    if (token) {
      await cacheService.set(cacheKey, token, 30);
    }

    return token || null;
  }

  private applyFilters(tokens: Token[], filters?: FilterOptions): Token[] {
    const result = [...tokens];

    const sortBy = filters?.sortBy || 'volume';
    const order = filters?.order || 'desc';

    result.sort((a, b) => {
      let aValue = 0;
      let bValue = 0;

      switch (sortBy) {
        case 'volume':
          aValue = a.volume_sol;
          bValue = b.volume_sol;
          break;
        case 'price_change':
          aValue = a.price_1hr_change;
          bValue = b.price_1hr_change;
          break;
        case 'market_cap':
          aValue = a.market_cap_sol;
          bValue = b.market_cap_sol;
          break;
      }

      return order === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return result;
  }

  private paginate(
    tokens: Token[],
    filters?: FilterOptions
  ): { tokens: Token[]; pagination: PaginationInfo } {
    const limit = Math.min(
      filters?.limit || PAGINATION.DEFAULT_LIMIT,
      PAGINATION.MAX_LIMIT
    );
    const cursorIndex = filters?.cursor
      ? parseInt(filters.cursor)
      : 0;

    const paginatedTokens = tokens.slice(
      cursorIndex,
      cursorIndex + limit
    );
    const hasMore = cursorIndex + limit < tokens.length;

    return {
      tokens: paginatedTokens,
      pagination: {
        nextCursor: hasMore
          ? (cursorIndex + limit).toString()
          : null,
        hasMore,
        total: tokens.length,
        limit,
      },
    };
  }
}

export default new AggregatorService();
