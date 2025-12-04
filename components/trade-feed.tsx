'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { generateRecentTrades, type Trade } from '@/lib/trading-data'
import { TrendingUp, TrendingDown, Clock } from 'lucide-react'

interface TradeFeedProps {
  selectedAsset: string
}

export function TradeFeed({ selectedAsset }: TradeFeedProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [trades, setTrades] = useState<Trade[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Generate trade feed data
  useEffect(() => {
    if (!mounted) return

    const loadTrades = () => {
      const recentTrades = generateRecentTrades(selectedAsset, 30) // 30 recent trades
      setTrades(recentTrades)
    }

    loadTrades()

    // Update trades every 3 seconds for live feel
    const interval = setInterval(loadTrades, 3000)
    return () => clearInterval(interval)
  }, [selectedAsset, mounted])

  const isDark = mounted && theme === 'dark'

  if (!mounted || trades.length === 0) {
    return (
      <div className="h-full flex flex-col">
      <div className="pb-1 px-2 pt-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground font-sans">Last 30 trades</span>
          <Badge variant="outline" className="text-[8px] px-1 py-0 font-sans h-3.5">
            {selectedAsset.replace('-PERP', '')}
          </Badge>
        </div>
      </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-3 bg-muted rounded w-20 mx-auto mb-2"></div>
              <div className="h-3 bg-muted rounded w-16 mx-auto mb-1"></div>
              <div className="h-3 bg-muted rounded w-18 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="pb-2 px-3 pt-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium font-sans">Recent Trades</h3>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 font-sans">
            {selectedAsset.replace('-PERP', '')}
          </Badge>
        </div>
        
        {/* Trade Stats */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
          <span className="font-sans">Last {trades.length} trades</span>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className="font-sans">Live</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="px-3 py-1 border-b border-border flex-shrink-0">
          <div className="grid grid-cols-4 gap-2 text-[10px] font-medium text-muted-foreground">
            <span className="text-left font-sans">Time</span>
            <span className="text-right font-sans">Price</span>
            <span className="text-right font-sans">Size</span>
            <span className="text-center font-sans">Side</span>
          </div>
        </div>

        {/* Trade List */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-0">
            {trades.slice(0, 20).map((trade, index) => {
              const isBuy = trade.side === 'buy'
              const timeStr = new Date(trade.timestamp).toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              })
              
              return (
                <div
                  key={`${trade.id}-${index}`}
                  className={`relative px-3 py-1 hover:bg-muted/30 cursor-pointer group transition-colors min-h-[24px] ${
                    isBuy ? 'hover:bg-green-500/5' : 'hover:bg-red-500/5'
                  }`}
                >
                  {/* Side indicator bar */}
                  <div
                    className={`absolute left-0 top-0 w-1 h-full transition-all duration-300 ${
                      isBuy ? 'bg-green-500/30' : 'bg-red-500/30'
                    }`}
                  />
                  
                  <div className="relative grid grid-cols-4 gap-2 text-[11px] leading-tight">
                    <span className="text-muted-foreground font-sans text-left">
                      {timeStr}
                    </span>
                    <span className={`text-right font-medium font-sans ${
                      isBuy ? 'text-green-500' : 'text-red-500'
                    }`}>
                      ${trade.price.toFixed(trade.price > 1 ? 2 : 6)}
                    </span>
                    <span className="text-right text-foreground font-sans">
                      {trade.size.toFixed(3)}
                    </span>
                    <div className="flex items-center justify-center">
                      {isBuy ? (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-green-500 font-medium font-sans text-[10px]">BUY</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <TrendingDown className="h-3 w-3 text-red-500" />
                          <span className="text-red-500 font-medium font-sans text-[10px]">SELL</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer Stats */}
        <div className="flex-shrink-0 px-3 py-2 border-t border-border bg-muted/20">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-sans">
                  Buys: {trades.filter(t => t.side === 'buy').length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="font-sans">
                  Sells: {trades.filter(t => t.side === 'sell').length}
                </span>
              </div>
            </div>
            <span className="font-sans">
              Vol: ${trades.reduce((sum, t) => sum + (t.price * t.size), 0).toFixed(0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
