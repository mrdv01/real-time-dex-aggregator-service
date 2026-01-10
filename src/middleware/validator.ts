import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const filterSchema = z.object({
  period: z.enum(['1h', '24h', '7d']).optional(),
  sortBy: z.enum(['volume', 'price_change', 'market_cap']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  cursor: z.string().optional(),
});

export const validateTokenQuery = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const validated = filterSchema.parse(req.query);
    req.query = validated as any;
    next();
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Invalid query parameters',
      details: error.errors,
    });
  }
};
