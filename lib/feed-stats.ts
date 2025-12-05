/**
 * Mock Feed Statistics Data
 * 
 * Statistics for each memecoin oracle feed including:
 * - Active agent count
 * - Update frequency
 * - Accuracy metrics
 * - Top contributors
 */

export interface FeedStats {
    symbol: string
    totalAgents: number
    updatesToday: number
    updateFrequency: number // updates per hour
    averageAccuracy: number
    currentPulse: number
    lastUpdate: string
    topContributors: {
        agentId: string
        agentName: string
        updates: number
        accuracy: number
    }[]
}

export const FEED_STATS: Record<string, FeedStats> = {
    DOGE: {
        symbol: 'DOGE',
        totalAgents: 24,
        updatesToday: 892,
        updateFrequency: 37.2,
        averageAccuracy: 98.4,
        currentPulse: 78,
        lastUpdate: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 min ago
        topContributors: [
            { agentId: '1', agentName: 'MoonDoge Alpha', updates: 342, accuracy: 99.1 },
            { agentId: '14', agentName: 'DogeWhale Pro', updates: 287, accuracy: 97.8 },
            { agentId: '15', agentName: 'ShibaDoge Elite', updates: 234, accuracy: 96.4 },
        ]
    },
    PEPE: {
        symbol: 'PEPE',
        totalAgents: 18,
        updatesToday: 674,
        updateFrequency: 28.1,
        averageAccuracy: 96.7,
        currentPulse: 62,
        lastUpdate: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        topContributors: [
            { agentId: '5', agentName: 'Pepe Trader', updates: 298, accuracy: 98.2 },
            { agentId: '16', agentName: 'FrogKing AI', updates: 245, accuracy: 96.1 },
            { agentId: '17', agentName: 'PepeWhale', updates: 131, accuracy: 95.4 },
        ]
    },
    SHIB: {
        symbol: 'SHIB',
        totalAgents: 15,
        updatesToday: 512,
        updateFrequency: 21.3,
        averageAccuracy: 94.2,
        currentPulse: 45,
        lastUpdate: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        topContributors: [
            { agentId: '18', agentName: 'ShibArmy Bot', updates: 187, accuracy: 96.8 },
            { agentId: '19', agentName: 'SHIB Sentinel', updates: 156, accuracy: 94.3 },
            { agentId: '20', agentName: 'ShibaScout', updates: 169, accuracy: 93.1 },
        ]
    },
    FLOKI: {
        symbol: 'FLOKI',
        totalAgents: 21,
        updatesToday: 823,
        updateFrequency: 34.3,
        averageAccuracy: 97.8,
        currentPulse: 85,
        lastUpdate: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        topContributors: [
            { agentId: '6', agentName: 'Floki Watcher', updates: 412, accuracy: 99.4 },
            { agentId: '21', agentName: 'VikingFloki AI', updates: 321, accuracy: 98.1 },
            { agentId: '22', agentName: 'FlokiPulse', updates: 90, accuracy: 96.7 },
        ]
    },
    WIF: {
        symbol: 'WIF',
        totalAgents: 12,
        updatesToday: 445,
        updateFrequency: 18.5,
        averageAccuracy: 95.1,
        currentPulse: 71,
        lastUpdate: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
        topContributors: [
            { agentId: '23', agentName: 'WIF Tracker', updates: 198, accuracy: 97.2 },
            { agentId: '24', agentName: 'DogWithHat AI', updates: 147, accuracy: 94.8 },
            { agentId: '25', agentName: 'WifWatcher', updates: 100, accuracy: 93.4 },
        ]
    },
    BONK: {
        symbol: 'BONK',
        totalAgents: 16,
        updatesToday: 587,
        updateFrequency: 24.5,
        averageAccuracy: 96.3,
        currentPulse: 73,
        lastUpdate: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
        topContributors: [
            { agentId: '26', agentName: 'BONK Oracle', updates: 267, accuracy: 98.5 },
            { agentId: '27', agentName: 'BonkBot Pro', updates: 213, accuracy: 96.7 },
            { agentId: '28', agentName: 'SolBonker', updates: 107, accuracy: 94.8 },
        ]
    },
    BTC: {
        symbol: 'BTC',
        totalAgents: 8,
        updatesToday: 312,
        updateFrequency: 13.0,
        averageAccuracy: 99.2,
        currentPulse: 92,
        lastUpdate: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
        topContributors: [
            { agentId: '29', agentName: 'BTC Sentinel', updates: 156, accuracy: 99.8 },
            { agentId: '30', agentName: 'BitcoinPulse', updates: 98, accuracy: 99.1 },
            { agentId: '31', agentName: 'BTCWatcher', updates: 58, accuracy: 98.7 },
        ]
    },
}

/**
 * Get feed stats for a specific memecoin
 */
export function getFeedStats(symbol: string): FeedStats | undefined {
    return FEED_STATS[symbol.toUpperCase()]
}

/**
 * Get time ago string from ISO timestamp
 */
export function getTimeAgo(isoString: string): string {
    const now = Date.now()
    const then = new Date(isoString).getTime()
    const diff = Math.floor((now - then) / 1000) // seconds

    if (diff < 60) return `${diff} seconds ago`
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
    return `${Math.floor(diff / 86400)} days ago`
}
