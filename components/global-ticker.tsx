'use client'

import { usePriceWithChange } from '@/hooks/use-price-with-change'
import { CONTRACTS } from '@/lib/contracts'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

const SUPPORTED_SYMBOLS = Object.keys(CONTRACTS.PRICE_FEEDS) as (keyof typeof CONTRACTS.PRICE_FEEDS)[]

function formatPrice(price: number) {
  if (price > 1) {
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  return price.toFixed(8)
}

function TickerItem({ symbol }: { symbol: keyof typeof CONTRACTS.PRICE_FEEDS }) {
  const { price, changePercent24h, hasData, isLoading } = usePriceWithChange(symbol)

  const hasChange = changePercent24h !== null && changePercent24h !== undefined
  const isUp = hasChange ? changePercent24h >= 0 : false

  return (
    <div className="ticker-item inline-flex items-center gap-2 px-4">
      <span className="font-bold text-primary">{symbol}</span>
      <span className="text-foreground font-mono">
        {isLoading ? (
          <span className="animate-pulse">...</span>
        ) : hasData && price !== null ? (
          `$${formatPrice(price)}`
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-muted-foreground cursor-help">-</span>
              </TooltipTrigger>
              <TooltipContent className="z-[9999]" side="top" sideOffset={5}>
                <p className="font-body text-xs">Feed not activated yet</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </span>
      <span className="inline-flex items-center gap-1 text-xs font-mono">
        {isLoading ? (
          <span className="text-muted-foreground animate-pulse">...</span>
        ) : hasChange ? (
          <>
            {isUp ? (
              <ArrowUpRight className="h-3 w-3 text-emerald-400" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-400" />
            )}
            <span className={isUp ? 'text-emerald-400' : 'text-red-400'}>
              {changePercent24h.toFixed(2)}%
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </span>
    </div>
  )
}

export function GlobalTicker() {
  // Duplicate for seamless loop
  const displaySymbols = [...SUPPORTED_SYMBOLS, ...SUPPORTED_SYMBOLS]

  return (
    <div className="w-full bg-card border-b border-border overflow-hidden">
      <div className="ticker-wrapper">
        <div className="ticker-content">
          {displaySymbols.map((symbol, index) => (
            <TickerItem key={`${symbol}-${index}`} symbol={symbol} />
          ))}
        </div>
      </div>

      <style jsx>{`
        .ticker-wrapper {
          position: relative;
          height: 2rem;
          display: flex;
          align-items: center;
        }
        
        .ticker-content {
          display: flex;
          animation: ticker 60s linear infinite; /* Slowed down for readability */
          will-change: transform;
        }
        
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .ticker-item {
          white-space: nowrap;
        }
      `}</style>
    </div>
  )
}
