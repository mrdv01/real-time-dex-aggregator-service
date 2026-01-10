import { getRedisClient } from '../config/redis';
import { CACHE_CONFIG } from '../config/constants';

export class CacheService {
  private redis = getRedisClient();

  async get<T>(key: string): Promise<T | null> {
    try {
      if (!CACHE_CONFIG.ENABLED) return null;
      
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = CACHE_CONFIG.TTL): Promise<void> {
    try {
      if (!CACHE_CONFIG.ENABLED) return;
      
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.redis.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100
        );
        cursor = nextCursor;
        
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } while (cursor !== '0');
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  }



  async warmCache(): Promise<void> {
    
  }

  async getStats(): Promise<{ hits: number; misses: number }> {
    try {
      const hits = await this.redis.get('cache:stats:hits');
      const misses = await this.redis.get('cache:stats:misses');
      
      return {
        hits: parseInt(hits || '0'),
        misses: parseInt(misses || '0'),
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { hits: 0, misses: 0 };
    }
  }

  async incrementHits(): Promise<void> {
    try {
      await this.redis.incr('cache:stats:hits');
    } catch (error) {
      console.error('Cache increment hits error:', error);
    }
  }

  async incrementMisses(): Promise<void> {
    try {
      await this.redis.incr('cache:stats:misses');
    } catch (error) {
      console.error('Cache increment misses error:', error);
    }
  }
}

export default new CacheService();
