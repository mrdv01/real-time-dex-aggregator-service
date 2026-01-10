# Real-Time DEX Aggregator Video Demo Script

## Recording Information
- **Duration**: 1-2 minutes
- **Tools**: Loom, OBS Studio, or QuickTime
- **Resolution**: 1920x1080
- **Upload**: YouTube (unlisted)

## Pre-Recording Checklist
- [ ] Redis running (`docker-compose up -d`)
- [ ] Dev server running (`npm run dev`)
- [ ] Postman collection loaded
- [ ] WebSocket demo client tested in browser
- [ ] Clear Redis cache (`redis-cli FLUSHALL`) for fresh demo
- [ ] Test suite passing (`npm test`)
- [ ] Architecture diagram ready to show

---

## Timeline

### 00:00 - 00:15: Introduction (15 seconds)

**What to Show**:
- Browser with `http://localhost:3000`
- Architecture diagram (optional)

**Script**:
> "This is a real-time DEX token aggregator that fetches meme coin data from DexScreener, Jupiter, and GeckoTerminal APIs. The system uses Redis caching, implements rate limiting with exponential backoff, and provides WebSocket updates for real-time price changes."

---

### 00:15 - 00:45: API Functionality (30 seconds)

**What to Show** (Postman/Thunder Client):

1. **Call 1**: `GET http://localhost:3000/api/tokens`
   - Point to: `responseTime: "245ms"`, `cached: false`

2. **Call 2**: `GET http://localhost:3000/api/tokens?period=1h&sortBy=volume`
   - Point to: `responseTime: "42ms"`, `cached: true`

3. **Call 3**: `GET http://localhost:3000/api/tokens?limit=10&cursor=xyz`
   - Show pagination fields

4. **Call 4**: `GET http://localhost:3000/api/tokens/[address]`
   - Show single token details

**Script**:
> "Notice the first call takes ~200ms as it fetches from APIs, but subsequent calls are <50ms because they're served from Redis cache with 30-second TTL."

---

### 00:45 - 01:10: WebSocket Demo (25 seconds)

**What to Show**:
- Open 2-3 browser tabs with `demo/websocket-client.html`
- Show live updates appearing simultaneously

**Script**:
> "All tabs are connected via WebSocket and receiving real-time updates. When a token's price changes by more than 5%, all connected clients get notified instantly. Notice how volume spikes trigger special alerts."

---

### 01:10 - 01:30: Performance Test (20 seconds)

**What to Show**:
- Postman Collection Runner (10 iterations)
- Terminal with Redis CLI:
  ```bash
  redis-cli KEYS tokens:*
  redis-cli TTL tokens:all:default
  ```

**Script**:
> "The first call fetches from all three DEX APIs in parallel, merges duplicates, and caches the result. Subsequent calls hit the Redis cache with 30-second TTL, giving us sub-50ms response times."

---

### 01:30 - 01:50: System Design (20 seconds)

**What to Show** (VS Code):
- `src/services/aggregator.service.ts` - Promise.allSettled()
- `src/utils/tokenMerger.ts` - Deduplication logic
- `src/utils/rateLimiter.ts` - Exponential backoff

**Script**:
> "The aggregator fetches from three APIs in parallel using Promise.allSettled, so if one API fails, we continue with the others. The token merger deduplicates by address and calculates weighted average prices. Rate limiting uses exponential backoff."

---

### 01:50 - 02:00: Conclusion (10 seconds)

**What to Show**:
- Terminal: `npm test` output with coverage

**Script**:
> "All 12 tests passing with 75% code coverage. The system handles rate limits, merges data from multiple sources, and provides real-time updates."

---

## Tips for Great Recording

1. **Audio**: Use a good microphone, speak clearly
2. **Visuals**: Zoom in on terminal/code for readability
3. **Pacing**: Don't rush, pause briefly between sections
4. **Highlights**: Use cursor to point to important parts
5. **Clean**: Close unnecessary browser tabs/applications
