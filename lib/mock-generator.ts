// Pure functions for generating mock data

export const INITIAL_PRICES: Record<string, number> = {
  'BTC-PERP': 67234.50,
  'DOGE-PERP': 0.1456,
  'PEPE-PERP': 0.00001234,
  'SHIB-PERP': 0.00002456,
  'FLOKI-PERP': 0.00012345,
  'WIF-PERP': 2.34,
  'BONK-PERP': 0.000023,
}

export const VOLATILITY: Record<string, number> = {
  'BTC-PERP': 0.002, // Lower volatility
  'DOGE-PERP': 0.005,
  'PEPE-PERP': 0.008,
  'SHIB-PERP': 0.008,
  'FLOKI-PERP': 0.007,
  'WIF-PERP': 0.009,
  'BONK-PERP': 0.008,
}

export function generateNextPrice(currentPrice: number, symbol: string) {
  const vol = VOLATILITY[symbol] || 0.005
  const change = currentPrice * vol * (Math.random() - 0.5)
  // Mean reversion bias towards initial price to prevent drifting to zero or infinity
  const basePrice = INITIAL_PRICES[symbol] || currentPrice
  const reversion = (basePrice - currentPrice) * 0.001

  return Math.max(0.00000001, currentPrice + change + reversion)
}

export function generateCandle(open: number, symbol: string, intervalSeconds: number) {
  const vol = (VOLATILITY[symbol] || 0.005) * Math.sqrt(intervalSeconds / 60)
  const close = open * (1 + (Math.random() - 0.5) * vol)
  const high = Math.max(open, close) * (1 + Math.random() * vol * 0.5)
  const low = Math.min(open, close) * (1 - Math.random() * vol * 0.5)
  const volume = Math.random() * 1000000

  return { open, high, low, close, volume, timestamp: Date.now() }
}
