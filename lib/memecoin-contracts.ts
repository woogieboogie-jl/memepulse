/**
 * Memecoin Oracle Feed Contract Configuration
 * 
 * Each memecoin has a dedicated oracle feed contract where AI agents
 * contribute social pulse data and earn $M tokens.
 */

export interface MemecoinFeedContract {
    symbol: string
    name: string
    emoji: string
    contractAddress: string
    network: 'Ethereum' | 'Base' | 'Arbitrum'
    updateFrequency: string
    chainId: number
}

/**
 * Central registry of all supported memecoin oracle feed contracts
 */
export const MEMECOIN_FEED_CONTRACTS: Record<string, MemecoinFeedContract> = {
    DOGE: {
        symbol: 'DOGE',
        name: 'Dogecoin',
        emoji: '🐕',
        contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        network: 'Ethereum',
        updateFrequency: 'Every 5 minutes',
        chainId: 1,
    },
    PEPE: {
        symbol: 'PEPE',
        name: 'Pepe',
        emoji: '🐸',
        contractAddress: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
        network: 'Ethereum',
        updateFrequency: 'Every 5 minutes',
        chainId: 1,
    },
    SHIB: {
        symbol: 'SHIB',
        name: 'Shiba Inu',
        emoji: '🐕‍🦺',
        contractAddress: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
        network: 'Ethereum',
        updateFrequency: 'Every 5 minutes',
        chainId: 1,
    },
    FLOKI: {
        symbol: 'FLOKI',
        name: 'Floki',
        emoji: '🐺',
        contractAddress: '0xcf0C122c6b73ff809C693DB761e7BaeBe62b6a2E',
        network: 'Ethereum',
        updateFrequency: 'Every 5 minutes',
        chainId: 1,
    },
    WIF: {
        symbol: 'WIF',
        name: 'dogwifhat',
        emoji: '🎩',
        contractAddress: '0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36',
        network: 'Ethereum',
        updateFrequency: 'Every 5 minutes',
        chainId: 1,
    },
    BONK: {
        symbol: 'BONK',
        name: 'Bonk',
        emoji: '💥',
        contractAddress: '0xDeDC5E5d2d9B94991f8E86B46F6EC0FDE1D3C813',
        network: 'Ethereum',
        updateFrequency: 'Every 5 minutes',
        chainId: 1,
    },
    BTC: {
        symbol: 'BTC',
        name: 'Bitcoin',
        emoji: '₿',
        contractAddress: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
        network: 'Ethereum',
        updateFrequency: 'Every 5 minutes',
        chainId: 1,
    },
}

/**
 * Get all supported memecoin symbols
 */
export function getSupportedMemecoins(): string[] {
    return Object.keys(MEMECOIN_FEED_CONTRACTS)
}

/**
 * Get feed contract for a specific memecoin
 */
export function getFeedContract(symbol: string): MemecoinFeedContract | undefined {
    return MEMECOIN_FEED_CONTRACTS[symbol.toUpperCase()]
}

/**
 * Get all feed contracts as an array
 */
export function getAllFeedContracts(): MemecoinFeedContract[] {
    return Object.values(MEMECOIN_FEED_CONTRACTS)
}

/**
 * Check if a memecoin is supported
 */
export function isMemecoinSupported(symbol: string): boolean {
    return symbol.toUpperCase() in MEMECOIN_FEED_CONTRACTS
}

/**
 * Get memecoin emoji
 */
export function getMemecoinEmoji(symbol: string): string {
    return MEMECOIN_FEED_CONTRACTS[symbol.toUpperCase()]?.emoji || '🪙'
}

/**
 * Get memecoin name
 */
export function getMemecoinName(symbol: string): string {
    return MEMECOIN_FEED_CONTRACTS[symbol.toUpperCase()]?.name || symbol
}
