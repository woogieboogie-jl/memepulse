'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { generateOrderBook, type OrderBook } from '@/lib/trading-data'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface OrderBookProps {
  selectedAsset: string
}

export function OrderBook({ selectedAsset }: OrderBookProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Generate order book data
  useEffect(() => {
    if (!mounted) return

    const loadOrderBook = () => {
      const book = generateOrderBook(selectedAsset, 25) // 25 levels each side for more depth
      setOrderBook(book)
    }

    loadOrderBook()

    // Update order book every 2 seconds for live feel
    const interval = setInterval(loadOrderBook, 2000)
    return () => clearInterval(interval)
  }, [selectedAsset, mounted])

  const isDark = mounted && theme === 'dark'

  if (!mounted || !orderBook) {
    return (
      <Card className="h-64 flex-shrink-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Order Book</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-48 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-pulse">
                <div className="h-3 bg-muted rounded w-20 mx-auto mb-2"></div>
                <div className="h-3 bg-muted rounded w-16 mx-auto mb-1"></div>
                <div className="h-3 bg-muted rounded w-18 mx-auto"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const midPrice = (orderBook.asks[0]?.price + orderBook.bids[0]?.price) / 2

  return (
    <div className="h-full flex flex-col">
      <div className="pb-1 px-2 pt-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground font-sans">Spread: ${orderBook.spread.toFixed(4)} ({orderBook.spreadPercent.toFixed(2)}%)</span>
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
            {orderBook.asks.slice(0, 10).reverse().map((ask, index) => {
              const maxTotal = Math.max(
                orderBook.asks[orderBook.asks.length - 1]?.total || 0,
                orderBook.bids[orderBook.bids.length - 1]?.total || 0
              )
              const depthPercent = (ask.total / maxTotal) * 100
              return (
                <div
                  key={`ask-${ask.price}-${index}`}
                  className="relative px-2 py-0.5 hover:bg-red-500/5 cursor-pointer group transition-colors min-h-[16px]"
                >
                  {/* Depth bar */}
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

        {/* Mid Price Spread */}
        <div className="flex-shrink-0 px-2 py-1 bg-muted/30 border-b border-border">
          <div className="flex items-center justify-center gap-1">
            <div className="flex items-center gap-1 text-[10px]">
              <TrendingUp className="h-2.5 w-2.5 text-muted-foreground" />
              <span className="font-medium font-sans text-foreground">
                ${midPrice.toFixed(2)}
              </span>
              <span className="text-muted-foreground font-sans">Mid</span>
            </div>
          </div>
        </div>

        {/* Bids (Buy Orders) - Green */}
        <div className="flex-1 overflow-hidden">
          <div className="space-y-0 overflow-y-auto h-full">
            {orderBook.bids.slice(0, 10).map((bid, index) => {
              const maxTotal = Math.max(
                orderBook.asks[orderBook.asks.length - 1]?.total || 0,
                orderBook.bids[orderBook.bids.length - 1]?.total || 0
              )
              const depthPercent = (bid.total / maxTotal) * 100
              return (
                <div
                  key={`bid-${bid.price}-${index}`}
                  className="relative px-3 py-1 hover:bg-green-500/5 cursor-pointer group transition-colors min-h-[20px]"
                >
                  {/* Depth bar */}
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
                <span className="font-sans">Bids: {orderBook.bids.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="font-sans">Asks: {orderBook.asks.length}</span>
              </div>
            </div>
            <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 bg-yellow-500/10 border-yellow-500/30 text-yellow-600">
              SIMULATION
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
