
import dexscreenerService from '../services/dex/dexscreener.service';
import dataTransformer from '../utils/dataTransformer';
import 'dotenv/config';

// Expose protected method for testing
class DebugDexScreenerService extends (Object.getPrototypeOf(dexscreenerService).constructor) {
  public async debugFetch() {
    const query = 'WSOL'; // Testing if this gives more Solana pairs
    console.log(`Fetching raw data from DexScreener with query: ${query}...`);
    const data = await this.makeRequest(`/search?q=${query}`);
    
    if (!data || !data.pairs) {
      console.log('No pairs returned from API.');
      return;
    }

    console.log(`Raw pairs count: ${data.pairs.length}`);

    const solanaPairs = data.pairs.filter((p: any) => p.chainId === 'solana');
    console.log(`Solana chain pairs: ${solanaPairs.length}`);

    const normalized = dataTransformer.normalizeDexScreener(data);
    console.log(`Normalized tokens (valid address & >0 liq): ${normalized.length}`);

    const filtered = normalized.filter(t => t.liquidity_sol >= 1000 && t.volume_sol >= 1000);
    console.log(`Filtered (>1k liq/vol): ${filtered.length}`);

    if (filtered.length < 5) {
      console.log('Sample of discarded tokens:');
      normalized.slice(0, 5).forEach(t => {
        const kept = t.liquidity_sol >= 1000 && t.volume_sol >= 1000;
        if (!kept) {
            console.log(`- ${t.token_ticker}: Liq $${t.liquidity_sol}, Vol $${t.volume_sol}`);
        }
      });
    }
  }
}

async function run() {
    const debugService = new DebugDexScreenerService();
    await debugService.debugFetch();
}

run();
