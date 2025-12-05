/**
 * Mock Oracle Update History
 * 
 * Recent oracle submissions showing pulse value changes,
 * agent contributions, and transaction confirmations.
 */

export interface OracleUpdate {
    id: string
    agentId: string
    agentName: string
    memecoin: string
    previousPulse: number
    newPulse: number
    timestamp: string
    txHash: string
    status: 'success' | 'pending' | 'failed'
}

/**
 * Generate mock recent updates for a memecoin
 */
function generateRecentUpdates(memecoin: string, count: number = 20): OracleUpdate[] {
    const updates: OracleUpdate[] = []
    const now = Date.now()

    // Agent names by memecoin
    const agentNames: Record<string, string[]> = {
        DOGE: ['MoonDoge Alpha', 'DogeWhale Pro', 'ShibaDoge Elite', 'DOGE Pulse'],
        PEPE: ['Pepe Trader', 'FrogKing AI', 'PepeWhale', 'PEPE Pulse'],
        SHIB: ['ShibArmy Bot', 'SHIB Sentinel', 'ShibaScout', 'SHIB Pulse'],
        FLOKI: ['Floki Watcher', 'VikingFloki AI', 'FlokiPulse', 'FLOKI Pulse'],
        WIF: ['WIF Tracker', 'DogWithHat AI', 'WifWatcher', 'WIF Pulse'],
        BONK: ['BONK Oracle', 'BonkBot Pro', 'SolBonker', 'BONK Pulse'],
        BTC: ['BTC Sentinel', 'BitcoinPulse', 'BTCWatcher', 'BTC Pulse (KOL)'],
    }

    const agents = agentNames[memecoin] || ['Generic Agent 1', 'Generic Agent 2']
    let pulse = 75 + Math.floor(Math.random() * 20) // Start between 75-95

    for (let i = 0; i < count; i++) {
        const minutesAgo = i * 5 + Math.floor(Math.random() * 3) // Every ~5 min
        const previousPulse = pulse
        const change = Math.floor(Math.random() * 5) - 2 // -2 to +2
        pulse = Math.max(30, Math.min(100, pulse + change))

        updates.push({
            id: `${memecoin}-${i}`,
            agentId: `agent-${i % 4}`,
            agentName: agents[i % agents.length],
            memecoin,
            previousPulse,
            newPulse: pulse,
            timestamp: new Date(now - minutesAgo * 60 * 1000).toISOString(),
            txHash: `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`,
            status: i === 0 && Math.random() > 0.8 ? 'pending' : 'success',
        })
    }

    return updates
}

/**
 * Get recent oracle updates for a memecoin
 */
export function getRecentUpdates(memecoin: string, limit: number = 50): OracleUpdate[] {
    return generateRecentUpdates(memecoin, limit)
}

/**
 * Get all recent oracle updates across all memecoins
 */
export function getAllRecentUpdates(limit: number = 100): OracleUpdate[] {
    const memecoins = ['DOGE', 'PEPE', 'SHIB', 'FLOKI', 'WIF', 'BONK', 'BTC']
    const allUpdates: OracleUpdate[] = []

    memecoins.forEach(memecoin => {
        allUpdates.push(...generateRecentUpdates(memecoin, 15))
    })

    // Sort by timestamp descending
    return allUpdates
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)
}
