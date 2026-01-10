import { DataTransformer } from '../../utils/dataTransformer';

describe('DataTransformer', () => {
  let dataTransformer: DataTransformer;

  beforeEach(() => {
    dataTransformer = new DataTransformer();
  });

  describe('normalizeDexScreener', () => {
    test('should normalize DexScreener response', () => {
      const dexData = {
        pairs: [
          {
            chainId: 'solana',
            baseToken: {
              address: 'TOKEN123',
              name: 'Test Token',
              symbol: 'TEST',
            },
            priceNative: '1.5',
            fdv: '1000000', // Changed from marketCap to fdv
            volume: { h24: '50000' },
            liquidity: { usd: '100000' },
            txns: {
              h24: {
                buys: 50,
                sells: 30,
              },
            },
            priceChange: { h1: '5.5' },
            dexId: 'raydium',
            info: {
              imageUrl: 'https://example.com/image.png',
              websites: ['https://example.com'],
            },
          },
        ],
      };

      const normalized = dataTransformer.normalizeDexScreener(dexData);

      expect(normalized).toHaveLength(1);
      expect(normalized[0]).toMatchObject({
        token_address: 'TOKEN123',
        token_name: 'Test Token',
        token_ticker: 'TEST',
        price_sol: 1.5,
        market_cap_sol: 1000000,
        volume_sol: 50000,
        liquidity_sol: 100000,
        transaction_count: 80,
        price_1hr_change: 5.5,
        protocol: 'raydium',
        sources: ['dexscreener'],
      });
    });

    test('should filter out non-Solana chains', () => {
      const dexData = {
        pairs: [
          {
            chainId: 'ethereum',
            baseToken: { address: 'ETH123', name: 'ETH Token', symbol: 'ETHTKN' },
            priceNative: '1.0',
            fdv: '1000',
            volume: { h24: '100' },
            liquidity: { usd: '500' },
            txns: { h24: { buys: 10, sells: 5 } },
            priceChange: { h1: '0' },
            dexId: 'uniswap',
          },
          {
            chainId: 'solana',
            baseToken: { address: 'SOL123', name: 'SOL Token', symbol: 'SOLTKN' },
            priceNative: '2.0',
            fdv: '2000',
            volume: { h24: '2000' },
            liquidity: { usd: '1000' },
            txns: { h24: { buys: 20, sells: 10 } },
            priceChange: { h1: '5' },
            dexId: 'raydium',
          },
        ],
      };

      const normalized = dataTransformer.normalizeDexScreener(dexData);

      expect(normalized).toHaveLength(1);
      expect(normalized[0].token_address).toBe('SOL123');
    });
  });

  describe('normalizeJupiter', () => {
    test('should normalize Jupiter response', () => {
      const jupiterData = [
        {
          id: 'JUP123', // address -> id
          name: 'Jupiter Token',
          symbol: 'JUP',
          usdPrice: '3.5', // price -> usdPrice
          mcap: '5000000', // market_cap -> mcap
          stats24h: {
             buyVolume: 50000,
             sellVolume: 50000,
             numBuys: 100,
             numSells: 50
          },
          liquidity: '200000',
          stats1h: {
              priceChange: '2.5'
          },
          logoURI: 'https://example.com/jup.png',
        },
      ];

      const normalized = dataTransformer.normalizeJupiter(jupiterData);

      expect(normalized).toHaveLength(1);
      expect(normalized[0]).toMatchObject({
        token_address: 'JUP123',
        token_name: 'Jupiter Token',
        token_ticker: 'JUP',
        price_sol: 3.5,
        market_cap_sol: 5000000,
        volume_sol: 100000,
        liquidity_sol: 200000,
        transaction_count: 150,
        price_1hr_change: 2.5,
        protocol: 'jupiter',
        sources: ['jupiter'],
      });
    });
  });

  describe('normalizeGeckoTerminal', () => {
    test('should normalize GeckoTerminal response', () => {
      const geckoData = {
        data: [
          {
            attributes: {
              name: 'Gecko Token / SOL',
              base_token_price_native_currency: '1.25',
              market_cap_usd: '750000',
              volume_usd: { h24: '25000' },
              reserve_in_usd: '50000',
              transactions: { h24: { buys: 40, sells: 35 } },
              price_change_percentage: { h1: '1.5' },
              updated_at: '2024-01-01T10:00:00Z',
            },
            relationships: {
                base_token: {
                    data: { id: 'solana_GECKO123' }
                },
                dex: {
                    data: { id: 'geckoterminal_dex' }
                }
            }
          },
        ],
      };

      // Gecko normalizer needs strict positive liquidity/volume test
      // Mock data has 50k liq, 25k volume, so it should pass.
      const normalized = dataTransformer.normalizeGeckoTerminal(geckoData);

      expect(normalized).toHaveLength(1);
      expect(normalized[0]).toMatchObject({
        token_address: 'GECKO123',
        token_name: 'Gecko Token',
        token_ticker: 'Gecko Token', // Logic splits name by /
        price_sol: 1.25,
        market_cap_sol: 750000,
        volume_sol: 25000,
        liquidity_sol: 50000,
        transaction_count: 75,
        price_1hr_change: 1.5,
        protocol: 'geckoterminal_dex',
        sources: ['geckoterminal'],
      });
    });
  });

  test('should return empty array for invalid data', () => {
    expect(dataTransformer.normalizeDexScreener(null)).toEqual([]);
    expect(dataTransformer.normalizeJupiter(null)).toEqual([]);
    expect(dataTransformer.normalizeGeckoTerminal(null)).toEqual([]);
  });
});
