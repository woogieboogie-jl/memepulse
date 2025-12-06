/**
 * Memecoin Oracle Feed Contract Configuration
 * 
 * This file re-exports from the central contract registry.
 * DO NOT add addresses here - use lib/contracts.ts instead.
 */

import { 
  CONTRACTS, 
  MEMECORE_NETWORK, 
  MEMECOIN_INFO,
  getSupportedMemecoins as _getSupportedMemecoins,
  getMemecoinEmoji as _getMemecoinEmoji,
  getMemecoinName as _getMemecoinName,
  isMemecoinSupported as _isMemecoinSupported
} from './contracts';

// Re-export network config
export { MEMECORE_NETWORK };

// ============================================
// FEED CONTRACT INTERFACE
// ============================================

export interface MemecoinFeedContract {
  symbol: string;
  name: string;
  emoji: string;
  contractAddress: string;
  network: 'MemeCore';
  updateFrequency: string;
  chainId: number;
  rpcUrl: string;
}

// ============================================
// DERIVED FEED CONTRACTS
// ============================================

/**
 * Central registry of all supported memecoin oracle feed contracts.
 * Derived from lib/contracts.ts - the single source of truth.
 */
export const MEMECOIN_FEED_CONTRACTS: Record<string, MemecoinFeedContract> = 
  Object.entries(CONTRACTS.PRICE_FEEDS).reduce((acc, [symbol, address]) => {
    const info = MEMECOIN_INFO[symbol];
    acc[symbol] = {
      symbol,
      name: info?.name || symbol,
      emoji: info?.emoji || '🪙',
      contractAddress: address,
      network: 'MemeCore',
      updateFrequency: 'Every 5 minutes',
      chainId: MEMECORE_NETWORK.chainId,
      rpcUrl: MEMECORE_NETWORK.rpcUrl,
    };
    return acc;
  }, {} as Record<string, MemecoinFeedContract>);

// ============================================
// HELPER FUNCTIONS (Re-exports)
// ============================================

export const getSupportedMemecoins = _getSupportedMemecoins;
export const getMemecoinEmoji = _getMemecoinEmoji;
export const getMemecoinName = _getMemecoinName;
export const isMemecoinSupported = _isMemecoinSupported;

/**
 * Get feed contract for a specific memecoin
 */
export function getFeedContract(symbol: string): MemecoinFeedContract | undefined {
  return MEMECOIN_FEED_CONTRACTS[symbol.toUpperCase()];
}

/**
 * Get all feed contracts as an array
 */
export function getAllFeedContracts(): MemecoinFeedContract[] {
  return Object.values(MEMECOIN_FEED_CONTRACTS);
}
