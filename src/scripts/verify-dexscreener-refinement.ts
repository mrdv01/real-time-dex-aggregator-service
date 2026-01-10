
import dexscreenerService from '../services/dex/dexscreener.service';
import 'dotenv/config';

console.log('Script started');

async function verify() {
  console.log('Verifying DexScreener Refinement...');

  try {
    const tokens = await dexscreenerService.getTokens();

    console.log(`Fetched ${tokens.length} tokens.`);

    if (tokens.length > 50) {
      console.error('FAIL: Token count exceeds limit of 50');
    } else {
      console.log('PASS: Token count is within limit.');
    }

    const lowLiquidity = tokens.filter(t => t.liquidity_sol < 1000);
    const lowVolume = tokens.filter(t => t.volume_sol < 1000);

    if (lowLiquidity.length > 0) {
      console.error(`FAIL: Found ${lowLiquidity.length} tokens with liquidity < $1000`);
      lowLiquidity.forEach(t => console.log(`- ${t.token_ticker}: Liq $${t.liquidity_sol}`));
    } else {
      console.log('PASS: All tokens have liquidity >= $1000');
    }

    if (lowVolume.length > 0) {
      console.error(`FAIL: Found ${lowVolume.length} tokens with volume < $1000`);
      lowVolume.forEach(t => console.log(`- ${t.token_ticker}: Vol $${t.volume_sol}`));
    } else {
      console.log('PASS: All tokens have volume >= $1000');
    }

  } catch (error) {
    console.error('Error running verification:', error);
  }
}

verify();
