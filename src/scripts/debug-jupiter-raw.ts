
import { JupiterService } from '../services/dex/jupiter.service';
import dataTransformer from '../utils/dataTransformer';
import 'dotenv/config';

class DebugJupiterService extends JupiterService {
  public async debugFetch() {
    console.log('Fetching raw data from Jupiter...');
    try {
         const options = {
      headers: {
        'x-api-key': process.env.JUPITER_API_KEY || '', // Required for api.jup.ag
        'Accept': 'application/json'
      }
    };
        const data = await this.makeRequest('/tokens/v2/tag?query=verified', options);
        
        console.log('Raw Data Type:', Array.isArray(data) ? 'Array' : typeof data);
        if (Array.isArray(data)) {
            console.log('Raw Array Length:', data.length);
            if (data.length > 0) {
                console.log('Sample Item Keys:', Object.keys(data[0]));
                console.log('Sample Item stats24h:', data[0].stats24h);
                console.log('Sample Item liquidity:', data[0].liquidity);
            }
        } else {
            console.log('Data keys:', Object.keys(data));
        }

        const normalized = dataTransformer.normalizeJupiter(data);
        console.log('Normalized Tokens Count:', normalized.length);

        if (Array.isArray(data) && normalized.length === 0 && data.length > 0) {
            console.log('WARNING: All tokens were dropped!');
            const sample = data[0];
            console.log('Sample Token:', JSON.stringify(sample, null, 2));
        } else if (normalized.length < data.length) {
             console.log(`Dropped ${data.length - normalized.length} tokens.`);
             // Check why a sample failed
             // The filter is: t.token_address && t.volume_sol > 0 && t.liquidity_sol > 0
             const failed = data.filter((t: any) => {
                 const vol = (t.stats24h?.buyVolume || 0) + (t.stats24h?.sellVolume || 0);
                 const liq = Number(t.liquidity || 0);
                 return !(t.id && vol > 0 && liq > 0);
             });
             if (failed.length > 0) {
                 console.log('Sample Dropped Token Reason:');
                 const f = failed[0];
                 const vol = (f.stats24h?.buyVolume || 0) + (f.stats24h?.sellVolume || 0);
                 const liq = Number(f.liquidity || 0);
                 console.log(`ID: ${f.id}, Vol: ${vol}, Liq: ${liq}`);
             }
        } else {
            console.log('All tokens passed filter.');
        }

    } catch (error) {
        console.error('Fetch failed:', error);
    }
  }
}

async function run() {
    const debugService = new DebugJupiterService();
    await debugService.debugFetch();
}

run();
