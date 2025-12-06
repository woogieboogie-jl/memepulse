'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { TrendingUp, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react'
import { useTheme } from 'next-themes'

interface AgentData {
  id: string
  name: string
  color: string
  currentValue: number
  sharpeRatio: number
  winRate: number
  address?: string
  feedSymbol?: string
}

interface ChartPoint {
  date: string
  timestamp: number
  [key: string]: number | string
}

interface PerformanceData {
  agent: string
  feedSymbol: string
  name: string
  currentValue: number
  totalPnl: number
  pnlPercent: number
  tradeCount: number
  winRate: number
  mTokensEarned: number
  dataPoints: Array<{
    timestamp: number
    accountValue: number
    pnl: number
  }>
}

// Color palette for agents by feed symbol
const feedColors: Record<string, string> = {
  'DOGE': '#c9a227',   // Gold/Yellow for DOGE
  'PEPE': '#3cb371',   // Green for PEPE  
  'SHIB': '#f97316',   // Orange for SHIB
  'FLOKI': '#3b82f6',  // Blue for FLOKI
  'WIF': '#f97316',    // Orange for WIF
  'BONK': '#6b7280',   // Gray for BONK
  'BTC': '#a855f7',    // Purple for BTC
}

// Generate demo data for showcase (when no real data)
const generateDemoData = (): { agents: AgentData[], chartData: ChartPoint[] } => {
  const demoAgents: AgentData[] = [
    { id: 'demo-doge', name: 'DOGE Pulse', color: feedColors['DOGE'], currentValue: 12500, sharpeRatio: 1.8, winRate: 62 },
    { id: 'demo-floki', name: 'FLOKI Pulse', color: feedColors['FLOKI'], currentValue: 11200, sharpeRatio: 1.5, winRate: 58 },
    { id: 'demo-wif', name: 'WIF Pulse', color: feedColors['WIF'], currentValue: 14300, sharpeRatio: 2.1, winRate: 68 },
    { id: 'demo-bonk', name: 'BONK Pulse', color: feedColors['BONK'], currentValue: 9800, sharpeRatio: 1.2, winRate: 52 },
    { id: 'demo-btc', name: 'BTC Pulse (KOL)', color: feedColors['BTC'], currentValue: 13100, sharpeRatio: 1.9, winRate: 65 },
  ]

  const data: ChartPoint[] = []
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 20) // 20 days ago
  const points = 150

  for (let i = 0; i < points; i++) {
    const date = new Date(startDate)
    date.setHours(date.getHours() + i * 3)

    const point: ChartPoint = {
      date: date.toISOString(),
      timestamp: date.getTime(),
    }

    demoAgents.forEach((agent, agentIndex) => {
      const baseValue = 10000
      const trend = agentIndex === 2 ? 0.25 : agentIndex === 0 ? 0.15 : agentIndex === 3 ? -0.02 : (agentIndex - 2) * 0.08
      const volatility = 0.015 + agentIndex * 0.003
      const randomWalk = Math.sin(i * 0.1 + agentIndex) * volatility + (Math.random() - 0.5) * volatility

      if (i === 0) {
        point[agent.id] = baseValue
      } else {
        const prevValue = data[i - 1][agent.id] as number
        point[agent.id] = Math.max(prevValue * (1 + trend / points + randomWalk), baseValue * 0.5)
      }
    })

    data.push(point)
  }

  return { agents: demoAgents, chartData: data }
}

// Transform API response to chart format
const transformPerformanceData = (performances: PerformanceData[]): { agents: AgentData[], chartData: ChartPoint[] } => {
  if (!performances || performances.length === 0) {
    return { agents: [], chartData: [] }
  }

  const agents: AgentData[] = performances.map((perf, idx) => ({
    id: perf.agent,
    name: perf.name || `${perf.feedSymbol} Agent #${idx + 1}`,
    color: feedColors[perf.feedSymbol] || `hsl(${idx * 60}, 70%, 50%)`,
    currentValue: perf.currentValue,
    sharpeRatio: 0, // Could be calculated from returns
    winRate: perf.winRate,
    address: perf.agent,
    feedSymbol: perf.feedSymbol,
  }))

  // Collect all timestamps and create unified chart data
  const allTimestamps = new Set<number>()
  performances.forEach(perf => {
    perf.dataPoints.forEach(dp => allTimestamps.add(dp.timestamp))
  })

  const sortedTimestamps = [...allTimestamps].sort((a, b) => a - b)

  const chartData: ChartPoint[] = sortedTimestamps.map(timestamp => {
    const point: ChartPoint = {
      date: new Date(timestamp * 1000).toISOString(),
      timestamp: timestamp * 1000,
    }

    performances.forEach(perf => {
      const dataPoint = perf.dataPoints.find(dp => dp.timestamp === timestamp)
      if (dataPoint) {
        point[perf.agent] = dataPoint.accountValue
      }
    })

    return point
  })

  return { agents, chartData }
}

interface CustomTooltipProps {
  active?: boolean
  payload?: any
  label?: string | number
  agents: AgentData[]
}

