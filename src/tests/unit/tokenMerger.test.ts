import { TokenMerger } from '../../utils/tokenMerger';
import { Token } from '../../types';

describe('TokenMerger', () => {
  let tokenMerger: TokenMerger;

  beforeEach(() => {
    tokenMerger = new TokenMerger();
  });

  test('should merge tokens with same address', () => {
    const tokens: Token[] = [
      {
        token_address: 'ABC123',
        token_name: 'Token A',
        token_ticker: 'TKA',
        price_sol: 1.0,
        market_cap_sol: 1000,
        volume_sol: 100,
        liquidity_sol: 50,
        transaction_count: 10,
        volume_1h: 0,
        volume_24h: 0,
        volume_7d: 0,
        price_24h_change: 0,
        price_7d_change: 0,
        price_1hr_change: 5,
        protocol: 'dex1',
        sources: ['dexscreener'],
        last_updated: '2024-01-01T00:00:00Z',
      },
      {
        token_address: 'ABC123',
        token_name: 'Token A',
        token_ticker: 'TKA',
        price_sol: 1.5,
        market_cap_sol: 1500,
        volume_sol: 200,
        liquidity_sol: 75,
        transaction_count: 15,
        volume_1h: 0,
        volume_24h: 0,
        volume_7d: 0,
        price_24h_change: 0,
        price_7d_change: 0,
        price_1hr_change: 3,
        protocol: 'dex2',
        sources: ['jupiter'],
        last_updated: '2024-01-01T01:00:00Z',
      },
    ];

    const result = tokenMerger.merge(tokens);

    expect(result.length).toBe(1);
    expect(result[0].volume_sol).toBe(300); // 100 + 200
    expect(result[0].liquidity_sol).toBe(125); // 50 + 75
    expect(result[0].transaction_count).toBe(25); // 10 + 15
    expect(result[0].sources).toEqual(['dexscreener', 'jupiter']);
  });

  test('should calculate weighted average price', () => {
    const tokens: Token[] = [
      {
        token_address: 'DEF456',
        token_name: 'Token B',
        token_ticker: 'TKB',
        price_sol: 1.0,
        market_cap_sol: 1000,
        volume_sol: 100,
        liquidity_sol: 100,
        transaction_count: 10,
        volume_1h: 0,
        volume_24h: 0,
        volume_7d: 0,
        price_24h_change: 0,
        price_7d_change: 0,
        price_1hr_change: 0,
        protocol: 'dex1',
        sources: ['dexscreener'],
        last_updated: '2024-01-01T00:00:00Z',
      },
      {
        token_address: 'DEF456',
        token_name: 'Token B',
        token_ticker: 'TKB',
        price_sol: 2.0,
        market_cap_sol: 2000,
        volume_sol: 200,
        liquidity_sol: 100,
        transaction_count: 20,
        volume_1h: 0,
        volume_24h: 0,
        volume_7d: 0,
        price_24h_change: 0,
        price_7d_change: 0,
        price_1hr_change: 0,
        protocol: 'dex2',
        sources: ['jupiter'],
        last_updated: '2024-01-01T00:00:00Z',
      },
    ];

    const result = tokenMerger.merge(tokens);

    expect(result[0].price_sol).toBe(1.5); 
  });

  test('should prefer data from most liquid source', () => {
    const tokens: Token[] = [
      {
        token_address: 'GHI789',
        token_name: 'Low Liquidity',
        token_ticker: 'LOW',
        price_sol: 1.0,
        market_cap_sol: 1000,
        volume_sol: 100,
        liquidity_sol: 50,
        transaction_count: 10,
        volume_1h: 0,
        volume_24h: 0,
        volume_7d: 0,
        price_24h_change: 0,
        price_7d_change: 0,
        price_1hr_change: 2,
        protocol: 'dex1',
        sources: ['dexscreener'],
        last_updated: '2024-01-01T00:00:00Z',
      },
      {
        token_address: 'GHI789',
        token_name: 'High Liquidity',
        token_ticker: 'HIGH',
        price_sol: 2.0,
        market_cap_sol: 2000,
        volume_sol: 200,
        liquidity_sol: 200,
        transaction_count: 20,
        volume_1h: 0,
        volume_24h: 0,
        volume_7d: 0,
        price_24h_change: 0,
        price_7d_change: 0,
        price_1hr_change: 5,
        protocol: 'dex2',
        sources: ['jupiter'],
        last_updated: '2024-01-01T01:00:00Z',
      },
    ];

    const result = tokenMerger.merge(tokens);

    expect(result[0].token_name).toBe('High Liquidity');
    expect(result[0].token_ticker).toBe('HIGH');
    expect(result[0].price_1hr_change).toBe(5); 
  });

  test('should handle single token without merging', () => {
    const tokens: Token[] = [
      {
        token_address: 'SINGLE123',
        token_name: 'Single Token',
        token_ticker: 'SNG',
        price_sol: 1.0,
        market_cap_sol: 1000,
        volume_sol: 100,
        liquidity_sol: 50,
        transaction_count: 10,
        volume_1h: 0,
        volume_24h: 0,
        volume_7d: 0,
        price_24h_change: 0,
        price_7d_change: 0,
        price_1hr_change: 0,
        protocol: 'dex1',
        sources: ['dexscreener'],
        last_updated: '2024-01-01T00:00:00Z',
      },
    ];

    const result = tokenMerger.merge(tokens);

    expect(result.length).toBe(1);
    expect(result[0]).toEqual(tokens[0]);
  });

  test('should merge protocols from multiple sources', () => {
    const tokens: Token[] = [
      {
        token_address: 'MULTI123',
        token_name: 'Multi Protocol',
        token_ticker: 'MUL',
        price_sol: 1.0,
        market_cap_sol: 1000,
        volume_sol: 100,
        liquidity_sol: 50,
        transaction_count: 10,
        volume_1h: 0,
        volume_24h: 0,
        volume_7d: 0,
        price_24h_change: 0,
        price_7d_change: 0,
        price_1hr_change: 0,
        protocol: 'raydium',
        sources: ['dexscreener'],
        last_updated: '2024-01-01T00:00:00Z',
      },
      {
        token_address: 'MULTI123',
        token_name: 'Multi Protocol',
        token_ticker: 'MUL',
        price_sol: 1.5,
        market_cap_sol: 1500,
        volume_sol: 150,
        liquidity_sol: 75,
        transaction_count: 15,
        volume_1h: 0,
        volume_24h: 0,
        volume_7d: 0,
        price_24h_change: 0,
        price_7d_change: 0,
        price_1hr_change: 0,
        protocol: 'orca',
        sources: ['jupiter'],
        last_updated: '2024-01-01T00:00:00Z',
      },
    ];

    const result = tokenMerger.merge(tokens);

    expect(Array.isArray(result[0].protocol)).toBe(true);
    expect(result[0].protocol).toContain('raydium');
    expect(result[0].protocol).toContain('orca');
  });
});
