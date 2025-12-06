import { NextResponse } from 'next/server'

/**
 * Trade Recording API
 * 
 * Compatible with the same data structure used in Aggregator.submitUpdate()
 * Colleague just needs to add ONE fetch call after executing trades.
 * 
 * Example usage:
 * ```typescript
 * // After trade execution, before or after submitUpdate:
 * await fetch('/api/trades', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     agent: '0x...',
 *     feedSymbol: 'DOGE',
 *     price: 8500000,        // 8 decimals (same as oracle)
 *     volume: '1000000000000000000000', // 18 decimals (string for bigint)
 *     isLong: true,
 *     leverage: 10,
 *     timestamp: 1733489000,
 *     orderlyTxHash: '0x...',
 *     pnlUsd: 150.50         // NEW: profit/loss in USD
 *   })
 * })
 * ```
 */

// In-memory store for hackathon (replace with Supabase in production)
// This persists across requests but resets on server restart
const tradesStore: TradeRecord[] = []
const snapshotsStore: Map<string, AgentSnapshot[]> = new Map()

interface TradeRecord {
  id: string
  agent: string
  feedSymbol: string
  price: number          // Converted to USD (from 8 decimals)
  volume: number         // Converted to USD (from 18 decimals)
  isLong: boolean
  leverage: number
  timestamp: number
  orderlyTxHash: string
  pnlUsd: number
  createdAt: Date
}

interface AgentSnapshot {
  timestamp: number
  accountValue: number
  cumulativePnl: number
  tradeCount: number
}

// POST /api/trades - Record a new trade
export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Validate required fields (same as submitUpdate report)
    const {
      agent,
      feedSymbol,
      price,
      volume,
      isLong = true,
      leverage = 1,
      timestamp = Math.floor(Date.now() / 1000),
      orderlyTxHash = '',
      pnlUsd = 0  // Optional - defaults to 0 if not provided
    } = body

    if (!agent || !feedSymbol) {
      return NextResponse.json(
        { error: 'Missing required fields: agent, feedSymbol' },
        { status: 400 }
      )
    }

    // Convert from contract format to human-readable
    // Price: 8 decimals → USD
    // Volume: 18 decimals → USD (passed as string for bigint safety)
    const priceUsd = typeof price === 'number' 
      ? price / 1e8 
      : Number(BigInt(price)) / 1e8
    
    const volumeUsd = typeof volume === 'number'
      ? volume / 1e18
      : Number(BigInt(volume)) / 1e18

    const trade: TradeRecord = {
      id: `${agent}-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
      agent: agent.toLowerCase(),
      feedSymbol: feedSymbol.toUpperCase(),
      price: priceUsd,
      volume: volumeUsd,
      isLong,
      leverage,
      timestamp,
      orderlyTxHash,
      pnlUsd: Number(pnlUsd),
      createdAt: new Date()
    }

    // Store the trade
    tradesStore.push(trade)

    // Update agent snapshot for performance chart
    updateAgentSnapshot(trade)

    console.log(`[API] Trade recorded: ${trade.feedSymbol} ${trade.isLong ? 'LONG' : 'SHORT'} by ${trade.agent.slice(0, 8)}... P&L: $${trade.pnlUsd}`)

    return NextResponse.json({ 
      success: true, 
      tradeId: trade.id,
      message: 'Trade recorded successfully'
    })

  } catch (error) {
    console.error('[API] Trade recording error:', error)
    return NextResponse.json(
      { error: 'Failed to record trade', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// GET /api/trades - Get trades for an agent or all trades
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const agent = searchParams.get('agent')?.toLowerCase()
  const feedSymbol = searchParams.get('feedSymbol')?.toUpperCase()
  const limit = parseInt(searchParams.get('limit') || '100')

  let filtered = [...tradesStore]

  if (agent) {
    filtered = filtered.filter(t => t.agent === agent)
  }
  if (feedSymbol) {
    filtered = filtered.filter(t => t.feedSymbol === feedSymbol)
  }

  // Sort by timestamp desc and limit
  filtered = filtered
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit)

  return NextResponse.json({
    trades: filtered,
    total: filtered.length
  })
}

// Helper: Update agent performance snapshot
function updateAgentSnapshot(trade: TradeRecord) {
  const agent = trade.agent
  
  if (!snapshotsStore.has(agent)) {
    snapshotsStore.set(agent, [])
  }
  
  const snapshots = snapshotsStore.get(agent)!
  const lastSnapshot = snapshots[snapshots.length - 1]
  
  // Calculate new cumulative values
  const prevPnl = lastSnapshot?.cumulativePnl || 0
  const prevValue = lastSnapshot?.accountValue || 10000 // Starting value
  const prevCount = lastSnapshot?.tradeCount || 0
  
  const newSnapshot: AgentSnapshot = {
    timestamp: trade.timestamp,
    accountValue: prevValue + trade.pnlUsd,
    cumulativePnl: prevPnl + trade.pnlUsd,
    tradeCount: prevCount + 1
  }
  
  snapshots.push(newSnapshot)
}

