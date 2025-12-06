'use client'

import { 
  useTickerStream, 
  useOrderbookStream,
  useMarketTradeStream,
  useMarkPriceBySymbol,
} from '@orderly.network/hooks'
import { useMemo } from 'react'

/**
 * Convert our internal symbol format (DOGE-PERP) to Orderly format (PERP_DOGE_USDC)
 */
function toOrderlySymbol(symbol: string): string {
  // DOGE-PERP -> PERP_DOGE_USDC
  const base = symbol.replace('-PERP', '')
  return `PERP_${base}_USDC`
}

/**
 * Hook for getting real-time ticker data from Orderly
 */
export function useOrderlyTicker(symbol: string) {
  const orderlySymbol = toOrderlySymbol(symbol)
  const ticker = useTickerStream(orderlySymbol)
  
  return useMemo(() => {
    if (!ticker) {
      return {
        price: 0,
        change24h: 0,
        changePercent24h: 0,
        high24h: 0,
        low24h: 0,
        volume24h: 0,
        isLoading: true,
        hasData: false,
      }
    }

    // Handle when ticker returns 0 or undefined values
    const hasData = ticker.mark_price > 0 || ticker.index_price > 0

    return {
      price: ticker.mark_price || ticker.index_price || ticker.last || 0,
      markPrice: ticker.mark_price || 0,
      indexPrice: ticker.index_price || 0,
      change24h: ticker['24h_change'] || 0,
      changePercent24h: ticker['24h_change'] ? (ticker['24h_change'] / (ticker.open_price || 1)) * 100 : 0,
      high24h: ticker['24h_high'] || 0,
      low24h: ticker['24h_low'] || 0,
      volume24h: ticker['24h_volume'] || 0,
      openPrice: ticker.open_price || 0,
      isLoading: false,
      hasData,
    }
  }, [ticker])
}

/**
 * Hook for getting real-time orderbook data from Orderly
 */
export function useOrderlyOrderbook(symbol: string) {
  const orderlySymbol = toOrderlySymbol(symbol)
  const orderbook = useOrderbookStream(orderlySymbol, undefined, {
    level: 10, // Get 10 levels of depth
  })

  return useMemo(() => {
    if (!orderbook || (!orderbook.asks?.length && !orderbook.bids?.length)) {
      return {
        asks: [],
        bids: [],
        spread: 0,
        spreadPercent: 0,
        midPrice: 0,
        isLoading: true,
        hasData: false,
      }
    }

    // Transform orderbook data
    const asks = (orderbook.asks || []).map((ask: [number, number], index: number) => ({
      price: ask[0],
      size: ask[1],
      total: (orderbook.asks || []).slice(0, index + 1).reduce((sum: number, a: [number, number]) => sum + a[1], 0),
    }))

    const bids = (orderbook.bids || []).map((bid: [number, number], index: number) => ({
      price: bid[0],
      size: bid[1],
      total: (orderbook.bids || []).slice(0, index + 1).reduce((sum: number, b: [number, number]) => sum + b[1], 0),
    }))

    const bestAsk = asks[0]?.price || 0
    const bestBid = bids[0]?.price || 0
    const spread = bestAsk - bestBid
    const midPrice = (bestAsk + bestBid) / 2
    const spreadPercent = midPrice > 0 ? (spread / midPrice) * 100 : 0

    return {
      asks,
      bids,
      spread,
      spreadPercent,
      midPrice,
      bestAsk,
      bestBid,
      isLoading: false,
      hasData: true,
    }
  }, [orderbook])
}

/**
 * Hook for getting real-time trade stream from Orderly
 */
export function useOrderlyTrades(symbol: string) {
  const orderlySymbol = toOrderlySymbol(symbol)
  const trades = useMarketTradeStream(orderlySymbol)

  return useMemo(() => {
    if (!trades || !Array.isArray(trades) || trades.length === 0) {
      return {
        trades: [],
        isLoading: true,
        hasData: false,
      }
    }

    const formattedTrades = trades.slice(0, 50).map((trade: { ts: number; price: number; size: number; side: string }, index: number) => ({
      id: `${trade.ts}-${index}`,
      timestamp: trade.ts,
      price: trade.price,
      size: trade.size,
      side: trade.side as 'BUY' | 'SELL',
    }))

    return {
      trades: formattedTrades,
      isLoading: false,
      hasData: true,
    }
  }, [trades])
}

/**
 * Hook for getting mark price for a specific symbol
 */
export function useOrderlyMarkPrice(symbol: string) {
  const orderlySymbol = toOrderlySymbol(symbol)
  const markPrice = useMarkPriceBySymbol(orderlySymbol)
  
  return {
    markPrice: markPrice || 0,
    hasData: markPrice != null && markPrice > 0,
  }
}

/**
 * Supported trading pairs (Orderly memecoin perps)
 */
export const ORDERLY_SUPPORTED_SYMBOLS = [
  'DOGE-PERP',
  'PEPE-PERP', 
  'SHIB-PERP',
  'FLOKI-PERP',
  'WIF-PERP',
  'BONK-PERP',
  'BTC-PERP',
] as const

export type OrderlySymbol = typeof ORDERLY_SUPPORTED_SYMBOLS[number]