const CustomTooltip = ({ active, payload, agents }: CustomTooltipProps) => {
  const router = useRouter()

  if (!active || !payload || payload.length === 0) return null

  const agent = agents.find(a => a.id === payload[0].dataKey)
  if (!agent) return null

  const isDemo = agent.id.startsWith('demo-')

  return (
    <Card className="border-2 shadow-xl" style={{ borderColor: agent.color }}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: agent.color }}
          />
          <p className="font-semibold text-lg">{agent.name}</p>
          {isDemo && (
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">DEMO</span>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between gap-6">
            <span className="text-sm text-muted-foreground">Account Value:</span>
            <span className="font-bold text-accent">${payload[0].value.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-sm text-muted-foreground">Win Rate:</span>
            <span className="font-semibold">{agent.winRate ?? 0}%</span>
          </div>
        </div>

        {!isDemo && agent.address && (
          <Button
            size="sm"
            className="w-full"
            onClick={() => router.push(`/agent/${agent.feedSymbol}-${agent.address}-0`)}
          >
            View Details
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export function AgentComparisonChart() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [timeframe, setTimeframe] = useState<'all' | '72h'>('all')
  const [displayMode, setDisplayMode] = useState<'dollar' | 'percent'>('dollar')
  
  // Real data state
  const [realAgents, setRealAgents] = useState<AgentData[]>([])
  const [realChartData, setRealChartData] = useState<ChartPoint[]>([])
  const [hasRealData, setHasRealData] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showDemo, setShowDemo] = useState(true)

  // Demo data (fallback)
  const demoData = useMemo(() => generateDemoData(), [])

  // Fetch real performance data
  const fetchPerformanceData = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/performance?range=' + (timeframe === '72h' ? '72h' : 'all'))
      const data = await res.json()
      
      if (data.hasData && data.performances?.length > 0) {
        const { agents, chartData } = transformPerformanceData(data.performances)
        setRealAgents(agents)
        setRealChartData(chartData)
        setHasRealData(true)
        setShowDemo(false)
      } else {
        setHasRealData(false)
      }
    } catch (error) {
      console.error('Failed to fetch performance data:', error)
      setHasRealData(false)
    } finally {
      setIsLoading(false)
    }
  }, [timeframe])

  useEffect(() => {
    setMounted(true)
    fetchPerformanceData()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPerformanceData, 30000)
    return () => clearInterval(interval)
  }, [fetchPerformanceData])

  // Use real data if available, otherwise demo
  const agents = showDemo ? demoData.agents : realAgents
  const chartData = showDemo ? demoData.chartData : realChartData

  const filteredData = timeframe === '72h'
    ? chartData.slice(-24)
    : chartData

  // Theme-aware colors
  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-6 flex flex-col flex-1">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold">Agent Performance Comparison</h2>
              {showDemo && !hasRealData && (
                <span className="text-[10px] bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full font-medium">
                  DEMO DATA
                </span>
              )}
              {hasRealData && !showDemo && (
                <span className="text-[10px] bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                  LIVE
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {showDemo 
                ? 'Showing demo data. Real P&L will appear once agents start trading.'
                : 'Compare total account value across all marketplace agents'
              }
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {/* Toggle Demo/Real */}
            {hasRealData && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDemo(!showDemo)}
                className="h-7 px-2 text-xs"
              >
                {showDemo ? 'Show Live' : 'Show Demo'}
              </Button>
            )}
            
            {/* Refresh button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchPerformanceData}
              disabled={isLoading}
              className="h-7 w-7 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>

            <div className="flex gap-1 border rounded-md p-1">
              <Button
                variant={displayMode === 'dollar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDisplayMode('dollar')}
                className="h-7 px-3"
              >
                $
              </Button>
              <Button
                variant={displayMode === 'percent' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDisplayMode('percent')}
                className="h-7 px-3"
              >
                %
              </Button>
            </div>
            <div className="flex gap-1 border rounded-md p-1">
              <Button
                variant={timeframe === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeframe('all')}
                className="h-7 px-3"
              >
                ALL
              </Button>
              <Button
                variant={timeframe === '72h' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeframe('72h')}
                className="h-7 px-3"
              >
                72H
              </Button>
            </div>
          </div>
        </div>

        {/* Empty state when no data and not showing demo */}
        {!showDemo && !hasRealData && !isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Trading Data Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Performance data will appear once agents start executing trades.
              The chart will update automatically.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setShowDemo(true)}
            >
              Show Demo Data
            </Button>
          </div>
        )}

        {/* Chart */}
        {(showDemo || hasRealData) && (
          <div className="flex-1 w-full min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(timestamp) => {
                    const date = new Date(timestamp)
                    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                  }}
                  stroke="hsl(var(--border))"
                  tick={{
                    fill: isDark ? '#9ca3af' : '#6b7280',
                    fontSize: 12
                  }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  stroke="hsl(var(--border))"
                  tick={{
                    fill: isDark ? '#9ca3af' : '#6b7280',
                    fontSize: 12
                  }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip content={(props) => <CustomTooltip {...props} agents={agents} />} />
                <Legend
                  content={(props) => {
                    const { payload } = props
                    if (!payload || payload.length === 0) return null

                    return (
                      <div className="flex flex-wrap justify-center gap-4 pt-5">
                        {payload.map((entry: any, index: number) => {
                          const agent = agents.find(a => a.id === entry.dataKey)
                          return (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <div
                                className="h-0.5 w-6"
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-xs text-gray-900 dark:text-gray-100">
                                {agent ? agent.name : entry.dataKey}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )
                  }}
                />

                {agents.map((agent) => (
                  <Line
                    key={agent.id}
                    type="monotone"
                    dataKey={agent.id}
                    stroke={agent.color}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: isDark ? '#1f2937' : 'white' }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
