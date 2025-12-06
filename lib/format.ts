/**
 * Price formatting utilities for consistent display across the app
 */

/**
 * Format a price value with appropriate decimal places
 * - Prices >= $1: 2 decimal places (e.g., $43,250.00)
 * - Prices < $1 but >= $0.0001: 4 decimal places (e.g., $0.1392)
 * - Prices < $0.0001: 8 decimal places (e.g., $0.00000350)
 */
export function formatPrice(price: number | null | undefined, options?: {
  minDecimals?: number
  maxDecimals?: number
  showCurrency?: boolean
}): string {
  if (price === null || price === undefined || isNaN(price)) {
    return '-'
  }

  const { showCurrency = false } = options || {}
  
  let formatted: string
  
  if (price >= 1000) {
    // Large numbers with commas
    formatted = price.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })
  } else if (price >= 1) {
    // Normal prices: 2 decimals
    formatted = price.toFixed(2)
  } else if (price >= 0.0001) {
    // Small prices: 4 decimals
    formatted = price.toFixed(4)
  } else if (price > 0) {
    // Very small prices: 8 decimals
    formatted = price.toFixed(8)
  } else {
    formatted = '0.00'
  }

  return showCurrency ? `$${formatted}` : formatted
}

/**
 * Format a percentage change with + prefix for positive values
 */
export function formatPercentChange(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '-'
  }
  
  const prefix = value >= 0 ? '+' : ''
  return `${prefix}${value.toFixed(2)}%`
}

/**
 * Format a large number with K/M/B suffixes
 */
export function formatCompactNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '-'
  }

  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`
  }
  
  return value.toFixed(2)
}

/**
 * Format volume in USD
 */
export function formatVolume(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '-'
  }
  
  return `$${formatCompactNumber(value)}`
}

