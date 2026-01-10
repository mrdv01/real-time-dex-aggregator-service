import { DataRefreshJob } from '../../jobs/dataRefresh.job';
import aggregatorService from '../../services/aggregator.service';
import websocketService from '../../services/websocket.service';
import { Token } from '../../types';
import { WEBSOCKET_CONFIG } from '../../config/constants';

// Mock dependencies
jest.mock('../../services/aggregator.service');
jest.mock('../../services/websocket.service');

describe('DataRefreshJob', () => {
  let dataRefreshJob: DataRefreshJob;


  const baseToken: Token = {
    token_address: 'So11111111111111111111111111111111111111112',
    token_name: 'Wrapped SOL',
    token_ticker: 'SOL',
    price_sol: 200,
    price_1hr_change: 5,
    price_24h_change: 10,
    price_7d_change: 15,
    volume_sol: 1000000,
    volume_1h: 50000,
    volume_24h: 1000000,
    volume_7d: 7000000,
    liquidity_sol: 500000,
    market_cap_sol: 100000000,
    transaction_count: 1000,
    protocol: 'dexscreener',
    sources: ['dexscreener'],
    last_updated: new Date().toISOString()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // We need to access the private instance or rely on the exported singleton logic. 
    // Since the file exports "new DataRefreshJob()", we can't easily reset its internal state (private previousData) 
    // without some tricks or modifying the class to be friendlier to testing.
    // However, we can access the class definition if we export it named as well (which it does: export class DataRefreshJob).
    
    dataRefreshJob = new DataRefreshJob();
    
    // Default mock response
    (aggregatorService.getTokens as jest.Mock).mockResolvedValue({ tokens: [] });
  });

  describe('refreshAndBroadcast', () => {
    it('should emit token:volume_spike when volume doubles', async () => {
      // 1. First run: Initialize previousData with base volume
      const initialTokens = [baseToken];
      (aggregatorService.getTokens as jest.Mock).mockResolvedValue({ tokens: initialTokens });

      // Call internal method (using any cast to access private method for testing, 
      // or we can call start() but that involves cron. simpler to cast)
      await (dataRefreshJob as any).refreshAndBroadcast();

      // Verify snapshot was sent (first run logic)
      expect(websocketService.broadcastSnapshot).toHaveBeenCalledWith(initialTokens);

      // 2. Second run: Volume increases by MULTIPLIER (2x)
      const spikeToken = {
        ...baseToken,
        volume_sol: baseToken.volume_sol * WEBSOCKET_CONFIG.VOLUME_SPIKE_MULTIPLIER, // 1000 * 2 = 2000
        last_updated: new Date().toISOString()
      };
      
      (aggregatorService.getTokens as jest.Mock).mockResolvedValue({ tokens: [spikeToken] });
      
      await (dataRefreshJob as any).refreshAndBroadcast();

      // Verify volume spike event
      expect(websocketService.broadcastDelta).toHaveBeenCalledWith('token:volume_spike', expect.objectContaining({
        type: 'token:volume_spike',
        data: spikeToken,
        metadata: expect.objectContaining({
          change: WEBSOCKET_CONFIG.VOLUME_SPIKE_MULTIPLIER,
          direction: 'up'
        })
      }));
    });

    it('should NOT emit token:volume_spike when volume increase is below threshold', async () => {
      // 1. First run
      const initialTokens = [baseToken];
      (aggregatorService.getTokens as jest.Mock).mockResolvedValue({ tokens: initialTokens });
      await (dataRefreshJob as any).refreshAndBroadcast();

      // 2. Second run: Volume increases by 1.1x (threshold is 1.2x)
      const minorIncreaseToken = {
        ...baseToken,
        volume_sol: baseToken.volume_sol * 1.1,
        last_updated: new Date().toISOString()
      };
      
      (aggregatorService.getTokens as jest.Mock).mockResolvedValue({ tokens: [minorIncreaseToken] });
      
      await (dataRefreshJob as any).refreshAndBroadcast();

      // Verify NO volume spike event
      expect(websocketService.broadcastDelta).not.toHaveBeenCalledWith('token:volume_spike', expect.anything());
    });
  });
});
