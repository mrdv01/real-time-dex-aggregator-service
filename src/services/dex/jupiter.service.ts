import { BaseDexService } from './base-dex.service';
import { Token } from '../../types';
import { API_URLS } from '../../config/constants';
import dataTransformer from '../../utils/dataTransformer';

export class JupiterService extends BaseDexService {
  protected apiName = 'jupiter';
  protected baseUrl = API_URLS.JUPITER_TOKENS;

  private readonly apiKey = process.env.JUPITER_API_KEY;

  protected async fetchFromApi(): Promise<any> {
    const options = {
      headers: {
        'x-api-key': this.apiKey || '',
        'Accept': 'application/json'
      }
    };

    return this.makeRequest('/tokens/v2/tag?query=verified', options);
  }

  protected transformResponse(data: any): Token[] {
    return dataTransformer.normalizeJupiter(data);
  }
}

export default new JupiterService();
