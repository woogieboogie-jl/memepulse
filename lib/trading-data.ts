// Mock trading data generators for the manual trading interface

export interface MarketData {
  symbol: string
  name: string
  price: number
  change24h: number
  changePercent24h: number
  volume24h: number
  marketCap?: number
  high24h: number
  low24h: number
  lastUpdate: number
}

export interface OrderBookEntry {
  price: number
  size: number
  total: number
}

export interface OrderBook {
  bids: OrderBookEntry[]
  asks: OrderBookEntry[]
  spread: number
  spreadPercent: number
}

export interface Trade {
  id: string
  price: number
  size: number
  side: 'buy' | 'sell'
  timestamp: number
}

export interface CandleData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface Position {
  id: string
  symbol: string
  side: 'long' | 'short'
  size: number
  entryPrice: number
  markPrice: number
  pnl: number
  pnlPercent: number
  leverage: number
  margin: number
  timestamp: number
}

export interface Order {
  id: string
  symbol: string
  side: 'buy' | 'sell'
  type: 'market' | 'limit' | 'stop'
  size: number
  price?: number
  filled: number
  status: 'pending' | 'filled' | 'cancelled' | 'partial'
  timestamp: number
}

// Base market data - memecoin-only perps matching our supported contracts
const baseMarkets: Omit<MarketData, 'price' | 'change24h' | 'changePercent24h' | 'volume24h' | 'high24h' | 'low24h' | 'lastUpdate'>[] = [
  { symbol: 'BTC-PERP', name: 'Bitcoin Perpetual', marketCap: 1200000000000 },
  { symbol: 'DOGE-PERP', name: 'Dogecoin Perpetual', marketCap: 25000000000 },
  { symbol: 'PEPE-PERP', name: 'Pepe Perpetual', marketCap: 3500000000 },
  { symbol: 'SHIB-PERP', name: 'Shiba Inu Perpetual', marketCap: 8000000000 },
  { symbol: 'FLOKI-PERP', name: 'Floki Perpetual', marketCap: 1200000000 },
  { symbol: 'WIF-PERP', name: 'dogwifhat Perpetual', marketCap: 2800000000 },
  { symbol: 'BONK-PERP', name: 'Bonk Perpetual', marketCap: 1500000000 },
]

// Base prices for realistic market simulation - memecoin perps only
const basePrices: Record<string, number> = {
  'BTC-PERP': 67234.50,
  'DOGE-PERP': 0.1456,
  'PEPE-PERP': 0.00001234,
  'SHIB-PERP': 0.00002456,
  'FLOKI-PERP': 0.00012345,
  'WIF-PERP': 2.34,
  'BONK-PERP': 0.000023,
}

// Price volatility factors for realistic movement - memecoin perps
const volatilityFactors: Record<string, number> = {
  'BTC-PERP': 0.015,
  'DOGE-PERP': 0.06,
  'PEPE-PERP': 0.08,
  'SHIB-PERP': 0.08,
  'FLOKI-PERP': 0.07,
  'WIF-PERP': 0.09,
  'BONK-PERP': 0.08,
}

// Global state for price tracking - only initialize on client
let currentPrices: Record<string, number> = {}
let priceHistory: Record<string, number[]> = {}
let isInitialized = false

// Initialize data only on client side
function initializeIfNeeded() {
  if (typeof window === 'undefined' || isInitialized) return

  currentPrices = { ...basePrices }
  priceHistory = {}

  Object.keys(basePrices).forEach(symbol => {
    priceHistory[symbol] = [basePrices[symbol]]
  })

  // Generate mock positions
  generateMockPositions()

  // Generate mock orders
  generateMockOrders()

  isInitialized = true
}

// Generate mock positions for demo - memecoin perps only
function generateMockPositions() {
  const symbols = ['DOGE-PERP', 'PEPE-PERP', 'SHIB-PERP', 'BTC-PERP', 'WIF-PERP']

  mockPositions = symbols.slice(0, 7).map((symbol, index) => {
    const entryPrice = basePrices[symbol] * (0.95 + Math.random() * 0.1)
    const markPrice = basePrices[symbol]
    const side: 'long' | 'short' = index % 2 === 0 ? 'long' : 'short'
    const size = 0.1 + Math.random() * 2
    const leverage = [5, 10, 25][Math.floor(Math.random() * 3)]
    const priceDiff = markPrice - entryPrice
    const pnl = side === 'long'
      ? priceDiff * size * leverage
      : -priceDiff * size * leverage
    const pnlPercent = (pnl / (entryPrice * size)) * 100
    const margin = (entryPrice * size) / leverage

    return {
      id: `pos-${index + 1}`,
      symbol,
      side,
      size: Number(size.toFixed(4)),
      entryPrice: Number(entryPrice.toFixed(2)),
      markPrice: Number(markPrice.toFixed(2)),
      pnl: Number(pnl.toFixed(2)),
      pnlPercent: Number(pnlPercent.toFixed(2)),
      leverage,
      margin: Number(margin.toFixed(2)),
      timestamp: Date.now() - (index + 1) * 3600000
    }
  })
}

