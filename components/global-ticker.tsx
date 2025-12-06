'use client'

import { useOraclePrice } from '@/hooks/use-contracts'
import { CONTRACTS } from '@/lib/contracts'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SUPPORTED_SYMBOLS = Object.keys(CONTRACTS.PRICE_FEEDS) as (keyof typeof CONTRACTS.PRICE_FEEDS)[]

function TickerItem({ symbol }: { symbol: keyof typeof CONTRACTS.PRICE_FEEDS }) {
  const { price, hasData, isLoading } = useOraclePrice(symbol)

  return (
    <div className="ticker-item inline-flex items-center gap-2 px-4">
      <span className="font-bold text-primary">{symbol}</span>
      <span className="text-foreground font-mono">
        {isLoading ? (
          <span className="animate-pulse">...</span>
        ) : hasData && price !== null ? (
          `$${price > 1 ? price.toLocaleString() : price.toFixed(8)}`
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
