import { getRedisClient } from '../config/redis';
import { RATE_LIMITS, BACKOFF_CONFIG } from '../config/constants';
import { RateLimitConfig } from '../types';

export class RateLimiter {
  private redis = getRedisClient();

  async canMakeRequest(apiName: string): Promise<boolean> {
    const config = this.getRateLimitConfig(apiName);
    if (!config) return true;

    const key = this.getKey(apiName);
    const count = await this.redis.get(key);

    if (!count) return true;
    return parseInt(count) < config.max;
  }

  async executeWithBackoff<T>(
    fn: () => Promise<T>,
    apiName: string
  ): Promise<T> {
    let delay = BACKOFF_CONFIG.initialDelay;

    for (let attempt = 0; attempt < BACKOFF_CONFIG.maxRetries; attempt++) {
      if (await this.canMakeRequest(apiName)) {
        try {
          await this.incrementCounter(apiName);
          return await fn();
        } catch (error: any) {
          if (error.response?.status === 429) {
            console.warn(`Rate limited by ${apiName}, retrying in ${delay}ms...`);
            await this.sleep(delay);
            delay = Math.min(delay * BACKOFF_CONFIG.multiplier, BACKOFF_CONFIG.maxDelay);
            continue;
          }
          throw error;
        }
      } else {
        console.warn(`Rate limit reached for ${apiName}, waiting ${delay}ms...`);
        await this.sleep(delay);
        delay = Math.min(delay * BACKOFF_CONFIG.multiplier, BACKOFF_CONFIG.maxDelay);
      }
    }

    throw new Error(`Max retries exceeded for ${apiName}`);
  }

  async incrementCounter(apiName: string): Promise<void> {
    const config = this.getRateLimitConfig(apiName);
    if (!config) return;

    const key = this.getKey(apiName);
    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.pexpire(key, config.window);
    }
  }

  private getKey(apiName: string): string {
    const minute = Math.floor(Date.now() / 60000);
    return `rate_limit:${apiName}:${minute}`;
  }

  private getRateLimitConfig(apiName: string): RateLimitConfig | null {
    const limits: Record<string, RateLimitConfig> = RATE_LIMITS;
    return limits[apiName] || null;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getRemainingRequests(apiName: string): Promise<number> {
    const config = this.getRateLimitConfig(apiName);
    if (!config) return Infinity;

    const key = this.getKey(apiName);
    const count = await this.redis.get(key);

    if (!count) return config.max;
    return Math.max(0, config.max - parseInt(count));
  }
}

export default new RateLimiter();