// Generate mock orders for demo - memecoin perps only
function generateMockOrders() {
  const symbols = ['DOGE-PERP', 'BTC-PERP', 'SHIB-PERP', 'PEPE-PERP', 'FLOKI-PERP', 'WIF-PERP', 'BONK-PERP']
  const statuses: Order['status'][] = ['pending', 'filled', 'partial']
  const types: Order['type'][] = ['limit', 'market', 'stop']

  mockOrders = symbols.slice(0, 12).map((symbol, index) => {
    const price = basePrices[symbol] * (0.98 + Math.random() * 0.04)
    const size = 0.05 + Math.random() * 1
    const filled = Math.random() * size
    const status = statuses[index % statuses.length]

    return {
      id: `order-${index + 1}`,
      symbol,
      side: index % 2 === 0 ? 'buy' : 'sell',
      type: types[index % types.length],
      size: Number(size.toFixed(4)),
      price: Number(price.toFixed(2)),
      filled: status === 'filled' ? size : Number(filled.toFixed(4)),
      status,
      timestamp: Date.now() - (index + 1) * 1800000
    }
  })
}

// Generate realistic price movement
export function updatePrices(): Record<string, number> {
  initializeIfNeeded()

  Object.keys(currentPrices).forEach(symbol => {
    const basePrice = basePrices[symbol]
    const volatility = volatilityFactors[symbol]
    const currentPrice = currentPrices[symbol]

    // Random walk with mean reversion
    const randomChange = (Math.random() - 0.5) * volatility * basePrice
    const meanReversion = (basePrice - currentPrice) * 0.001
    const newPrice = Math.max(currentPrice + randomChange + meanReversion, basePrice * 0.5)

    currentPrices[symbol] = newPrice

    // Keep price history (last 100 points)
    if (!priceHistory[symbol]) priceHistory[symbol] = []
    priceHistory[symbol].push(newPrice)
    if (priceHistory[symbol].length > 100) {
      priceHistory[symbol].shift()
    }
  })

  return { ...currentPrices }
}

// Generate market data with 24h changes
export function generateMarketData(): MarketData[] {
  initializeIfNeeded()
  const now = Date.now()

  return baseMarkets.map(market => {
    const currentPrice = currentPrices[market.symbol]
    const history = priceHistory[market.symbol] || [currentPrice]
    const price24hAgo = history.length > 24 ? history[history.length - 24] : history[0]

    const change24h = currentPrice - price24hAgo
    const changePercent24h = (change24h / price24hAgo) * 100
    const high24h = Math.max(...history.slice(-24))
    const low24h = Math.min(...history.slice(-24))
    const volume24h = Math.random() * 10000000 + 1000000 // Random volume between 1M-11M

    return {
      ...market,
      price: currentPrice,
      change24h,
      changePercent24h,
      volume24h,
      high24h,
      low24h,
      lastUpdate: now,
    }
  })
}

