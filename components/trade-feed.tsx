'use client'

import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import { useOrderlyTrades } from '@/hooks/use-orderly-market'
import { TrendingUp, TrendingDown, Clock, Loader2 } from 'lucide-react'

interface TradeFeedProps {
  selectedAsset: string
}

export function TradeFeed({ selectedAsset }: TradeFeedProps) {
  const [mounted, setMounted] = useState(false)
  const { trades, isLoading, hasData } = useOrderlyTrades(selectedAsset)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-full flex flex-col">
        <div className="pb-1 px-2 pt-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground font-sans">Loading...</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="pb-2 px-3 pt-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium font-sans">Recent Trades</h3>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 font-sans">
              {selectedAsset.replace('-PERP', '')}
            </Badge>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Loading trades...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show empty state if no data
  if (!hasData || trades.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="pb-2 px-3 pt-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium font-sans">Recent Trades</h3>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 font-sans">
              {selectedAsset.replace('-PERP', '')}
            </Badge>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">No recent trades</p>
            <p className="text-[10px] text-muted-foreground mt-1">Connect wallet for live data</p>
          </div>
        </div>
      </div>
    )
  }

  // Count buys and sells
  const buyCount = trades.filter(t => t.side === 'BUY').length
  const sellCount = trades.filter(t => t.side === 'SELL').length
  const totalVolume = trades.reduce((sum, t) => sum + (t.price * t.size), 0)

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
          <div className="flex items-center gap-2">
            <span className="font-sans">Last {trades.length} trades</span>
            <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 bg-green-500/10 border-green-500/30 text-green-600">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse" />
              LIVE
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className="font-sans">Orderly</span>
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
              const isBuy = trade.side === 'BUY'
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
                <span className="font-sans">Buys: {buyCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="font-sans">Sells: {sellCount}</span>
              </div>
            </div>
            <span className="font-sans">
              Vol: ${totalVolume.toFixed(0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
