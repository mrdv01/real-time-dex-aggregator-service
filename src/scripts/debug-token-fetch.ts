
import dotenv from 'dotenv';
dotenv.config();

import dexscreenerService from '../services/dex/dexscreener.service';
import jupiterService from '../services/dex/jupiter.service';
import geckoTerminalService from '../services/dex/geckoterminal.service';
import tokenMerger from '../utils/tokenMerger';

const RATE_LIMIT_DELAY = 1000;

async function debug() {
  console.log('--- Debugging Token Fetch ---');

  try {
    console.log('1. Fetching DexScreener...');
    const dexData = await dexscreenerService.getTokens();
    console.log(`   > DexScreener returned ${dexData.length} tokens`);
    if(dexData.length > 0) console.log('   Sample:', dexData[0].token_name);

    // Wait a bit to avoid rate limits since we are hitting them in parallel normally
    await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY));

    console.log('\n2. Fetching Jupiter...');
    const jupData = await jupiterService.getTokens();
    console.log(`   > Jupiter returned ${jupData.length} tokens`);
    if(jupData.length > 0) console.log('   Sample:', jupData[0].token_name);

    await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY));

    console.log('\n3. Fetching GeckoTerminal...');
    const geckoData = await geckoTerminalService.getTokens();
    console.log(`   > GeckoTerminal returned ${geckoData.length} tokens`);
    if(geckoData.length > 0) console.log('   Sample:', geckoData[0].token_name);


    console.log('\n--- Merging ---');
    const all = [...dexData, ...jupData, ...geckoData];
    console.log(`Total raw tokens: ${all.length}`);
    
    const merged = tokenMerger.merge(all);
    console.log(`Merged unique tokens: ${merged.length}`);
    
    if (merged.length > 0) {
        console.log('\nTop 5 Merged Tokens:');
        merged.slice(0, 5).forEach(t => {
            console.log(` - ${t.token_name} (${t.token_ticker}) [${t.sources.join(', ')}] Price: ${t.price_sol}`);
        });
    }

  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debug();
