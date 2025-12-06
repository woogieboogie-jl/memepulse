import { create } from 'zustand'

export interface MarketStats {
  change24h: number
  changePercent24h: number
  high24h: number
  low24h: number
  volume24h: number
}

interface MarketState {
  // Key: Symbol (e.g., 'DOGE-PERP')
  prices: Record<string, number>
  stats: Record<string, MarketStats>

  // Actions
  updatePrice: (symbol: string, price: number) => void
  updateStats: (symbol: string, stats: MarketStats) => void
  batchUpdate: (prices: Record<string, number>) => void
}

export const useMarketStore = create<MarketState>((set) => ({
  prices: {},
  stats: {},

  updatePrice: (symbol, price) =>
    set((state) => ({
      prices: { ...state.prices, [symbol]: price }
    })),

  updateStats: (symbol, newStats) =>
    set((state) => ({
      stats: { ...state.stats, [symbol]: newStats }
    })),

  batchUpdate: (newPrices) =>
    set((state) => ({
      prices: { ...state.prices, ...newPrices }
    }))
}))
