import { NextResponse } from 'next/server'

/**
 * Agent Performance API
 * 
 * Returns performance data for the Agent Performance Comparison chart.
 * Combines:
 * - Trade P&L data (from /api/trades)
 * - On-chain oracle metrics (when available)
 * 
 * GET /api/performance?agent=0x...
 * GET /api/performance?feedSymbol=DOGE
 * GET /api/performance (all agents)
 */

// Shared store reference (in production, this would be a database)
// For hackathon, we import from a shared module or reconstruct from trades
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

// GET /api/performance
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const agentFilter = searchParams.get('agent')?.toLowerCase()
  const feedFilter = searchParams.get('feedSymbol')?.toUpperCase()
  const timeRange = searchParams.get('range') || '7d' // 24h, 72h, 7d, 30d, all

  try {
    // Fetch trades from our trades API (internal call)
    const tradesRes = await fetch(new URL('/api/trades', req.url).toString())
    const { trades } = await tradesRes.json()

    // Group trades by agent
    const agentTrades: Map<string, typeof trades> = new Map()
    
    for (const trade of trades) {
      const key = trade.agent
      if (!agentTrades.has(key)) {
        agentTrades.set(key, [])
      }
      agentTrades.get(key)!.push(trade)
    }

    // Build performance data for each agent
    const performances: AgentPerformance[] = []

    for (const [agent, agentTradeList] of agentTrades) {
      // Filter by agent if specified
      if (agentFilter && agent !== agentFilter) continue

      // Get the primary feed for this agent (most traded)
      const feedCounts: Map<string, number> = new Map()
      for (const t of agentTradeList) {
        feedCounts.set(t.feedSymbol, (feedCounts.get(t.feedSymbol) || 0) + 1)
      }
      const primaryFeed = [...feedCounts.entries()]
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'UNKNOWN'

      // Filter by feed if specified
      if (feedFilter && primaryFeed !== feedFilter) continue

      // Calculate performance metrics
      const sortedTrades = agentTradeList.sort((a: any, b: any) => a.timestamp - b.timestamp)
      
      let accountValue = 10000 // Starting capital
      let totalPnl = 0
      let wins = 0
      const dataPoints: PerformancePoint[] = []

      // Add starting point
      if (sortedTrades.length > 0) {
        dataPoints.push({
          timestamp: sortedTrades[0].timestamp - 86400, // Day before first trade
          accountValue: 10000,
          pnl: 0
        })
      }

      for (const trade of sortedTrades) {
        totalPnl += trade.pnlUsd
        accountValue += trade.pnlUsd
        if (trade.pnlUsd > 0) wins++

        dataPoints.push({
          timestamp: trade.timestamp,
          accountValue,
          pnl: trade.pnlUsd
        })
      }

      const winRate = sortedTrades.length > 0 
        ? (wins / sortedTrades.length) * 100 
        : 0

      performances.push({
        agent,
        feedSymbol: primaryFeed,
        name: `${primaryFeed} Agent #${performances.length + 1}`,
        currentValue: accountValue,
        totalPnl,
        pnlPercent: ((accountValue - 10000) / 10000) * 100,
        tradeCount: sortedTrades.length,
        winRate,
        mTokensEarned: 0, // TODO: Fetch from MTokenDistributor
        dataPoints: filterByTimeRange(dataPoints, timeRange)
      })
    }

    // If no real data, return placeholder structure
    if (performances.length === 0) {
      return NextResponse.json({
        performances: [],
        message: 'No trading data yet. Performance will appear once agents start trading.',
        hasData: false
      })
    }

    return NextResponse.json({
      performances,
      hasData: true,
      totalAgents: performances.length
    })

  } catch (error) {
    console.error('[API] Performance fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance data', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// Helper: Filter data points by time range
function filterByTimeRange(points: PerformancePoint[], range: string): PerformancePoint[] {
  const now = Math.floor(Date.now() / 1000)
  let cutoff: number

  switch (range) {
    case '24h':
      cutoff = now - 24 * 60 * 60
      break
    case '72h':
      cutoff = now - 72 * 60 * 60
      break
    case '7d':
      cutoff = now - 7 * 24 * 60 * 60
      break
    case '30d':
      cutoff = now - 30 * 24 * 60 * 60
      break
    case 'all':
    default:
      return points
  }

  return points.filter(p => p.timestamp >= cutoff)
}

