import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface Position {
  id: string
  symbol: string
  side: 'long' | 'short'
  size: number
  entryPrice: number
  leverage: number
  margin: number
  pnl: number
  pnlPercent: number
  timestamp: number
}

export interface Order {
  id: string
  symbol: string
  side: 'buy' | 'sell'
  type: 'market' | 'limit' | 'stop' | 'stop-limit'
  size: number
  price?: number
  limitPrice?: number
  filled: number
  status: 'pending' | 'filled' | 'cancelled'
  timestamp: number
}

interface UserState {
  positions: Position[]
  orders: Order[]
  history: Order[] // Filled/Cancelled orders
  balance: number // Mock USDT balance

  // Actions
  addPosition: (position: Omit<Position, 'id' | 'timestamp' | 'pnl' | 'pnlPercent'>) => void
  closePosition: (id: string, exitPrice: number) => void
  updatePositionPnL: (id: string, currentPrice: number) => void

  addOrder: (order: Omit<Order, 'id' | 'timestamp' | 'filled' | 'status'>) => void
  cancelOrder: (id: string) => void
  fillOrder: (id: string, fillPrice: number) => void

  resetAccount: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      positions: [],
      orders: [],
      history: [],
      balance: 10000,

      addPosition: (pos) => {
        const newPosition: Position = {
          ...pos,
          id: `pos-${Date.now()}`,
          timestamp: Date.now(),
          pnl: 0,
          pnlPercent: 0
        }

        // Deduct margin from balance (simulated)
        // In a real app, margin is locked, balance is free collateral.
        // Simplified: balance reduces by margin.
        set((state) => ({
          positions: [newPosition, ...state.positions],
          balance: state.balance - pos.margin
        }))
      },

      closePosition: (id, exitPrice) => {
        const { positions, history, balance } = get()
        const pos = positions.find(p => p.id === id)
        if (!pos) return

        // Calculate final PnL
        const priceDiff = exitPrice - pos.entryPrice
        const rawPnl = pos.side === 'long'
          ? priceDiff * pos.size * pos.leverage
          : -priceDiff * pos.size * pos.leverage

        // Return margin + pnl to balance
        const newBalance = balance + pos.margin + rawPnl

        // Create a "Close Order" record for history
        const closeOrder: Order = {
          id: `close-${id}`,
          symbol: pos.symbol,
          side: pos.side === 'long' ? 'sell' : 'buy',
          type: 'market',
          size: pos.size,
          price: exitPrice,
          filled: pos.size,
          status: 'filled',
          timestamp: Date.now()
        }

        set({
          positions: positions.filter(p => p.id !== id),
          history: [closeOrder, ...history],
          balance: newBalance
        })
      },

      updatePositionPnL: (id, currentPrice) => {
        set((state) => ({
          positions: state.positions.map(pos => {
            if (pos.id !== id) return pos

            const priceDiff = currentPrice - pos.entryPrice
            const pnl = pos.side === 'long'
              ? priceDiff * pos.size * pos.leverage
              : -priceDiff * pos.size * pos.leverage

            const pnlPercent = (pnl / pos.margin) * 100

            return { ...pos, pnl, pnlPercent }
          })
        }))
      },

      addOrder: (order) => {
        const newOrder: Order = {
          ...order,
          id: `ord-${Date.now()}`,
          filled: 0,
          status: 'pending',
          timestamp: Date.now()
        }
        set((state) => ({ orders: [newOrder, ...state.orders] }))
      },

      cancelOrder: (id) => {
        set((state) => ({
          orders: state.orders.filter(o => o.id !== id),
          history: [...state.history, {
            ...state.orders.find(o => o.id === id)!,
            status: 'cancelled',
            timestamp: Date.now()
          }]
        }))
      },

      fillOrder: (id, fillPrice) => {
        const { orders, addPosition, history } = get()
        const order = orders.find(o => o.id === id)
        if (!order) return

        // Create position from order
        const margin = (order.size * fillPrice) / 10 // Assuming 10x default leverage for orders if not specified
        const leverage = 10

        addPosition({
          symbol: order.symbol,
          side: order.side === 'buy' ? 'long' : 'short',
          size: order.size,
          entryPrice: fillPrice,
          leverage,
          margin: (order.size * fillPrice) / leverage
        })

        set((state) => ({
          orders: state.orders.filter(o => o.id !== id),
          history: [{ ...order, status: 'filled', filled: order.size, price: fillPrice, timestamp: Date.now() }, ...state.history]
        }))
      },

      resetAccount: () => set({ positions: [], orders: [], history: [], balance: 10000 })
    }),
    {
      name: 'memepulse-user-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
