'use client'

import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import { useOrderlyOrderbook, useOrderlyMarkPrice } from '@/hooks/use-orderly-market'
import { TrendingUp, Loader2 } from 'lucide-react'

interface OrderBookProps {
  selectedAsset: string
}

export function OrderBook({ selectedAsset }: OrderBookProps) {
  const [mounted, setMounted] = useState(false)
  const orderbook = useOrderlyOrderbook(selectedAsset)
  const { markPrice, hasData: hasMarkPrice } = useOrderlyMarkPrice(selectedAsset)

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
  if (orderbook.isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="pb-1 px-2 pt-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground font-sans">Connecting to Orderly...</span>
            <Badge variant="outline" className="text-[8px] px-1 py-0 font-sans h-3.5">
              {selectedAsset.replace('-PERP', '')}
            </Badge>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Loading orderbook...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show empty state if no data
  if (!orderbook.hasData) {
    return (
      <div className="h-full flex flex-col">
        <div className="pb-1 px-2 pt-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground font-sans">No data available</span>
            <Badge variant="outline" className="text-[8px] px-1 py-0 font-sans h-3.5">
              {selectedAsset.replace('-PERP', '')}
            </Badge>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Connect wallet to view orderbook</p>
            <p className="text-[10px] text-muted-foreground mt-1">Real-time data from Orderly Network</p>
          </div>
        </div>
      </div>
    )
  }

  const displayMidPrice = hasMarkPrice ? markPrice : orderbook.midPrice

  return (
    <div className="h-full flex flex-col">
      <div className="pb-1 px-2 pt-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground font-sans">
              Spread: ${orderbook.spread.toFixed(4)} ({orderbook.spreadPercent.toFixed(3)}%)
            </span>
            <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 bg-green-500/10 border-green-500/30 text-green-600">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse" />
              LIVE
            </Badge>
          </div>
          <Badge variant="outline" className="text-[8px] px-1 py-0 font-sans h-3.5">
            {selectedAsset.replace('-PERP', '')}
          </Badge>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="px-2 py-0.5 border-b border-border flex-shrink-0">
          <div className="grid grid-cols-3 gap-2 text-[9px] font-medium text-muted-foreground">
            <span className="text-left font-sans">Price</span>
            <span className="text-right font-sans">Size</span>
            <span className="text-right font-sans">Total</span>
          </div>
        </div>

        {/* Asks (Sell Orders) - Red */}
        <div className="flex-1 flex flex-col-reverse overflow-hidden border-b border-border">
          <div className="space-y-0 overflow-y-auto">
            {orderbook.asks.slice(0, 10).reverse().map((ask: { price: number; size: number; total: number }, index: number) => {
              const maxTotal = Math.max(
                orderbook.asks[orderbook.asks.length - 1]?.total || 1,
                orderbook.bids[orderbook.bids.length - 1]?.total || 1
              )
              const depthPercent = (ask.total / maxTotal) * 100
              return (
                <div
                  key={`ask-${ask.price}-${index}`}
                  className="relative px-2 py-0.5 hover:bg-red-500/5 cursor-pointer group transition-colors min-h-[16px]"
                >
                  <div
                    className="absolute right-0 top-0 h-full bg-red-500/10 transition-all duration-300"
                    style={{ width: `${Math.min(depthPercent, 100)}%` }}
                  />
                  <div className="relative grid grid-cols-3 gap-2 text-[11px] leading-tight">
                    <span className="text-red-500 font-medium font-sans group-hover:text-red-400">
                      ${ask.price.toFixed(ask.price > 1 ? 2 : 6)}
                    </span>
                    <span className="text-right text-foreground font-sans">
                      {ask.size.toFixed(3)}
                    </span>
                    <span className="text-right text-muted-foreground font-sans">
                      {ask.total.toFixed(1)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mid Price / Mark Price */}
        <div className="flex-shrink-0 px-2 py-1 bg-muted/30 border-b border-border">
          <div className="flex items-center justify-center gap-1">
            <div className="flex items-center gap-1 text-[10px]">
              <TrendingUp className="h-2.5 w-2.5 text-muted-foreground" />
              <span className="font-medium font-sans text-foreground">
                ${displayMidPrice.toFixed(displayMidPrice > 1 ? 2 : 6)}
              </span>
              <span className="text-muted-foreground font-sans">
                {hasMarkPrice ? 'Mark' : 'Mid'}
              </span>
            </div>
          </div>
        </div>

        {/* Bids (Buy Orders) - Green */}
        <div className="flex-1 overflow-hidden">
          <div className="space-y-0 overflow-y-auto h-full">
            {orderbook.bids.slice(0, 10).map((bid: { price: number; size: number; total: number }, index: number) => {
              const maxTotal = Math.max(
                orderbook.asks[orderbook.asks.length - 1]?.total || 1,
                orderbook.bids[orderbook.bids.length - 1]?.total || 1
              )
              const depthPercent = (bid.total / maxTotal) * 100
              return (
                <div
                  key={`bid-${bid.price}-${index}`}
                  className="relative px-3 py-1 hover:bg-green-500/5 cursor-pointer group transition-colors min-h-[20px]"
                >
                  <div
                    className="absolute right-0 top-0 h-full bg-green-500/10 transition-all duration-300"
                    style={{ width: `${Math.min(depthPercent, 100)}%` }}
                  />
                  <div className="relative grid grid-cols-3 gap-2 text-[11px] leading-tight">
                    <span className="text-green-500 font-medium font-sans group-hover:text-green-400">
                      ${bid.price.toFixed(bid.price > 1 ? 2 : 6)}
                    </span>
                    <span className="text-right text-foreground font-sans">
                      {bid.size.toFixed(3)}
                    </span>
                    <span className="text-right text-muted-foreground font-sans">
                      {bid.total.toFixed(1)}
                    </span>
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
                <span className="font-sans">Bids: {orderbook.bids.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="font-sans">Asks: {orderbook.asks.length}</span>
              </div>
            </div>
            <span className="font-sans text-green-600">Orderly</span>
          </div>
        </div>
      </div>
    </div>
  )
}
