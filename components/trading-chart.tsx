'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect, useMemo } from 'react'
import { useTheme } from 'next-themes'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { generateCandleData, generateMarketData, type CandleData } from '@/lib/trading-data'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface TradingChartProps {
  selectedAsset: string
}

type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

const timeframes: { value: Timeframe; label: string }[] = [
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '1h', label: '1h' },
  { value: '4h', label: '4h' },
  { value: '1d', label: '1d' },
]

// Custom candlestick component
const CustomCandlestick = (props: any) => {
  const { payload, x, y, width, height } = props
  if (!payload) return null

  const { open, high, low, close } = payload
  const isUp = close >= open
  const color = isUp ? '#22c55e' : '#ef4444' // green-500 : red-500

  const bodyHeight = Math.abs(close - open)
  const bodyY = Math.min(close, open)
  const wickTop = high
  const wickBottom = low

  // Scale values to chart coordinates
  const chartHeight = height || 200
  const priceRange = high - low
  const scale = chartHeight / priceRange

  const wickTopY = y - ((wickTop - low) * scale - chartHeight)
  const wickBottomY = y - ((wickBottom - low) * scale - chartHeight)
  const bodyTopY = y - ((bodyY + bodyHeight - low) * scale - chartHeight)
  const bodyBottomY = y - ((bodyY - low) * scale - chartHeight)

  const candleWidth = Math.max(width * 0.6, 2)
  const wickWidth = 1

  return (
    <g>
      {/* High-Low Wick */}
      <line
        x1={x + width / 2}
        y1={wickTopY}
        x2={x + width / 2}
        y2={wickBottomY}
        stroke={color}
        strokeWidth={wickWidth}
      />
      {/* Open-Close Body */}
      <rect
        x={x + (width - candleWidth) / 2}
        y={Math.min(bodyTopY, bodyBottomY)}
        width={candleWidth}
        height={Math.abs(bodyTopY - bodyBottomY) || 1}
        fill={isUp ? color : color}
        stroke={color}
        strokeWidth={1}
        opacity={isUp ? 0.8 : 1}
      />
    </g>
  )
}

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  if (active && payload && payload.length) {
    const data = payload[0].payload
    const isUp = data.close >= data.open

    return (
      <div className={`p-3 rounded-lg border shadow-lg ${isDark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900'
        }`}>
        <p className="text-xs font-medium mb-2 font-sans">
          {new Date(data.timestamp).toLocaleString()}
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground font-sans">Open: </span>
            <span className="font-sans">${data.open.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground font-sans">High: </span>
            <span className="font-sans">${data.high.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground font-sans">Low: </span>
            <span className="font-sans">${data.low.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground font-sans">Close: </span>
            <span className={`font-sans ${isUp ? 'text-green-500' : 'text-red-500'}`}>
              ${data.close.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-border">
          <span className="text-muted-foreground font-sans">Volume: </span>
          <span className="font-sans">{data.volume.toLocaleString()}</span>
        </div>
      </div>
    )
  }
  return null
}

export function TradingChart({ selectedAsset }: TradingChartProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('15m')
  const [chartData, setChartData] = useState<CandleData[]>([])
  const [currentPrice, setCurrentPrice] = useState(0)
  const [priceChange, setPriceChange] = useState(0)
  const [priceChangePercent, setPriceChangePercent] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Generate chart data when asset or timeframe changes
  useEffect(() => {
    if (!mounted) return

    const loadChartData = () => {
      const data = generateCandleData(selectedAsset, selectedTimeframe, 100)
      setChartData(data)

      if (data.length > 0) {
        const latest = data[data.length - 1]
        const previous = data[data.length - 2]
        setCurrentPrice(latest.close)

        if (previous) {
          const change = latest.close - previous.close
          const changePercent = (change / previous.close) * 100
          setPriceChange(change)
          setPriceChangePercent(changePercent)
        }
      }
    }

    loadChartData()

    // Update chart data every 5 seconds for live feel
    const interval = setInterval(loadChartData, 5000)
    return () => clearInterval(interval)
  }, [selectedAsset, selectedTimeframe, mounted])

  // Theme-aware colors
  const isDark = mounted && theme === 'dark'
  const chartColors = {
    grid: isDark ? '#374151' : '#e5e7eb',
    axis: isDark ? '#9ca3af' : '#6b7280',
    background: isDark ? '#1f2937' : '#ffffff',
  }

  // Process data for chart
  const processedData = useMemo(() => {
    return chartData.map((candle, index) => ({
      ...candle,
      index,
      time: new Date(candle.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      // Add price range for Y-axis scaling
      priceRange: candle.high - candle.low,
    }))
  }, [chartData])

  if (!mounted) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{selectedAsset}</CardTitle>
            <Badge variant="secondary" className="text-xs">Loading...</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-32 mx-auto mb-2"></div>
                <div className="h-3 bg-muted rounded w-24 mx-auto"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold">{selectedAsset}</CardTitle>
            <span className="text-base font-sans font-bold">
              ${currentPrice.toFixed(2)}
            </span>
            <div className={`flex items-center gap-1 ${priceChangePercent >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
              {priceChangePercent >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span className="text-xs font-medium font-sans">
                {priceChangePercent >= 0 ? '+' : ''}{priceChange.toFixed(2)}
                ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center gap-0.5">
            {timeframes.map((tf) => (
              <Button
                key={tf.value}
                variant={selectedTimeframe === tf.value ? "default" : "outline"}
                size="sm"
                className={`h-6 px-2 text-xs font-medium ${selectedTimeframe === tf.value
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'hover:bg-muted'
                  }`}
                onClick={() => setSelectedTimeframe(tf.value)}
              >
                {tf.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex-1 flex flex-col min-h-0">
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={processedData}
              margin={{ top: 5, right: 15, left: 5, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartColors.grid}
                opacity={0.3}
                horizontal={true}
                vertical={false}
              />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: chartColors.axis }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={['dataMin - 10', 'dataMax + 10']}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: chartColors.axis }}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Volume bars */}
              <Bar
                dataKey="volume"
                fill={isDark ? '#4b5563' : '#d1d5db'}
                opacity={0.6}
                yAxisId="volume"
              />

              {/* Price line for reference */}
              <Line
                type="monotone"
                dataKey="close"
                stroke={isDark ? '#a78bfa' : '#8b5cf6'}
                strokeWidth={1}
                dot={false}
                connectNulls={false}
              />

              {/* Custom candlesticks would go here - simplified for now */}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
