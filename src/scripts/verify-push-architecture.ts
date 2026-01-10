
import dataRefreshJob from '../jobs/dataRefresh.job';
import aggregatorService from '../services/aggregator.service';
import websocketService from '../services/websocket.service';

// Mock dependencies
const mockTokens = [
    { token_address: 'A', price_sol: 100, volume_sol: 1000, liquidity_sol: 5000 },
    { token_address: 'B', price_sol: 50, volume_sol: 500, liquidity_sol: 2500 }
];

// Override getTokens to return mock data
aggregatorService.getTokens = async () => ({ 
    tokens: JSON.parse(JSON.stringify(mockTokens)), 
    pagination: {} as any, 
    cached: false, 
    sources: [] 
});

// Simple spy
let snapshotCalled = 0;
let deltaCalled = 0;

websocketService.broadcastSnapshot = (tokens) => {
    snapshotCalled++;
    console.log(`[MOCK WS] Snapshot sent with ${tokens.length} tokens`);
};

websocketService.broadcastDelta = (event, payload) => {
    deltaCalled++;
    console.log(`[MOCK WS] Delta sent: ${event}`, payload.metadata);
};

// We need to access private method refreshAndBroadcast or just start the job and wait?
// Accessing private method via prototype casting for testing/verification simplicity
const job = dataRefreshJob as any;

async function runTest() {
    console.log('Running 1st Refresh (Snapshot)...');
    await job.refreshAndBroadcast();
    
    if (snapshotCalled === 1) {
        console.log('PASS: broadcastSnapshot called on first run');
    } else {
        console.error('FAIL: broadcastSnapshot NOT called');
    }

    // Change data for 2nd run
    mockTokens[0].price_sol = 110; // 10% increase -> should trigger delta
    mockTokens[1].price_sol = 50.01; // Tiny increase -> should NOT trigger delta (assuming threshold is > 0.1%)
    
    console.log('Running 2nd Refresh (Delta)...');
    await job.refreshAndBroadcast();

    if (deltaCalled >= 1) {
         console.log('PASS: broadcastDelta called for significant change');
    } else {
         console.error('FAIL: broadcastDelta NOT called');
    }
}

// Mocks handled by simple assignment above
// timestamp logic omitted for brevity

runTest();
