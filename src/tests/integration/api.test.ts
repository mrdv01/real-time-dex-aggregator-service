import request from 'supertest';
import app from '../../app';

// Mock all services
jest.mock('../../services/aggregator.service');
jest.mock('../../services/cache.service');
jest.mock('../../services/websocket.service');
jest.mock('../../config/redis');

import aggregatorService from '../../services/aggregator.service';
import cacheService from '../../services/cache.service';
import websocketService from '../../services/websocket.service';
import { getRedisClient } from '../../config/redis';
import { describe } from 'node:test';

describe('REST API Integration Tests', () => {
  describe('GET /api/tokens', () => {
    test('should return paginated token list', async () => {
      const mockResponse = {
        tokens: [
          {
            token_address: 'TEST123',
            token_name: 'Test Token',
            token_ticker: 'TEST', 
            price_sol: 1.0,
            market_cap_sol: 1000,
            volume_sol: 100,
            liquidity_sol: 50,
            transaction_count: 10,
            price_1hr_change: 5,
            protocol: 'raydium',
            sources: ['dexscreener'],
            last_updated: '2024-01-01T00:00:00Z',
          },
        ],
        pagination: {
          nextCursor: null,
          hasMore: false,
          total: 1,
          limit: 20,
        },
        cached: false,
        sources: ['dexscreener'],
      };

      (aggregatorService.getTokens as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/api/tokens?limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.metadata).toBeDefined();
    });

    test('should filter by time period', async () => {
      const mockResponse = {
        tokens: [],
        pagination: { nextCursor: null, hasMore: false, total: 0, limit: 20 },
        cached: false,
        sources: [],
      };

      (aggregatorService.getTokens as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/api/tokens?period=1h')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(aggregatorService.getTokens).toHaveBeenCalledWith(
        expect.objectContaining({ period: '1h' })
      );
    });

    test('should sort by volume', async () => {
      const mockResponse = {
        tokens: [],
        pagination: { nextCursor: null, hasMore: false, total: 0, limit: 20 },
        cached: false,
        sources: [],
      };

      (aggregatorService.getTokens as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/api/tokens?sortBy=volume&order=desc')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(aggregatorService.getTokens).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'volume', order: 'desc' })
      );
    });

    test('should handle invalid parameters', async () => {
      const response = await request(app)
        .get('/api/tokens?period=invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/tokens/:address', () => {
    test('should return token by address', async () => {
      const mockToken = {
        token_address: 'TEST123',
        token_name: 'Test Token',
        token_ticker: 'TEST',
        price_sol: 1.0,
        market_cap_sol: 1000,
        volume_sol: 100,
        liquidity_sol: 50,
        transaction_count: 10,
        price_1hr_change: 5,
        protocol: 'raydium',
        sources: ['dexscreener'],
        last_updated: '2024-01-01T00:00:00Z',
      };

      (aggregatorService.getTokenByAddress as jest.Mock).mockResolvedValue(mockToken);

      const response = await request(app)
        .get('/api/tokens/TEST123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token_address).toBe('TEST123');
    });

    test('should return 404 for non-existent token', async () => {
      (aggregatorService.getTokenByAddress as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/tokens/NONEXISTENT')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Token not found');
    });
  });

  describe('GET /api/health', () => {
    test('should return health status', async () => {
      const mockRedis = {
        ping: jest.fn().mockResolvedValue('PONG'),
      };

      (getRedisClient as jest.Mock).mockReturnValue(mockRedis);

      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.redis).toBe('connected');
      expect(response.body.uptime).toBeGreaterThan(0);
      expect(response.body.memory).toBeDefined();
    });
  });

  describe('GET /api/stats', () => {
    test('should return API statistics', async () => {
      (cacheService.getStats as jest.Mock).mockResolvedValue({
        hits: 100,
        misses: 20,
      });

      (websocketService.getConnectedClients as jest.Mock).mockReturnValue(5);

      const response = await request(app)
        .get('/api/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalRequests).toBe(120);
      expect(response.body.data.cacheHitRate).toBeGreaterThan(0);
      expect(response.body.data.activeWebSocketConnections).toBe(5);
    });
  });
});
