'use client'

import { useState, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { TrendingUp, ExternalLink } from 'lucide-react'
import { useTheme } from 'next-themes'
import { getPublicAgents } from '@/lib/agents-data'

interface AgentData {
  id: string
  name: string
  color: string
  currentValue: number
  sharpeRatio: number
  winRate: number
}

// Color palette for agents
const agentColors: Record<string, string> = {
  'kol-1': '#a855f7', // Purple for Ju Ki Young Tracker (KOL)
  '1': '#8b5cf6', // Purple for Whale Tracker
  '4': '#3b82f6', // Blue for Sentiment Scalper
  '5': '#f97316', // Orange for Breakout Hunter
  '6': '#1f2937', // Dark gray for Volume Rider
  '7': '#6366f1', // Indigo for Momentum Master
  '8': '#10b981', // Green for Grid Trader
}

interface ChartPoint {
  date: string
  timestamp: number
  [key: string]: number | string
}

// Generate mock historical data based on actual agents
const generateChartData = (agents: AgentData[]) => {
  const data: ChartPoint[] = []
  const startDate = new Date('2024-10-18')
  const points = 150

  for (let i = 0; i < points; i++) {
    const date = new Date(startDate)
    date.setHours(date.getHours() + i * 3)

    const point: ChartPoint = {
      date: date.toISOString(),
      timestamp: date.getTime(),
    }

    agents.forEach((agent, agentIndex) => {
      // Different volatility and trend for each agent
      const baseValue = 10000
      // KOL agent (Ju Ki Young) should show strong upward trend
      const trend = agent.id === 'kol-1' ? 0.25 : agentIndex === 1 ? 0.15 : agentIndex === 5 ? -0.35 : (agentIndex - 2) * 0.05
      const volatility = 0.02 + agentIndex * 0.005
      const randomWalk = Math.random() * volatility * 2 - volatility

      if (i === 0) {
        point[agent.id] = baseValue
      } else {
        const prevValue = data[i - 1][agent.id] as number
        point[agent.id] = prevValue * (1 + trend / points + randomWalk)
      }
    })

    data.push(point)
  }

  return data
}

interface CustomTooltipProps {
  active?: boolean
  payload?: any
  label?: string | number
  agents: AgentData[]
}

const CustomTooltip = ({ active, payload, label, agents }: CustomTooltipProps) => {
  const router = useRouter()

  if (!active || !payload || payload.length === 0) return null

  const agent = agents.find(a => a.id === payload[0].dataKey)
  if (!agent) return null

  return (
    <Card className="border-2 shadow-xl" style={{ borderColor: agent.color }}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: agent.color }}
          />
          <p className="font-semibold text-lg">{agent.name}</p>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between gap-6">
            <span className="text-sm text-muted-foreground">Account Value:</span>
            <span className="font-bold text-accent">${payload[0].value.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-sm text-muted-foreground">Sharpe Ratio:</span>
            <span className="font-semibold">{(agent.sharpeRatio ?? 0).toFixed(1)}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-sm text-muted-foreground">Win Rate:</span>
            <span className="font-semibold">{agent.winRate ?? 0}%</span>
          </div>
        </div>

        <Button
          size="sm"
          className="w-full"
          onClick={() => router.push(`/agent/${agent.id}`)}
        >
          View Details
          <ExternalLink className="ml-2 h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  )
}

export function AgentComparisonChart() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [timeframe, setTimeframe] = useState<'all' | '72h'>('all')
  const [displayMode, setDisplayMode] = useState<'dollar' | 'percent'>('dollar')

  useEffect(() => {
    setMounted(true)
  }, [])

  // Get agents from data source and map to chart format
  const agents = useMemo(() => {
    if (typeof window === 'undefined') return [] // Prevent SSR issues
    const publicAgents = getPublicAgents()
    return publicAgents.map(agent => ({
      id: agent.id,
      name: agent.name,
      color: agentColors[agent.id] || `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      currentValue: agent.funded + agent.pnl,
      sharpeRatio: agent.sharpeRatio ?? 0,
      winRate: agent.winRate ?? 0,
    }))
  }, [])

  // Generate chart data based on actual agents
  const chartData = useMemo(() => generateChartData(agents), [agents])

  const filteredData = timeframe === '72h'
    ? chartData.slice(-24)
    : chartData

  // Theme-aware colors for legend - use resolvedTheme to get actual theme (not 'system')
  const isDark = mounted && resolvedTheme === 'dark'
  const legendTextColor = isDark ? '#f3f4f6' : '#111827' // gray-100 / gray-900

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-6 flex flex-col flex-1">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1">Agent Performance Comparison</h2>
            <p className="text-xs text-muted-foreground">
              Compare total account value across all marketplace agents
            </p>
          </div>
          <div className="flex gap-2">
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
                  fill: isDark ? '#9ca3af' : '#6b7280', // gray-400 / gray-500
                  fontSize: 12
                }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                stroke="hsl(var(--border))"
                tick={{
                  fill: isDark ? '#9ca3af' : '#6b7280', // gray-400 / gray-500
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
                  activeDot={{ r: 6, strokeWidth: 2, stroke: (mounted && resolvedTheme === 'dark') ? '#1f2937' : 'white' }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
