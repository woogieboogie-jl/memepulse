'use client'

import { useMemo } from 'react'
import { useStatisticsDaily } from '@orderly.network/hooks'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Loader2 } from 'lucide-react'
import { useTheme } from 'next-themes'

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatPnl(value: number): string {
  const formatted = Math.abs(value).toFixed(2)
  return value >= 0 ? `+$${formatted}` : `-$${formatted}`
}

interface DailyPnlChartProps {
  unrealizedPnL: number
}

export function DailyPnlChart({ unrealizedPnL }: DailyPnlChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const dateRange = useMemo(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)

    const formatDateParam = (d: Date) => d.toISOString().split('T')[0]
    return {
      startDate: formatDateParam(start),
      endDate: formatDateParam(end),
    }
  }, [])

  const [data, meta] = useStatisticsDaily(
    {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    },
    { ignoreAggregation: true }
  )

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    // Sort by date ascending
    const sorted = [...data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Remove leading zeros
    let startIndex = 0
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].pnl !== 0) {
        startIndex = i
        break
      }
    }
    const trimmed = sorted.slice(startIndex)

    // Calculate cumulative PnL
    let cumulative = 0
    return trimmed.map((row) => {
      cumulative += row.pnl || 0
      return {
        date: row.date,
        dateFormatted: formatDate(row.date),
        pnl: row.pnl || 0,
        cumulativePnl: cumulative,
        accountValue: row.account_value,
      }
    })
  }, [data])

  const lastCumulativePnl = chartData.length > 0 ? chartData[chartData.length - 1].cumulativePnl : 0
  const isPositive = lastCumulativePnl >= 0

  const isLoading = !data && !meta

  // Theme-aware colors
  const tooltipStyle = {
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
    borderRadius: '8px',
    color: isDark ? '#f3f4f6' : '#111827',
  }

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          30-Day Performance
        </h2>
        <div className="flex justify-center items-center h-[200px]">
          <Loader2 className="animate-spin text-muted-foreground" size={32} />
        </div>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          30-Day Performance
        </h2>
        <div className="text-center text-muted-foreground py-8">
          No trading data available yet. Start trading to see your performance.
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          30-Day Performance
        </h2>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Cumulative P&L</p>
          <p
            className={`text-xl font-bold ${
              lastCumulativePnl >= 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {formatPnl(lastCumulativePnl)}
          </p>
        </div>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isPositive ? '#22c55e' : '#ef4444'}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={isPositive ? '#22c55e' : '#ef4444'}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="dateFormatted"
              axisLine={false}
              tickLine={false}
              tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 11 }}
              tickFormatter={(value) =>
                value >= 0 ? `$${value.toFixed(0)}` : `-$${Math.abs(value).toFixed(0)}`
              }
              width={60}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: isDark ? '#9ca3af' : '#6b7280' }}
              formatter={(value: number) => [formatPnl(value), 'Cumulative P&L']}
            />
            <Area
              type="monotone"
              dataKey="cumulativePnl"
              stroke={isPositive ? '#22c55e' : '#ef4444'}
              strokeWidth={2}
              fill="url(#pnlGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Unrealized P&L indicator */}
      {unrealizedPnL !== 0 && (
        <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Unrealized P&L</span>
          <span className={`text-sm font-bold ${unrealizedPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatPnl(unrealizedPnL)}
          </span>
        </div>
      )}
    </div>
  )
}
