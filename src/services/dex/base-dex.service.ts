import { Token } from '../../types';
import rateLimiter from '../../utils/rateLimiter';

export abstract class BaseDexService {
  protected abstract apiName: string;
  protected abstract baseUrl: string;

  protected abstract fetchFromApi(): Promise<any>;
  protected abstract transformResponse(data: any): Token[];

  async getTokens(): Promise<Token[]> {
    try {
      const data = await rateLimiter.executeWithBackoff(
        () => this.fetchFromApi(),
        this.apiName
      );

      return this.transformResponse(data);
    } catch (error: any) {
      console.error(`Error fetching from ${this.apiName}:`, error.message);
      return [];
    }
  }

  protected async makeRequest(endpoint: string, options: any = {}): Promise<any> {
    const axios = (await import('axios')).default;
    
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        timeout: 10000,
        ...options,
      });
      
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        console.warn(`Rate limited, retry after: ${retryAfter}`);
      }
      throw error;
    }
  }
}