// Generate realistic order book
export function generateOrderBook(symbol: string, depth: number = 20): OrderBook {
  initializeIfNeeded()
  const currentPrice = currentPrices[symbol] || basePrices[symbol]
  const baseSpread = currentPrice * 0.0005 // 0.05% base spread

  const bids: OrderBookEntry[] = []
  const asks: OrderBookEntry[] = []

  let totalBids = 0
  let totalAsks = 0

  // Generate bids (below current price) - descending order
  for (let i = 0; i < depth; i++) {
    // Create tighter spreads near the mid price, wider spreads further away
    const priceStep = baseSpread * (1 + i * 0.15) // Increasing step size
    const price = currentPrice - (baseSpread + (i * priceStep))

    // Vary order sizes - larger orders further from mid price
    const baseSize = 0.5 + Math.random() * 3 // 0.5 to 3.5 base size
    const sizeMultiplier = 1 + (i * 0.2) // Larger orders deeper in book
    const size = baseSize * sizeMultiplier + (Math.random() * 2)

    totalBids += size

    bids.push({
      price: Number(price.toFixed(price > 1 ? 2 : 6)),
      size: Number(size.toFixed(4)),
      total: Number(totalBids.toFixed(4))
    })
  }

  // Generate asks (above current price) - ascending order  
  for (let i = 0; i < depth; i++) {
    // Create tighter spreads near the mid price, wider spreads further away
    const priceStep = baseSpread * (1 + i * 0.15) // Increasing step size
    const price = currentPrice + (baseSpread + (i * priceStep))

    // Vary order sizes - larger orders further from mid price
    const baseSize = 0.5 + Math.random() * 3 // 0.5 to 3.5 base size
    const sizeMultiplier = 1 + (i * 0.2) // Larger orders deeper in book
    const size = baseSize * sizeMultiplier + (Math.random() * 2)

    totalAsks += size

    asks.push({
      price: Number(price.toFixed(price > 1 ? 2 : 6)),
      size: Number(size.toFixed(4)),
      total: Number(totalAsks.toFixed(4))
    })
  }

  // Bids should be in descending price order (highest first)
  bids.sort((a, b) => b.price - a.price)

  // Asks should be in ascending price order (lowest first)
  asks.sort((a, b) => a.price - b.price)

  const spreadValue = asks[0].price - bids[0].price
  const spreadPercent = (spreadValue / currentPrice) * 100

  return {
    bids,
    asks,
    spread: Number(spreadValue.toFixed(6)),
    spreadPercent: Number(spreadPercent.toFixed(4))
  }
}

// Generate recent trades
export function generateRecentTrades(symbol: string, count: number = 50): Trade[] {
  initializeIfNeeded()
  const currentPrice = currentPrices[symbol] || basePrices[symbol]
  const trades: Trade[] = []
  const now = Date.now()

  for (let i = 0; i < count; i++) {
    const priceVariation = (Math.random() - 0.5) * currentPrice * 0.002
    const price = currentPrice + priceVariation
    const size = Math.random() * 5 + 0.01
    const side = Math.random() > 0.5 ? 'buy' : 'sell'
    const timestamp = now - (i * 1000 * Math.random() * 60) // Random times in last hour

    trades.push({
      id: `trade_${symbol}_${i}`,
      price: Number(price.toFixed(price > 1 ? 2 : 6)),
      size: Number(size.toFixed(4)),
      side,
      timestamp
    })
  }

  return trades.sort((a, b) => b.timestamp - a.timestamp) // Most recent first
}

// Generate candlestick data
export function generateCandleData(symbol: string, interval: string = '15m', count: number = 100): CandleData[] {
  initializeIfNeeded()
  const currentPrice = currentPrices[symbol] || basePrices[symbol]
  const candles: CandleData[] = []
  const now = Date.now()

  // Interval in milliseconds
  const intervalMs = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
  }[interval] || 15 * 60 * 1000

  let price = currentPrice * 0.95 // Start 5% below current

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = now - (i * intervalMs)
    const open = price

    // Generate realistic OHLC
    const volatility = volatilityFactors[symbol] || 0.02
    const change = (Math.random() - 0.5) * volatility * price
    const close = Math.max(price + change, price * 0.8)

    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5)
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5)
    const volume = Math.random() * 1000 + 100

    candles.push({
      timestamp,
      open: Number(open.toFixed(open > 1 ? 2 : 6)),
      high: Number(high.toFixed(high > 1 ? 2 : 6)),
      low: Number(low.toFixed(low > 1 ? 2 : 6)),
      close: Number(close.toFixed(close > 1 ? 2 : 6)),
      volume: Number(volume.toFixed(2))
    })

    price = close // Next candle starts where this one ended
  }

  return candles
}

// Mock positions and orders storage
let mockPositions: Position[] = []
let mockOrders: Order[] = []
let orderIdCounter = 1

// Add position
export function addPosition(position: Omit<Position, 'id' | 'timestamp'>): Position {
  const newPosition: Position = {
    ...position,
    id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now()
  }
  mockPositions.push(newPosition)
  return newPosition
}

// Add order
export function addOrder(order: Omit<Order, 'id' | 'timestamp' | 'filled'>): Order {
  const newOrder: Order = {
    ...order,
    id: `order_${orderIdCounter++}`,
    filled: 0,
    timestamp: Date.now()
  }
  mockOrders.push(newOrder)
  return newOrder
}

// Get positions
export function getPositions(): Position[] {
  return [...mockPositions]
}

// Get orders
export function getOrders(status?: Order['status']): Order[] {
  if (status) {
    return mockOrders.filter(order => order.status === status)
  }
  return [...mockOrders]
}

