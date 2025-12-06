'use client'

import { useEffect } from 'react'
import { useOraclePrice } from '@/hooks/use-contracts'
import { usePriceHistoryStore } from '@/lib/store/price-history-store'
import { CONTRACTS } from '@/lib/contracts'

/**
 * Hook that fetches oracle price and calculates 24h change from localStorage history.
 * Automatically records price points to build up history over time.
 */
export function usePriceWithChange(symbol: keyof typeof CONTRACTS.PRICE_FEEDS) {
  const { price, hasData, updatedAt, isLoading, isError } = useOraclePrice(symbol)
  const recordPrice = usePriceHistoryStore(state => state.recordPrice)
  const getChange24h = usePriceHistoryStore(state => state.getChange24h)

  // Record price when it changes
  useEffect(() => {
    if (hasData && price !== null && price > 0) {
      recordPrice(symbol, price)
    }
  }, [symbol, price, hasData, recordPrice])

  // Get 24h change from localStorage history
  const changeData = getChange24h(symbol)

  return {
    price,
    hasData,
    updatedAt,
    isLoading,
    isError,
    // 24h change from localStorage (null if no history yet)
    change24h: changeData?.change ?? null,
    changePercent24h: changeData?.changePercent ?? null,
    hasChangeData: changeData !== null
  }
}

