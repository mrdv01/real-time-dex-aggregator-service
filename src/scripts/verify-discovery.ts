
import dataRefreshJob from '../jobs/dataRefresh.job';
import aggregatorService from '../services/aggregator.service';
import websocketService from '../services/websocket.service';

// Mock Data
const initialTokens = [
    { token_address: 'A', price_sol: 100, volume_sol: 1000, liquidity_sol: 5000 },
    { token_address: 'B', price_sol: 50, volume_sol: 500, liquidity_sol: 2500 }
];

const newTokens = [
    { token_address: 'A', price_sol: 100, volume_sol: 1000, liquidity_sol: 5000 },
    { token_address: 'B', price_sol: 50, volume_sol: 500, liquidity_sol: 2500 },
    { token_address: 'C', price_sol: 10, volume_sol: 100, liquidity_sol: 500 } // NEW
];

// Mock Setup
let callCount = 0;
aggregatorService.getTokens = async () => {
    callCount++;
    const data = callCount === 1 ? initialTokens : newTokens;
    return { 
        tokens: JSON.parse(JSON.stringify(data)), 
        pagination: {} as any, 
        cached: false, 
        sources: [] 
    };
};

// Spies
let newEventCalled = 0;
let lastNewToken = '';

websocketService.broadcastSnapshot = (tokens) => console.log(`[MOCK WS] Snapshot: ${tokens.length} tokens`);
websocketService.broadcastDelta = (event, payload) => {
    if (event === 'token:new') {
        newEventCalled++;
        lastNewToken = payload.data.token_address;
        console.log(`[MOCK WS] New Token Discovered: ${lastNewToken}`);
    }
    // ignore updates for this test
};

// Verify
async function verify() {
    const job = dataRefreshJob as any;
    
    console.log('--- Run 1 (Initial) ---');
    await job.refreshAndBroadcast(); // Should trigger snapshot
    
    console.log('--- Run 2 (Discovery) ---');
    await job.refreshAndBroadcast(); // Should trigger token:new for 'C'

    if (newEventCalled === 1 && lastNewToken === 'C') {
        console.log('PASS: Discovery logic verified.');
    } else {
        console.error(`FAIL: Expected 1 token:new for C, got ${newEventCalled} (Last: ${lastNewToken})`);
        process.exit(1);
    }
}

verify();
