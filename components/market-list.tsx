'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { useOrderlyTicker, ORDERLY_SUPPORTED_SYMBOLS, type OrderlySymbol } from '@/hooks/use-orderly-market'

interface MarketListProps {
  selectedAsset: string
  onAssetSelect: (symbol: string) => void
  isVisible: boolean
  onToggleVisibility: () => void
}

// Market metadata
const MARKET_INFO: Record<string, { name: string; emoji: string }> = {
  'DOGE-PERP': { name: 'Dogecoin', emoji: '🐕' },
  'PEPE-PERP': { name: 'Pepe', emoji: '🐸' },
  'SHIB-PERP': { name: 'Shiba Inu', emoji: '🐕‍🦺' },
  'FLOKI-PERP': { name: 'Floki', emoji: '🐺' },
  'WIF-PERP': { name: 'dogwifhat', emoji: '🎩' },
  'BONK-PERP': { name: 'Bonk', emoji: '💥' },
  'BTC-PERP': { name: 'Bitcoin', emoji: '₿' },
}

// Individual market item with its own hook
function MarketItem({ 
  symbol, 
  isSelected, 
  onSelect 
}: { 
  symbol: OrderlySymbol
  isSelected: boolean
  onSelect: () => void 
}) {
  const ticker = useOrderlyTicker(symbol)
  const info = MARKET_INFO[symbol] || { name: symbol, emoji: '🪙' }

  return (
    <div
      className={`px-2 py-1.5 cursor-pointer hover:bg-muted/50 transition-colors border-l-2 ${
        isSelected 
          ? 'border-l-primary bg-muted/30' 
          : 'border-l-transparent'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium font-sans">{symbol}</span>
          <Badge variant="secondary" className="text-[7px] px-0.5 py-0 h-3">
            PERP
          </Badge>
        </div>
        <div className="flex items-center gap-0.5">
          {ticker.isLoading ? (
            <Loader2 className="h-2.5 w-2.5 animate-spin text-muted-foreground" />
          ) : ticker.changePercent24h >= 0 ? (
            <TrendingUp className="h-2.5 w-2.5 text-green-500" />
          ) : (
            <TrendingDown className="h-2.5 w-2.5 text-red-500" />
          )}
          <span className={`text-[8px] font-medium font-sans ${
            ticker.isLoading 
              ? 'text-muted-foreground'
              : ticker.changePercent24h >= 0 
                ? 'text-green-500' 
                : 'text-red-500'
          }`}>
            {ticker.isLoading 
              ? '...' 
              : `${ticker.changePercent24h >= 0 ? '+' : ''}${ticker.changePercent24h.toFixed(1)}%`
            }
          </span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-sans font-medium">
          {ticker.isLoading ? (
            <span className="text-muted-foreground">Loading...</span>
          ) : ticker.hasData ? (
            `$${ticker.price > 1 ? ticker.price.toFixed(2) : ticker.price.toFixed(6)}`
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </span>
        <span className="text-[8px] text-muted-foreground font-sans">
          {ticker.isLoading || !ticker.hasData 
            ? '-' 
            : `$${(ticker.volume24h / 1000000).toFixed(1)}M`
          }
        </span>
      </div>
    </div>
  )
}

// Collapsed market indicator
function CollapsedMarketIndicator({ 
  symbol, 
  isSelected, 
  onSelect 
}: { 
  symbol: OrderlySymbol
  isSelected: boolean
  onSelect: () => void 
}) {
  const ticker = useOrderlyTicker(symbol)

  return (
    <div
      className={`group relative cursor-pointer transition-all duration-200 ${
        isSelected ? 'scale-110' : 'hover:scale-105'
      }`}
      onClick={onSelect}
      title={`${symbol}: ${ticker.hasData ? `$${ticker.price > 1 ? ticker.price.toFixed(2) : ticker.price.toFixed(6)} (${ticker.changePercent24h >= 0 ? '+' : ''}${ticker.changePercent24h.toFixed(2)}%)` : 'Loading...'}`}
    >
      <div className={`w-3 h-3 rounded-full border-2 transition-colors ${
        isSelected 
          ? 'bg-primary border-primary shadow-lg shadow-primary/30' 
          : ticker.changePercent24h >= 0
            ? 'bg-green-500/20 border-green-500/50 hover:bg-green-500/30'
            : 'bg-red-500/20 border-red-500/50 hover:bg-red-500/30'
      }`}>
        {isSelected && (
          <div className="w-1 h-1 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        )}
      </div>
      
      <div className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border shadow-md">
        {symbol.replace('-PERP', '')}
      </div>
    </div>
  )
}

export function MarketList({ selectedAsset, onAssetSelect, isVisible, onToggleVisibility }: MarketListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const filteredMarkets = useMemo(() => {
    return ORDERLY_SUPPORTED_SYMBOLS.filter(symbol =>
      symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (MARKET_INFO[symbol]?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery])

  if (!mounted) {
    return (
      <div className={`transition-all duration-300 ${isVisible ? 'w-full' : 'w-12'}`}>
        <Card className="h-full">
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
      {/* Toggle Button */}
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
              <div className="px-2 pb-1 pt-2 flex-shrink-0">
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

              {/* Live Data Badge */}
              <div className="px-2 pb-1 flex-shrink-0">
                <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 bg-green-500/10 border-green-500/30 text-green-600">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse" />
                  LIVE
                </Badge>
              </div>

              {/* Market List */}
              <div className="space-y-0 overflow-y-auto h-full">
                {filteredMarkets.map((symbol) => (
                  <MarketItem
                    key={symbol}
                    symbol={symbol}
                    isSelected={selectedAsset === symbol}
                    onSelect={() => onAssetSelect(symbol)}
                  />
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

        {/* Collapsed state */}
        {!isVisible && (
          <div className="p-2 flex flex-col items-center h-full">
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
            
            <div className="flex flex-col gap-2 mt-4">
              {filteredMarkets.slice(0, 5).map((symbol) => (
                <CollapsedMarketIndicator
                  key={symbol}
                  symbol={symbol}
                  isSelected={selectedAsset === symbol}
                  onSelect={() => onAssetSelect(symbol)}
                />
              ))}
              
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
