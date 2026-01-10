import { BaseDexService } from './base-dex.service';
import { Token } from '../../types';
import { API_URLS } from '../../config/constants';
import dataTransformer from '../../utils/dataTransformer';

export class DexScreenerService extends BaseDexService {
  protected apiName = 'dexscreener';
  protected baseUrl = API_URLS.DEXSCREENER;

  protected async fetchFromApi(): Promise<any> {
   
    const queries = ['pump', 'WIF', 'BONK', 'SOL', 'JUP', 'RAY'];
    const randomQuery = queries[Math.floor(Math.random() * queries.length)];
    
    return this.makeRequest(`/search?q=${randomQuery}`);
  }

  protected transformResponse(data: any): Token[] {
    const tokens = dataTransformer.normalizeDexScreener(data);
    
    // Filter noise: Keep only tokens with >$1k liquidity and >$1k volume
    return tokens
      .filter(t => t.liquidity_sol >= 1000 && t.volume_sol >= 1000)
      .slice(0, 50);
  }
}

export default new DexScreenerService();
