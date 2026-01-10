import { Token } from '../types';

export class DataTransformer {

  normalizeDexScreener(data: any): Token[] {
    if (!data?.pairs) return [];

    return data.pairs
      .filter((pair: any) => pair.chainId === 'solana')
      .map((pair: any) => ({
        token_address: pair.baseToken?.address || '',
        token_name: pair.baseToken?.name || 'Unknown',
        token_ticker: pair.baseToken?.symbol || 'UNKNOWN',

        price_sol: Number(pair.priceNative || 0),
        market_cap_sol: Number(pair.fdv || 0),
        
        volume_sol: Number(pair.volume?.h24 || 0), 
        volume_1h: Number(pair.volume?.h1 || 0),
        volume_24h: Number(pair.volume?.h24 || 0),
        volume_7d: Number(pair.volume?.h24 || 0), 

        liquidity_sol: Number(pair.liquidity?.usd || 0),

        transaction_count:
          (pair.txns?.h24?.buys || 0) +
          (pair.txns?.h24?.sells || 0),

        price_1hr_change: Number(pair.priceChange?.h1 || 0),
        price_24h_change: Number(pair.priceChange?.h24 || 0),
        price_7d_change: Number(pair.priceChange?.h6 || 0), 

        protocol: pair.dexId || 'dexscreener',

        sources: ['dexscreener'],
        last_updated: new Date().toISOString(),
      }))
      .filter((t: Token) => t.token_address && t.liquidity_sol > 100 && t.volume_sol > 1000);
  }

  
  normalizeJupiter(data: any): Token[] {
    if (!Array.isArray(data)) return [];

    return data
      .map((t: any) => {
        const volume24h =
          (t.stats24h?.buyVolume || 0) +
          (t.stats24h?.sellVolume || 0);

        return {
          token_address: t.id || '',
          token_name: t.name || 'Unknown',
          token_ticker: t.symbol || 'UNKNOWN',

          price_sol: Number(t.usdPrice || 0),
          market_cap_sol: Number(t.mcap || 0),
          
          volume_sol: volume24h,
          volume_1h: 0,
          volume_24h: volume24h,
          volume_7d: 0, 

          liquidity_sol: Number(t.liquidity || 0),

          transaction_count:
            (t.stats24h?.numBuys || 0) +
            (t.stats24h?.numSells || 0),

          price_1hr_change: Number(t.stats1h?.priceChange || 0),
          price_24h_change: Number(t.stats24h?.priceChange || 0),
          price_7d_change: Number(t.stats7d?.priceChange || 0),

          protocol: 'jupiter',

          sources: ['jupiter'],
          last_updated: t.updatedAt || new Date().toISOString(),
        };
      })
      .filter((t: Token) => t.token_address && t.volume_sol > 1000 && t.liquidity_sol > 100);
  }

  normalizeGeckoTerminal(data: any): Token[] {
    if (!data || !Array.isArray(data.data)) return [];

    return data.data
      .map((pool: any) => {
        const attrs = pool.attributes;
        const baseTokenRel = pool.relationships?.base_token?.data;

        if (!attrs || !baseTokenRel?.id) return null;

        const tokenAddress = baseTokenRel.id.replace('solana_', '');

        const name =
          attrs.name?.split('/')?.[0]?.trim() || 'Unknown';

        return {
          token_address: tokenAddress,
          token_name: name,
          token_ticker: name,

          price_sol: Number(attrs.base_token_price_native_currency || 0),
          market_cap_sol: Number(attrs.market_cap_usd || 0),
          
          volume_sol: Number(attrs.volume_usd?.h24 || 0),
          volume_1h: Number(attrs.volume_usd?.h1 || 0),
          volume_24h: Number(attrs.volume_usd?.h24 || 0),
          volume_7d: 0,

          liquidity_sol: Number(attrs.reserve_in_usd || 0),

          transaction_count:
            (attrs.transactions?.h24?.buys || 0) +
            (attrs.transactions?.h24?.sells || 0),

          price_1hr_change:
            Number(attrs.price_change_percentage?.h1 || 0),
          price_24h_change:
            Number(attrs.price_change_percentage?.h24 || 0),
          price_7d_change:
            Number(attrs.price_change_percentage?.h24 || 0), 

          protocol: pool.relationships?.dex?.data?.id || 'geckoterminal',

          sources: ['geckoterminal'],
          last_updated: new Date().toISOString(),
        };
      })
      .filter(Boolean)
      .filter((t: Token) => t.token_address && t.volume_sol >   1000 && t.liquidity_sol > 100);
  }

 
  normalize(
    data: any,
    source: 'dexscreener' | 'jupiter' | 'geckoterminal'
  ): Token[] {
    switch (source) {
      case 'dexscreener':
        return this.normalizeDexScreener(data);
      case 'jupiter':
        return this.normalizeJupiter(data);
      case 'geckoterminal':
        return this.normalizeGeckoTerminal(data);
      default:
        return [];
    }
  }
}

export default new DataTransformer();