// Get trade history
export function getTradeHistory(): Order[] {
  return mockOrders.filter(order => order.status === 'filled').map(order => ({
    ...order,
    fee: Number((order.size * (order.price || 0) * 0.001).toFixed(4)) // 0.1% fee
  }))
}

// Update position P&L based on current market price
export function updatePositionsPnL(): Position[] {
  initializeIfNeeded()
  mockPositions = mockPositions.map(position => {
    const currentPrice = currentPrices[position.symbol] || position.markPrice
    const priceDiff = currentPrice - position.entryPrice
    const pnl = position.side === 'long'
      ? priceDiff * position.size * position.leverage
      : -priceDiff * position.size * position.leverage
    const pnlPercent = (pnl / (position.entryPrice * position.size)) * 100

    return {
      ...position,
      markPrice: currentPrice,
      pnl: Number(pnl.toFixed(2)),
      pnlPercent: Number(pnlPercent.toFixed(2))
    }
  })

  return [...mockPositions]
}

// Initialize with some sample data
export function initializeMockData() {
  initializeIfNeeded()
  // Add some sample positions
  addPosition({
    symbol: 'ETH-PERP',
    side: 'long',
    size: 1.5,
    entryPrice: 2850.00,
    markPrice: currentPrices['ETH-PERP'],
    pnl: 0,
    pnlPercent: 0,
    leverage: 3,
    margin: 1425.00
  })

  addPosition({
    symbol: 'BTC-PERP',
    side: 'short',
    size: 0.1,
    entryPrice: 68000.00,
    markPrice: currentPrices['BTC-PERP'],
    pnl: 0,
    pnlPercent: 0,
    leverage: 2,
    margin: 3400.00
  })

  // Add some sample orders
  addOrder({
    symbol: 'SOL-PERP',
    side: 'buy',
    type: 'limit',
    size: 10,
    price: 195.00,
    status: 'pending'
  })

  addOrder({
    symbol: 'AVAX-PERP',
    side: 'sell',
    type: 'limit',
    size: 25,
    price: 40.00,
    status: 'pending'
  })
}

// Portfolio calculation utilities
export interface PortfolioMetrics {
  totalEquity: number
  tradingEquity: number
  availableBalance: number
  totalPnl: number
  pnlPercentage: number
  baseBalance: number // Starting balance before trading
}

// Base balance constant (starting balance)
const BASE_BALANCE = 10000

// Get portfolio metrics from current positions
export function getPortfolioMetrics(): PortfolioMetrics {
  initializeIfNeeded()

  // Update positions P&L first
  const positions = updatePositionsPnL()

  // Calculate trading equity (sum of all position margins)
  const tradingEquity = positions.reduce((sum, pos) => sum + pos.margin, 0)

  // Calculate total unrealized P&L
  const totalPnl = positions.reduce((sum, pos) => sum + pos.pnl, 0)

  // Calculate P&L percentage (based on trading equity)
  const pnlPercentage = tradingEquity > 0 ? (totalPnl / tradingEquity) * 100 : 0

  // Available balance = base balance - trading equity (locked in positions)
  const availableBalance = Math.max(0, BASE_BALANCE - tradingEquity)

  // Total equity = base balance + unrealized P&L
  const totalEquity = BASE_BALANCE + totalPnl

  return {
    totalEquity: Number(totalEquity.toFixed(2)),
    tradingEquity: Number(tradingEquity.toFixed(2)),
    availableBalance: Number(availableBalance.toFixed(2)),
    totalPnl: Number(totalPnl.toFixed(2)),
    pnlPercentage: Number(pnlPercentage.toFixed(2)),
    baseBalance: BASE_BALANCE
  }
}

// Get portfolio chart data (equity over time)
// This simulates equity changes based on trading activity
export function getPortfolioChartData(): Array<{ time: string; value: number }> {
  initializeIfNeeded()

  const metrics = getPortfolioMetrics()
  const currentEquity = metrics.totalEquity

  // Generate 7 data points over 24 hours
  // Start from base balance and gradually approach current equity
  const dataPoints: Array<{ time: string; value: number }> = []
  const hours = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
  const baseBalance = metrics.baseBalance

  // Calculate the change from base to current
  const equityChange = currentEquity - baseBalance

  hours.forEach((time, index) => {
    // Gradually interpolate from base balance to current equity
    const progress = index / (hours.length - 1)
    // Add some realistic variation
    const variation = (Math.random() - 0.5) * Math.abs(equityChange) * 0.1
    const value = baseBalance + (equityChange * progress) + variation

    dataPoints.push({
      time,
      value: Number(Math.max(0, value).toFixed(2))
    })
  })

  return dataPoints
}
