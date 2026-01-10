import { BaseDexService } from './base-dex.service';
import { Token } from '../../types';
import { API_URLS } from '../../config/constants';

import dataTransformer from '../../utils/dataTransformer';

export class GeckoTerminalService extends BaseDexService {
  protected apiName = 'geckoterminal';
  protected baseUrl = API_URLS.GECKOTERMINAL;

  protected async fetchFromApi(): Promise<any> {
    const options: any = {
      headers: {
        'Accept': 'application/json'
      },
    };

    return this.makeRequest('/networks/solana/trending_pools?include=base_token', options);
  }

  protected transformResponse(data: any): Token[] {
   
    return dataTransformer.normalize(data, 'geckoterminal'); 
  
  }

  public async getDexes(network: string, page: number = 1): Promise<any> {
    return this.makeRequest(`/networks/${network}/dexes?page=${page}`);
  }
}

export default new GeckoTerminalService();
