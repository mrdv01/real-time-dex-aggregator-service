# Real-Time DEX Aggregator

A production-ready real-time meme coin data aggregation service that fetches data from multiple DEX APIs (DexScreener, Jupiter, GeckoTerminal), implements intelligent Redis caching, provides WebSocket updates, and offers filtering/sorting capabilities.

## Features

- **Multi-DEX Integration**: Fetches data from DexScreener, Jupiter, and GeckoTerminal APIs in parallel
- **Intelligent Caching**: Redis-backed cache with 30s TTL for optimal performance
- **Rate Limiting**: Token bucket algorithm with exponential backoff (1s → 32s)
- **Token Deduplication**: Merges duplicate tokens by address with weighted price calculation
- **Real-Time Updates**: WebSocket support for live price changes and volume spikes
- **REST API**: Comprehensive endpoints with filtering, sorting, and pagination
- **Type-Safe**: Full TypeScript implementation with strict typing
- **Well-Tested**:code coverage with unit and integration tests

## Prerequisites

- Node.js 18+ and npm
- Redis 7+ (via Docker or local installation)
- Jupiter API key

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd real-time-dex-aggregator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start Redis**
   ```bash
   docker-compose up -d
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

The server will start at `http://localhost:3000`.

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `3000` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `CACHE_TTL` | Cache time-to-live in seconds | `30` |
| `JUPITER_API_KEY` | Jupiter API key | - |
| `WS_UPDATE_INTERVAL` | WebSocket update interval (ms) | `10000` |
| `WS_PRICE_CHANGE_THRESHOLD` | Price change threshold for notifications (%) | `5` |

See [`.env.example`](.env.example) for complete list.

## 📡 API Endpoints

### GET /api/tokens

Fetch paginated list of tokens with optional filtering and sorting.

**Query Parameters**:
- `period`: `1h`, `24h`, `7d` (default: `24h`)
- `sortBy`: `volume`, `price_change`, `market_cap` (default: `volume`)
- `order`: `asc`, `desc` (default: `desc`)
- `limit`: Number of tokens (default: 20, max: 50)
- `cursor`: Pagination cursor

**Example**:
```bash
GET http://localhost:3000/api/tokens?period=24h&sortBy=volume&limit=20
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "token_address": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "token_name": "USD Coin",
      "token_ticker": "USDC",
      "price_sol": 0.00234,
      "market_cap_sol": 1500000,
      "volume_sol": 50000,
      "liquidity_sol": 25000,
      "transaction_count": 1250,
      "price_1hr_change": 2.5,
      "protocol": ["raydium", "orca"],
      "sources": ["dexscreener", "jupiter"],
      "last_updated": "2024-01-09T10:00:00Z"
    }
  ],
  "pagination": {
    "nextCursor": "20",
    "hasMore": true,
    "total": 150,
    "limit": 20
  },
  "metadata": {
    "cached": true,
    "sources": ["dexscreener", "jupiter", "geckoterminal"],
    "responseTime": "42ms"
  }
}
```

### GET /api/tokens/:address

Fetch details for a specific token by address.

**Example**:
```bash
GET http://localhost:3000/api/tokens/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

### GET /api/health

Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "redis": "connected",
  "uptime": 3600,
  "memory": {
    "used": 124,
    "total": 512
  }
}
```

### GET /api/stats

API usage statistics.

**Response**:
```json
{
  "success": true,
  "data": {
    "totalRequests": 1523,
    "cacheHitRate": 0.85,
    "averageResponseTime": 42,
    "activeWebSocketConnections": 12
  }
}
```

## 🔌 WebSocket Events

Connect to WebSocket at `ws://localhost:3000`.

### Events to Listen

- **`token:update`**: Emitted when token price changes >5%
  ```javascript
  {
    "type": "token:update",
    "data": { /* token data */ },
    "metadata": {
      "change": 7.5,
      "direction": "up"
    }
  }
  ```

- **`token:volume_spike`**: Emitted when volume >2x average
  ```javascript
  {
    "type": "token:volume_spike",
    "data": { /* token data */ },
    "metadata": {
      "change": 150
    }
  }
  ```

- **`token:new`**: Emitted for newly discovered tokens

### Events to Emit

- **`subscribe`**: Subscribe to token updates
  ```javascript
  socket.emit('subscribe', { period: '24h', sortBy: 'volume' });
  ```

