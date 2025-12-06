# Trade API Integration Guide

Quick guide for recording agent trades for the performance dashboard.

## TL;DR - One Line to Add

After executing a trade on Orderly, add this ONE fetch call:

```typescript
await fetch('/api/trades', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agent: agentAddress,           // Same as submitUpdate
    feedSymbol: 'DOGE',            // Same as submitUpdate
    price: report.price,           // Same as submitUpdate (8 decimals)
    volume: report.volume.toString(), // Same as submitUpdate (18 decimals, as string)
    isLong: report.isLong,         // Same as submitUpdate
    leverage: report.leverage,     // Same as submitUpdate
    timestamp: report.timestamp,   // Same as submitUpdate
    orderlyTxHash: report.orderlyTxHash, // Same as submitUpdate
    pnlUsd: profitOrLoss           // NEW: Trade P&L in USD (e.g., 150.50 or -23.40)
  })
})
```

## Full Example

```typescript
// Your existing code for executing trade and submitting oracle update:

async function executeTradeAndReport(
  agent: Address,
  feedSymbol: string,
  tradeParams: TradeParams
) {
  // 1. Execute trade on Orderly (your existing code)
  const orderlyResult = await orderlyClient.executeTrade(tradeParams)
  
  // 2. Build the report (your existing code)
  const report = {
    price: BigInt(Math.floor(orderlyResult.executionPrice * 1e8)),
    volume: BigInt(Math.floor(orderlyResult.volume * 1e18)),
    isLong: tradeParams.side === 'buy',
    leverage: tradeParams.leverage,
    timestamp: BigInt(Math.floor(Date.now() / 1000)),
    orderlyTxHash: orderlyResult.txHash as `0x${string}`,
    agent: agent
  }

  // 3. NEW: Record trade for dashboard (ONE LINE)
  await fetch('/api/trades', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...report,
      price: Number(report.price),
      volume: report.volume.toString(),
      timestamp: Number(report.timestamp),
      feedSymbol,
      pnlUsd: orderlyResult.realizedPnl  // From Orderly response
    })
  })

  // 4. Submit to oracle (your existing code)
  await aggregator.submitUpdate(agent, feedSymbol, report)
}
```

## API Details

### POST /api/trades

Records a trade for performance tracking.

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| agent | string | Yes | Agent wallet address |
| feedSymbol | string | Yes | Memecoin symbol (DOGE, PEPE, etc.) |
| price | number | Yes | Execution price (8 decimals from oracle) |
| volume | string | Yes | Trade volume (18 decimals, as string for bigint) |
| isLong | boolean | No | True for long, false for short (default: true) |
| leverage | number | No | Leverage used (default: 1) |
| timestamp | number | No | Unix timestamp (default: now) |
| orderlyTxHash | string | No | Orderly transaction hash |
| pnlUsd | number | No | Profit/loss in USD (default: 0) |

**Response:**
```json
{
  "success": true,
  "tradeId": "0x123...-1733489000-abc123",
  "message": "Trade recorded successfully"
}
```

### GET /api/trades

Retrieves recorded trades.

**Query Parameters:**
- `agent` - Filter by agent address
- `feedSymbol` - Filter by memecoin
- `limit` - Max results (default: 100)

**Example:**
```
GET /api/trades?agent=0x95ed40013Cb3990013Af947a635D1A3E31057426&limit=50
```

### GET /api/performance

Returns performance data for the dashboard chart.

**Query Parameters:**
- `agent` - Filter by agent address
- `feedSymbol` - Filter by memecoin
- `range` - Time range: 24h, 72h, 7d, 30d, all (default: 7d)

**Response:**
```json
{
  "performances": [
    {
      "agent": "0x...",
      "feedSymbol": "DOGE",
      "name": "DOGE Agent #1",
      "currentValue": 12500,
      "totalPnl": 2500,
      "pnlPercent": 25,
      "tradeCount": 42,
      "winRate": 68.5,
      "mTokensEarned": 15000,
      "dataPoints": [
        { "timestamp": 1733400000, "accountValue": 10000, "pnl": 0 },
        { "timestamp": 1733486400, "accountValue": 10500, "pnl": 500 }
      ]
    }
  ],
  "hasData": true,
  "totalAgents": 1
}
```

## Notes

- The API uses **Redis Cloud** for persistence (via Vercel integration)
- Falls back to in-memory if `REDIS_URL` not configured
- Set `REDIS_URL` in `.env.local` for local dev with persistence
- Price conversion: Divide by 1e8 to get USD
- Volume conversion: Divide by 1e18 to get USD
- `pnlUsd` is the most important new field - it drives the performance chart

## Environment Setup

For persistence, add to `.env.local`:
```
REDIS_URL="redis://default:YOUR_PASSWORD@your-redis-host:PORT"
```

On Vercel, this is automatically configured via the Redis Cloud integration.
See: https://redis.io/docs/latest/operate/rc/cloud-integrations/vercel/

