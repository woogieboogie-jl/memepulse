'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { generateMarketData, updatePrices, type MarketData } from '@/lib/trading-data'

interface MarketListProps {
  selectedAsset: string
  onAssetSelect: (symbol: string) => void
  isVisible: boolean
  onToggleVisibility: () => void
}

export function MarketList({ selectedAsset, onAssetSelect, isVisible, onToggleVisibility }: MarketListProps) {
  const [markets, setMarkets] = useState<MarketData[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Initial load
    setMarkets(generateMarketData())
    
    // Update prices every 3 seconds
    const interval = setInterval(() => {
      updatePrices()
      setMarkets(generateMarketData())
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const filteredMarkets = markets.filter(market =>
    market.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    market.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!mounted) {
    return (
      <div className={`transition-all duration-300 ${isVisible ? 'w-full' : 'w-12'}`}>
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Markets</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-3 py-2 text-xs text-muted-foreground">
              Loading markets...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`transition-all duration-300 ${isVisible ? 'w-full' : 'w-12'} h-full relative`}>
      {/* Toggle Button - Outside the card to prevent clipping */}
      <button
        onClick={onToggleVisibility}
        className="absolute -right-3 top-4 z-50 bg-background border border-border rounded-full p-1.5 hover:bg-muted transition-all duration-200 shadow-sm hover:shadow-md"
        title={isVisible ? "Hide Markets" : "Show Markets"}
      >
        {isVisible ? (
          <ChevronLeft className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
      </button>
      
      <Card className="h-full flex flex-col">

        {isVisible && (
          <>
            <CardContent className="p-0 flex flex-col flex-1 min-h-0">
        {/* Search */}
        <div className="px-2 pb-1 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-2.5 w-2.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search ${filteredMarkets.length} markets...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-6 pl-6 text-[10px]"
            />
          </div>
        </div>

              {/* Market List */}
              <div className="space-y-0 overflow-y-auto h-full">
                {filteredMarkets.map((market) => (
                  <div
                    key={market.symbol}
                    className={`px-2 py-1.5 cursor-pointer hover:bg-muted/50 transition-colors border-l-2 ${
                      selectedAsset === market.symbol 
                        ? 'border-l-primary bg-muted/30' 
                        : 'border-l-transparent'
                    }`}
                    onClick={() => onAssetSelect(market.symbol)}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium font-sans">{market.symbol}</span>
                        {market.symbol.includes('PERP') && (
                          <Badge variant="secondary" className="text-[7px] px-0.5 py-0 h-3">
                            PERP
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5">
                        {market.changePercent24h >= 0 ? (
                          <TrendingUp className="h-2.5 w-2.5 text-green-500" />
                        ) : (
                          <TrendingDown className="h-2.5 w-2.5 text-red-500" />
                        )}
                        <span className={`text-[8px] font-medium font-sans ${
                          market.changePercent24h >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {market.changePercent24h >= 0 ? '+' : ''}{market.changePercent24h.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-sans font-medium">
                        ${market.price > 1 ? market.price.toFixed(2) : market.price.toFixed(4)}
                      </span>
                      <span className="text-[8px] text-muted-foreground font-sans">
                        ${(market.volume24h / 1000000).toFixed(1)}M
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {filteredMarkets.length === 0 && searchQuery && (
                <div className="px-3 py-8 text-center">
                  <p className="text-xs text-muted-foreground">No markets found</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Try a different search term
                  </p>
                </div>
              )}
            </CardContent>
          </>
        )}

        {/* Collapsed state - show minimal info */}
        {!isVisible && (
          <div className="p-2 flex flex-col items-center h-full">
            {/* Vertical Markets text */}
            <div className="flex-1 flex items-center justify-center">
              <div 
                className="text-[10px] text-muted-foreground font-medium"
                style={{ 
                  writingMode: 'vertical-rl', 
                  textOrientation: 'mixed',
                  transform: 'rotate(180deg)'
                }}
              >
                Markets
              </div>
            </div>
            
            {/* Market indicators */}
            <div className="flex flex-col gap-2 mt-4">
              {filteredMarkets.slice(0, 5).map((market) => (
                <div
                  key={market.symbol}
                  className={`group relative cursor-pointer transition-all duration-200 ${
                    selectedAsset === market.symbol ? 'scale-110' : 'hover:scale-105'
                  }`}
                  onClick={() => onAssetSelect(market.symbol)}
                  title={`${market.symbol}: $${market.price > 1 ? market.price.toFixed(2) : market.price.toFixed(6)} (${market.changePercent24h >= 0 ? '+' : ''}${market.changePercent24h.toFixed(2)}%)`}
                >
                  {/* Market indicator dot */}
                  <div className={`w-3 h-3 rounded-full border-2 transition-colors ${
                    selectedAsset === market.symbol 
                      ? 'bg-primary border-primary shadow-lg shadow-primary/30' 
                      : market.changePercent24h >= 0
                        ? 'bg-green-500/20 border-green-500/50 hover:bg-green-500/30'
                        : 'bg-red-500/20 border-red-500/50 hover:bg-red-500/30'
                  }`}>
                    {/* Inner dot for selected state */}
                    {selectedAsset === market.symbol && (
                      <div className="w-1 h-1 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    )}
                  </div>
                  
                  {/* Hover tooltip - symbol only */}
                  <div className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border shadow-md">
                    {market.symbol.replace('-PERP', '')}
                  </div>
                </div>
              ))}
              
              {/* Show more indicator if there are more markets */}
              {filteredMarkets.length > 5 && (
                <div className="text-[8px] text-muted-foreground text-center mt-1">
                  +{filteredMarkets.length - 5}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
