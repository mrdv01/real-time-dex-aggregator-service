import { Router, Request, Response, NextFunction } from 'express';
import aggregatorService from '../services/aggregator.service';
import cacheService from '../services/cache.service';
import websocketService from '../services/websocket.service';
import { validateTokenQuery } from '../middleware/validator';
import { FilterOptions, ApiResponse, HealthCheckResponse, StatsResponse, Token } from '../types';
import { getRedisClient } from '../config/redis';

const router = Router();

// GET /api/tokens - Get paginated token list
router.get('/tokens', validateTokenQuery, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters: FilterOptions = {
      period: req.query.period as any,
      sortBy: req.query.sortBy as any,
      order: req.query.order as any,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      cursor: req.query.cursor as string,
    };

    const startTime = Date.now();
    const result = await aggregatorService.getTokens(filters);
    const responseTime = Date.now() - startTime;

    const response: ApiResponse<Token[]> = {
      success: true,
      data: result.tokens,
      cached: result.cached,
      timestamp: new Date().toISOString(),
    };

    res.json({
      ...response,
      pagination: result.pagination,
      metadata: {
        cached: result.cached,
        sources: result.sources,
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/tokens/:address - Get specific token details
router.get('/tokens/:address', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address } = req.params;
    const token = await aggregatorService.getTokenByAddress(address);

    if (!token) {
      res.status(404).json({
        success: false,
        error: 'Token not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.json({
      success: true,
      data: token,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/health - Health check
router.get('/health', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const redis = getRedisClient();
    let redisStatus: 'connected' | 'disconnected' = 'disconnected';

    try {
      await redis.ping();
      redisStatus = 'connected';
    } catch (error) {
      console.error('Redis health check failed:', error);
    }

    const memUsage = process.memoryUsage();
    
    const response: HealthCheckResponse = {
      status: redisStatus === 'connected' ? 'healthy' : 'unhealthy',
      redis: redisStatus,
      uptime: Math.floor(process.uptime()),
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
      },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET /api/stats - API statistics
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheStats = await cacheService.getStats();
    const totalRequests = cacheStats.hits + cacheStats.misses;
    const cacheHitRate = totalRequests > 0 
      ? parseFloat((cacheStats.hits / totalRequests).toFixed(2))
      : 0;

    const response: StatsResponse = {
      totalRequests,
      cacheHitRate,
      averageResponseTime: 0, // Can be tracked with middleware
      activeWebSocketConnections: websocketService.getConnectedClients(),
    };

    res.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
