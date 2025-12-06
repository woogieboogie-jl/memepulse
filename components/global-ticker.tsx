'use client'

import { useEffect, useMemo, useState } from 'react'
import { CONTRACTS } from '@/lib/contracts'
import { usePriceHistoryStore } from '@/lib/store/price-history-store'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { decodeAbiParameters } from 'viem'

const SUPPORTED_SYMBOLS = Object.keys(CONTRACTS.PRICE_FEEDS) as (keyof typeof CONTRACTS.PRICE_FEEDS)[]

function formatPrice(price: number) {
  if (price > 1) {
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  return price.toFixed(8)
}

async function fetchLatestRoundData(feed: string) {
  const payload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_call',
    params: [
      { to: feed, data: '0xfeaf968c' }, // latestRoundData()
      'latest',
    ],
  }

  const res = await fetch('/api/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(`RPC error ${res.status}`)

  const parsed = await res.json()
  const { result, error } = parsed
  if (error) throw new Error(error.message || 'RPC call failed')

  const [roundId, answer, , updatedAt] = decodeAbiParameters(
    [
      { type: 'uint80' },
      { type: 'int256' },
      { type: 'uint256' },
      { type: 'uint256' },
      { type: 'uint80' },
    ],
    result as `0x${string}`
  )

  const hasData = Number(roundId) > 0 && answer > 0n
  const price = hasData ? Number(answer) / 1e8 : null
  return { price, updatedAt: Number(updatedAt), hasData }
}

function useTickerPrice(symbol: keyof typeof CONTRACTS.PRICE_FEEDS) {
  const feed = CONTRACTS.PRICE_FEEDS[symbol]
  const recordPrice = usePriceHistoryStore((s) => s.recordPrice)
  const getChange24h = usePriceHistoryStore((s) => s.getChange24h)

  const [state, setState] = useState<{ price: number | null; hasData: boolean; loading: boolean; error?: string }>({
    price: null,
    hasData: false,
    loading: true,
  })

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        const { price, hasData } = await fetchLatestRoundData(feed)
        if (mounted) {
          if (hasData && price !== null && price > 0) {
            recordPrice(symbol, price)
          }
          setState({ price, hasData, loading: false, error: undefined })
        }
      } catch (e) {
        const message = (e as Error).message || String(e)
        if (mounted) setState({ price: null, hasData: false, loading: false, error: message })
        console.error('[Ticker RPC]', symbol, message)
      }
    }

    run()
    const id = setInterval(run, 10_000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [feed, symbol, recordPrice])

  const change = useMemo(() => getChange24h(symbol), [getChange24h, symbol, state.price])

  return {
    ...state,
    changePercent24h: change?.changePercent ?? null,
  }
}

function TickerItem({ symbol }: { symbol: keyof typeof CONTRACTS.PRICE_FEEDS }) {
  const { price, hasData, loading, changePercent24h, error } = useTickerPrice(symbol)

  const hasChange = changePercent24h !== null && changePercent24h !== undefined
  const isUp = hasChange ? changePercent24h >= 0 : false

  return (
    <div className="ticker-item inline-flex items-center gap-2 px-4">
      <span className="font-bold text-primary">{symbol}</span>
      <span className="text-foreground font-mono">
        {loading ? (
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
                <p className="font-body text-xs">
                  {error ? `Error: ${error}` : 'Feed not activated yet'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </span>
      <span className="inline-flex items-center gap-1 text-xs font-mono">
        {loading ? (
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
          animation: ticker 60s linear infinite;
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
