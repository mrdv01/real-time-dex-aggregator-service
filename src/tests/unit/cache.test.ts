import { CacheService } from '../../services/cache.service';

jest.mock('../../config/redis', () => {
  const mRedis = {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    incr: jest.fn(),
    ping: jest.fn(),
  };
  return {
    getRedisClient: () => mRedis,
  };
});

import { getRedisClient } from '../../config/redis';

// Mock Redis
const mockRedis = getRedisClient() as any;

jest.mock('../../config/constants', () => ({
  CACHE_CONFIG: {
    ENABLED: true,
    TTL: 60,
  },
}));

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    jest.clearAllMocks();
    cacheService = new CacheService();
  });



  test('should handle cache miss gracefully', async () => {
    mockRedis.get.mockResolvedValue(null);

    const result = await cacheService.get('non-existent-key');

    expect(result).toBeNull();
    expect(mockRedis.get).toHaveBeenCalledWith('non-existent-key');
  });

  test('should retrieve and parse cached data', async () => {
    const testData = { tokens: [], pagination: {} };
    mockRedis.get.mockResolvedValue(JSON.stringify(testData));

    const result = await cacheService.get('test-key');

    expect(result).toEqual(testData);
  });

  test('should set cache with TTL', async () => {
    const testData = { test: 'data' };
    mockRedis.setex.mockResolvedValue('OK');

    await cacheService.set('test-key', testData, 60);

    expect(mockRedis.setex).toHaveBeenCalledWith(
      'test-key',
      60,
      JSON.stringify(testData)
    );
  });

  test('should delete cache key', async () => {
    mockRedis.del.mockResolvedValue(1);

    await cacheService.delete('test-key');

    expect(mockRedis.del).toHaveBeenCalledWith('test-key');
  });

  test('should increment cache hits', async () => {
    mockRedis.incr.mockResolvedValue(1);

    await cacheService.incrementHits();

    expect(mockRedis.incr).toHaveBeenCalledWith('cache:stats:hits');
  });

  test('should increment cache misses', async () => {
    mockRedis.incr.mockResolvedValue(1);

    await cacheService.incrementMisses();

    expect(mockRedis.incr).toHaveBeenCalledWith('cache:stats:misses');
  });

  test('should get cache stats', async () => {
    mockRedis.get.mockImplementation((key: string) => {
      if (key === 'cache:stats:hits') return Promise.resolve('100');
      if (key === 'cache:stats:misses') return Promise.resolve('20');
      return Promise.resolve(null);
    });

    const stats = await cacheService.getStats();

    expect(stats).toEqual({ hits: 100, misses: 20 });
  });
});
