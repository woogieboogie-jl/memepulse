import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface PricePoint {
  price: number
  timestamp: number
}

interface PriceHistoryState {
  // Key: Symbol (e.g., 'DOGE')
  history: Record<string, PricePoint[]>
  
  // Actions
  recordPrice: (symbol: string, price: number) => void
  getChange24h: (symbol: string) => { change: number; changePercent: number } | null
  getPrice24hAgo: (symbol: string) => number | null
  clearOldData: () => void
}

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000 // 24 hours in ms
const MAX_POINTS_PER_SYMBOL = 1440 // 1 point per minute for 24h

export const usePriceHistoryStore = create<PriceHistoryState>()(
  persist(
    (set, get) => ({
      history: {},

      recordPrice: (symbol, price) => {
        if (!price || price <= 0) return
        
        set((state) => {
          const now = Date.now()
          const symbolHistory = state.history[symbol] || []
          
          // Don't record if we already have a recent point (within 30 seconds)
          const lastPoint = symbolHistory[symbolHistory.length - 1]
          if (lastPoint && now - lastPoint.timestamp < 30000) {
            return state
          }
          
          // Add new point and filter old ones
          const cutoff = now - TWENTY_FOUR_HOURS
          const newHistory = [...symbolHistory, { price, timestamp: now }]
            .filter(p => p.timestamp > cutoff)
            .slice(-MAX_POINTS_PER_SYMBOL) // Keep max points
          
          return {
            history: {
              ...state.history,
              [symbol]: newHistory
            }
          }
        })
      },

      getChange24h: (symbol) => {
        const symbolHistory = get().history[symbol]
        if (!symbolHistory || symbolHistory.length < 2) return null
        
        const now = Date.now()
        const twentyFourHoursAgo = now - TWENTY_FOUR_HOURS
        
        // Find oldest point within 24h window
        const oldestPoint = symbolHistory.find(p => p.timestamp >= twentyFourHoursAgo)
        if (!oldestPoint) return null
        
        // Get latest point
        const latestPoint = symbolHistory[symbolHistory.length - 1]
        
        // Calculate change
        const change = latestPoint.price - oldestPoint.price
        const changePercent = (change / oldestPoint.price) * 100
        
        return { change, changePercent }
      },

      getPrice24hAgo: (symbol) => {
        const symbolHistory = get().history[symbol]
        if (!symbolHistory || symbolHistory.length === 0) return null
        
        const now = Date.now()
        const twentyFourHoursAgo = now - TWENTY_FOUR_HOURS
        
        // Find oldest point within 24h window
        const oldestPoint = symbolHistory.find(p => p.timestamp >= twentyFourHoursAgo)
        return oldestPoint?.price || null
      },

      clearOldData: () => {
        set((state) => {
          const now = Date.now()
          const cutoff = now - TWENTY_FOUR_HOURS
          const cleanedHistory: Record<string, PricePoint[]> = {}
          
          Object.entries(state.history).forEach(([symbol, points]) => {
            const filtered = points.filter(p => p.timestamp > cutoff)
            if (filtered.length > 0) {
              cleanedHistory[symbol] = filtered
            }
          })
          
          return { history: cleanedHistory }
        })
      }
    }),
    {
      name: 'memepulse-price-history',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

