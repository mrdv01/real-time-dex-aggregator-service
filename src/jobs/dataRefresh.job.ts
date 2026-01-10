import cron from 'node-cron';
import aggregatorService from '../services/aggregator.service';
import websocketService from '../services/websocket.service';
import { Token } from '../types';
import { WEBSOCKET_CONFIG } from '../config/constants';

export class DataRefreshJob {
  private job: cron.ScheduledTask | null = null;
  private previousData: Map<string, Token> = new Map();

  start(): void {
    // Run every 10 seconds to ensure quick updates (was 60s, but real-time needs speed)
    // User requested */10
    this.job = cron.schedule('*/10 * * * * *', async () => {
      try {
        console.log('[Job] Refreshing data & broadcasting...');
        await this.refreshAndBroadcast();
      } catch (error) {
        console.error('[Job] Refresh failed:', error);
      }
    });

    console.log('[Job] Data refresh job started');
  }

  stop(): void {
    if (this.job) {
      this.job.stop();
      console.log('[Job] Data refresh job stopped');
    }
  }

  private async refreshAndBroadcast(): Promise<void> {
    // 1. Fetch latest data (also warms cache)
    const { tokens } = await aggregatorService.getTokens();

    // 2. First run -> Snapshot only
    if (this.previousData.size === 0) {
      tokens.forEach(t => this.previousData.set(t.token_address, t));
      websocketService.broadcastSnapshot(tokens);
      return;
    }

    // 3. Subsequent runs -> Check for deltas
    for (const token of tokens) {
      const previous = this.previousData.get(token.token_address);

      if (previous) {
        if (previous.price_sol > 0) {
          const priceChange =
            Math.abs((token.price_sol - previous.price_sol) / previous.price_sol) * 100;

          if (priceChange >= WEBSOCKET_CONFIG.PRICE_CHANGE_THRESHOLD) {
            websocketService.broadcastDelta('token:update', {
              type: 'token:update',
              data: token,
              timestamp: new Date().toISOString(),
              metadata: {
                change: priceChange,
                direction: token.price_sol > previous.price_sol ? 'up' : 'down',
              },
            });
          }
        }
      } else {
        // New token discovered -> Broadcast "token:new"
        websocketService.broadcastDelta('token:new', {
          type: 'token:new',
          data: token,
          timestamp: new Date().toISOString(),
        });
      }

      this.previousData.set(token.token_address, token);
    }
  }
}

export default new DataRefreshJob();