- **`unsubscribe`**: Unsubscribe from updates
  ```javascript
  socket.emit('unsubscribe', { period: '24h' });
  ```

## WebSocket Demo

Open `demo/websocket-client.html` in your browser to see real-time updates in action.

Features:
- Live token price updates
- Animated price change indicators
- Volume spike notifications
- Multi-tab synchronization

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Generate coverage report
npm test -- --coverage
```



## Architecture

```
┌─────────────────┐
│   API Gateway   │  (Express + Socket.io)
└────────┬────────┘
         │
    ┌────┴────┐
    │ Aggregator Service │
    └────┬────┘
         │
    ┌────┴──────────────────┐
    │  DEX Services (3x)    │
    │  - DexScreener        │
    │  - Jupiter            │
    │  - GeckoTerminal      │
    └────┬──────────────────┘
         │
    ┌────┴────┐
    │  Rate    │
    │ Limiter  │
    └──────────┘

┌──────────────┐        ┌────────────┐
│ Redis Cache  │◄───────┤ Background │
│  (30s TTL)   │        │    Jobs    │
└──────────────┘        └────────────┘
```

### Key Components

1. **Aggregator Service**: Fetches from all DEX APIs in parallel using `Promise.allSettled`, merges duplicates, applies filters
2. **Rate Limiter**: Redis-backed token bucket with exponential backoff
3. **Token Merger**: Deduplicates by address, calculates weighted average prices
4. **Cache Service**: Cache-aside pattern with configurable TTL
5. **WebSocket Service**: Real-time updates every 10 seconds

## Performance

- **API Response Time**:
  - First request (cache miss): ~200-250ms
  - Cached requests: <50ms
  - Cache hit rate: >80% after warm-up

- **Rate Limiting**:
  - DexScreener: 300 req/min
  - Jupiter: 100 req/min
  - GeckoTerminal: 30 req/min

- **WebSocket**:
  - Update interval: 10 seconds
  - Latency: <100ms

## 🚀 Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload

# Production
npm run build            # Compile TypeScript
npm start                # Run compiled code

# Code Quality
npm run type-check       # TypeScript type checking
npm run lint             # ESLint
npm run lint:fix         # Auto-fix linting issues

# Testing
npm test                 # Run tests with coverage
npm run test:watch       # Watch mode
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
```

## 📁 Project Structure

```
real-time-dex-aggregator/
├── src/
│   ├── config/              # Configuration files
│   │   ├── index.ts         # Main config
│   │   ├── redis.ts         # Redis connection
│   │   └── constants.ts     # Constants
│   ├── services/
│   │   ├── dex/             # DEX API integrations
│   │   │   ├── base-dex.service.ts
│   │   │   ├── dexscreener.service.ts
│   │   │   ├── jupiter.service.ts
│   │   │   └── geckoterminal.service.ts
│   │   ├── aggregator.service.ts
│   │   ├── cache.service.ts
│   │   └── websocket.service.ts
│   ├── utils/              # Utility functions
│   │   ├── rateLimiter.ts
│   │   ├── tokenMerger.ts
│   │   └── dataTransformer.ts
│   ├── routes/             # API routes
│   │   └── tokens.routes.ts
│   ├── middleware/         # Express middleware
│   │   ├── errorHandler.ts
│   │   ├── validator.ts
│   │   └── cors.ts
│   ├── types/              # TypeScript types
│   │   └── index.ts
│   ├── jobs/               # Background jobs
│   │   └── dataRefresh.job.ts
│   ├── tests/              # Test files
│   │   ├── unit/
│   │   └── integration/
│   ├── app.ts              # Express app
│   └── server.ts           # Entry point
├── demo/                   # Demo assets
│   ├── websocket-client.html
│   └── demo-script.md
├── package.json
├── tsconfig.json
├── README.md

```

## 🔍 Troubleshooting


### Rate Limit Errors

The system implements automatic retry with exponential backoff. If you consistently hit rate limits:
- Reduce `WS_UPDATE_INTERVAL`
- Increase cache TTL
- Check API key validity

### Memory Issues

```bash
# Monitor memory usage
GET http://localhost:3000/api/health

# Clear Redis cache
npx ts-node scripts/clear-cache.ts
```


**Built with** ❤️ **using TypeScript, Express, Socket.io, and Redis**
