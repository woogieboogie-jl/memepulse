import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

/**
 * Agent Performance API
 * Reads from Vercel KV (or memory fallback) and aggregates for chart.
 */

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

interface PerformancePoint {
  timestamp: number
  accountValue: number
  pnl: number
}

interface AgentPerformance {
  agent: string
  feedSymbol: string
  name: string
  currentValue: number
  totalPnl: number
  pnlPercent: number
  tradeCount: number
  winRate: number
  mTokensEarned: number
  dataPoints: PerformancePoint[]
}

const isKVConfigured = () => {
  return process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const agentFilter = searchParams.get('agent')?.toLowerCase()
  const feedFilter = searchParams.get('feedSymbol')?.toUpperCase()
  const timeRange = searchParams.get('range') || '7d'

  try {
    // Fetch trades
    let trades: TradeRecord[] = []

    if (isKVConfigured()) {
      const raw = await kv.lrange('trades', 0, 4999) // Last 5000 trades
      trades = raw.map((item: any) => typeof item === 'string' ? JSON.parse(item) : item)
    } else {
      // Fetch from our own API (will use local memory)
      const tradesRes = await fetch(new URL('/api/trades?limit=5000', req.url).toString())
      const data = await tradesRes.json()
      trades = data.trades || []
    }

    if (trades.length === 0) {
      return NextResponse.json({
        performances: [],
        message: 'No trading data yet. Performance will appear once agents start trading.',
        hasData: false
      })
    }

    // Group trades by agent
    const agentTrades: Map<string, TradeRecord[]> = new Map()
    
    for (const trade of trades) {
      const key = trade.agent
      if (!agentTrades.has(key)) {
        agentTrades.set(key, [])
      }
      agentTrades.get(key)!.push(trade)
    }

    // Build performance data
    const performances: AgentPerformance[] = []
    const cutoff = getCutoffTimestamp(timeRange)

    for (const [agent, agentTradeList] of agentTrades) {
      if (agentFilter && agent !== agentFilter) continue

      // Get primary feed
      const feedCounts: Map<string, number> = new Map()
      for (const t of agentTradeList) {
        feedCounts.set(t.feedSymbol, (feedCounts.get(t.feedSymbol) || 0) + 1)
      }
      const primaryFeed = [...feedCounts.entries()]
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'UNKNOWN'

      if (feedFilter && primaryFeed !== feedFilter) continue

      // Filter by time and sort
      const filteredTrades = agentTradeList
        .filter(t => t.timestamp >= cutoff)
        .sort((a, b) => a.timestamp - b.timestamp)

      if (filteredTrades.length === 0) continue

      // Calculate performance
      let accountValue = 10000
      let totalPnl = 0
      let wins = 0
      const dataPoints: PerformancePoint[] = []

      // Add starting point
      dataPoints.push({
        timestamp: filteredTrades[0].timestamp - 3600,
        accountValue: 10000,
        pnl: 0
      })

      for (const trade of filteredTrades) {
        totalPnl += trade.pnlUsd
        accountValue += trade.pnlUsd
        if (trade.pnlUsd > 0) wins++

        dataPoints.push({
          timestamp: trade.timestamp,
          accountValue: Math.max(accountValue, 0),
          pnl: trade.pnlUsd
        })
      }

      performances.push({
        agent,
        feedSymbol: primaryFeed,
        name: `${primaryFeed} Agent`,
        currentValue: accountValue,
        totalPnl,
        pnlPercent: ((accountValue - 10000) / 10000) * 100,
        tradeCount: filteredTrades.length,
        winRate: filteredTrades.length > 0 ? (wins / filteredTrades.length) * 100 : 0,
        mTokensEarned: 0,
        dataPoints
      })
    }

    // Sort by P&L
    performances.sort((a, b) => b.totalPnl - a.totalPnl)

    return NextResponse.json({
      performances: performances.slice(0, 10), // Top 10
      hasData: performances.length > 0,
      totalAgents: performances.length,
      storage: isKVConfigured() ? 'kv' : 'memory'
    })

  } catch (error) {
    console.error('[Performance API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance', details: (error as Error).message },
      { status: 500 }
    )
  }
}

function getCutoffTimestamp(range: string): number {
  const now = Math.floor(Date.now() / 1000)
  switch (range) {
    case '24h': return now - 24 * 3600
    case '72h': return now - 72 * 3600
    case '7d': return now - 7 * 24 * 3600
    case '30d': return now - 30 * 24 * 3600
    default: return 0
  }
}
