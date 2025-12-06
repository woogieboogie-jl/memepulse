import { NextResponse } from 'next/server'
import { getRedis, isRedisConfigured } from '@/lib/redis'

/**
 * Trade Recording API with Redis Cloud Persistence
 * 
 * Uses Redis Cloud (via Vercel integration) for persistence.
 * Falls back to in-memory for local development without Redis.
 * 
 * Docs: https://redis.io/docs/latest/operate/rc/cloud-integrations/vercel/
 */

// In-memory fallback for local dev (when Redis not configured)
const localTradesStore: TradeRecord[] = []

interface TradeRecord {
  id: string
  agent: string
  feedSymbol: string
  price: number
  volume: number
  isLong: boolean
  leverage: number
  timestamp: number
  orderlyTxHash: string
  pnlUsd: number
  createdAt: string
}

// POST /api/trades - Record a new trade (requires API key)
export async function POST(req: Request) {
  // API Key validation
  const apiKey = req.headers.get('x-api-key')
  const expectedKey = process.env.TRADES_API_KEY
  
  if (!expectedKey) {
    console.warn('[Trade API] TRADES_API_KEY not configured - API is open')
  } else if (apiKey !== expectedKey) {
    return NextResponse.json(
      { error: 'Unauthorized - invalid or missing API key' },
      { status: 401 }
    )
  }

  try {
    const body = await req.json()
    
    const {
      agent,
      feedSymbol,
      price,
      volume,
      isLong = true,
      leverage = 1,
      timestamp = Math.floor(Date.now() / 1000),
      orderlyTxHash = '',
      pnlUsd = 0
    } = body

    if (!agent || !feedSymbol) {
      return NextResponse.json(
        { error: 'Missing required fields: agent, feedSymbol' },
        { status: 400 }
      )
    }

    // Convert from contract format
    const priceUsd = typeof price === 'number' 
      ? price / 1e8 
      : Number(BigInt(price)) / 1e8
    
    const volumeUsd = typeof volume === 'number'
      ? volume / 1e18
      : Number(BigInt(volume)) / 1e18

    const trade: TradeRecord = {
      id: `${agent.slice(0, 10)}-${timestamp}-${Math.random().toString(36).slice(2, 6)}`,
      agent: agent.toLowerCase(),
      feedSymbol: feedSymbol.toUpperCase(),
      price: priceUsd,
      volume: volumeUsd,
      isLong,
      leverage,
      timestamp,
      orderlyTxHash,
      pnlUsd: Number(pnlUsd),
      createdAt: new Date().toISOString()
    }

    // Try Redis first, fallback to local
    const redis = await getRedis()
    
    if (redis) {
      // Use Redis list - push to front, keep last 10,000
      await redis.lPush('trades', JSON.stringify(trade))
      await redis.lTrim('trades', 0, 9999)
      
      // Also index by agent for faster lookups
      const agentKey = `trades:${trade.agent}`
      await redis.lPush(agentKey, JSON.stringify(trade))
      await redis.lTrim(agentKey, 0, 999)
    } else {
      // Local fallback
      localTradesStore.unshift(trade)
      if (localTradesStore.length > 10000) localTradesStore.pop()
    }

    console.log(`[Trade] ${trade.feedSymbol} ${trade.isLong ? 'LONG' : 'SHORT'} by ${trade.agent.slice(0, 8)}... P&L: $${trade.pnlUsd}`)

    return NextResponse.json({ 
      success: true, 
      tradeId: trade.id,
      storage: redis ? 'redis' : 'memory'
    })

  } catch (error) {
    console.error('[Trade API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to record trade', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// GET /api/trades - Get trades
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const agent = searchParams.get('agent')?.toLowerCase()
  const feedSymbol = searchParams.get('feedSymbol')?.toUpperCase()
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)

  try {
    let trades: TradeRecord[] = []
    const redis = await getRedis()

    if (redis) {
      // Fetch from Redis
      const key = agent ? `trades:${agent}` : 'trades'
      const raw = await redis.lRange(key, 0, limit - 1)
      trades = raw.map((item: string) => JSON.parse(item))
    } else {
      // Local fallback
      trades = [...localTradesStore]
      if (agent) {
        trades = trades.filter(t => t.agent === agent)
      }
    }

    // Filter by feed if specified
    if (feedSymbol) {
      trades = trades.filter(t => t.feedSymbol === feedSymbol)
    }

    return NextResponse.json({
      trades: trades.slice(0, limit),
      total: trades.length,
      storage: redis ? 'redis' : 'memory'
    })

  } catch (error) {
    console.error('[Trade API] GET Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trades', details: (error as Error).message },
      { status: 500 }
    )
  }
}
