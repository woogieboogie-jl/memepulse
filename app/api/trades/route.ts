import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

/**
 * Trade Recording API with Vercel KV Persistence
 * 
 * Stores trades in Redis for persistence across deploys.
 * Falls back to in-memory for local development.
 */

// In-memory fallback for local dev (when KV not configured)
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

// Check if KV is configured
const isKVConfigured = () => {
  return process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
}

// POST /api/trades - Record a new trade
export async function POST(req: Request) {
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

    // Store in KV or fallback to local
    if (isKVConfigured()) {
      // Use Redis list - push to front, keep last 10,000
      await kv.lpush('trades', JSON.stringify(trade))
      await kv.ltrim('trades', 0, 9999) // Keep max 10K trades
      
      // Also index by agent for faster lookups
      await kv.lpush(`trades:${trade.agent}`, JSON.stringify(trade))
      await kv.ltrim(`trades:${trade.agent}`, 0, 999) // Keep last 1K per agent
    } else {
      // Local fallback
      localTradesStore.unshift(trade)
      if (localTradesStore.length > 10000) localTradesStore.pop()
    }

    console.log(`[Trade] ${trade.feedSymbol} ${trade.isLong ? 'LONG' : 'SHORT'} by ${trade.agent.slice(0, 8)}... P&L: $${trade.pnlUsd}`)

    return NextResponse.json({ 
      success: true, 
      tradeId: trade.id,
      storage: isKVConfigured() ? 'kv' : 'memory'
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

    if (isKVConfigured()) {
      // Fetch from KV
      const key = agent ? `trades:${agent}` : 'trades'
      const raw = await kv.lrange(key, 0, limit - 1)
      trades = raw.map((item: any) => typeof item === 'string' ? JSON.parse(item) : item)
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
      storage: isKVConfigured() ? 'kv' : 'memory'
    })

  } catch (error) {
    console.error('[Trade API] GET Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trades', details: (error as Error).message },
      { status: 500 }
    )
  }
}
