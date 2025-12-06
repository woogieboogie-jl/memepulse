'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { publicClient, memeCoreTestnet } from '@/lib/client'
import { CONTRACTS, ABIS } from '@/lib/contracts'
import { formatUnits } from 'viem'
import { createWalletClient, custom } from 'viem'

// --- Types ---
type Address = `0x${string}`

// --- Hooks ---

/**
 * Fetches the credibility score of an agent from the AgentRegistry.
 * Returns a number between 0-100 (derived from basis points).
 */
export function useCredibility(agentAddress?: string) {
    const { data, isError, isLoading } = useQuery({
        queryKey: ['credibility', agentAddress],
        queryFn: async () => {
            if (!agentAddress) return BigInt(0)
            return await publicClient.readContract({
                address: CONTRACTS.AGENT_REGISTRY as Address,
                abi: ABIS.AGENT_REGISTRY,
                functionName: 'getCredibility',
                args: [agentAddress as Address]
            }) as bigint
        },
        enabled: !!agentAddress,
    })

    // Convert basis points (0-10000) to percentage (0-100)
    const credibility = data ? Number(data) / 100 : 0

    return { credibility, isError, isLoading }
}

/**
 * Fetches the latest price from a specific memecoin PriceFeed.
 * Returns the price as a formatted number, or null if no data exists.
 * Also returns hasData flag to indicate if oracle has been activated.
 */
export function useOraclePrice(symbol: keyof typeof CONTRACTS.PRICE_FEEDS) {
    const feedAddress = CONTRACTS.PRICE_FEEDS[symbol]

    const { data, isError, isLoading } = useQuery({
        queryKey: ['oraclePrice', symbol],
        queryFn: async () => {
            if (!feedAddress) return undefined
            return await publicClient.readContract({
                address: feedAddress as Address,
                abi: ABIS.PRICE_FEED,
                functionName: 'latestRoundData'
            }) as [bigint, bigint, bigint, bigint, bigint]
        },
        enabled: !!feedAddress,
        refetchInterval: 5000, // Auto-refresh every 5s
    })

    // data = [roundId, answer, startedAt, updatedAt, answeredInRound]
    const result = data
    const rawPrice = result ? result[1] : undefined
    const updatedAt = result ? Number(result[3]) : undefined
    const roundId = result ? Number(result[0]) : 0

    // Check if feed has data (roundId > 0 means at least one update)
    const hasData = roundId > 0 && rawPrice !== undefined && rawPrice > 0n

    // Assuming 8 decimals for all feeds (standard Chainlink/MemePulse)
    const price = hasData && rawPrice ? Number(formatUnits(rawPrice, 8)) : null

    return { price, rawPrice, updatedAt, hasData, isError, isLoading }
}

/**
 * Fetches the current epoch from MTokenDistributor.
 */
export function useCurrentEpoch() {
    const { data, isError, isLoading } = useQuery({
        queryKey: ['currentEpoch'],
        queryFn: async () => {
            return await publicClient.readContract({
                address: CONTRACTS.M_TOKEN_DISTRIBUTOR as Address,
                abi: ABIS.M_TOKEN_DISTRIBUTOR,
                functionName: 'currentEpoch'
            }) as bigint
        },
        refetchInterval: 60000, // Refresh every minute
    })

    return {
        currentEpoch: data ? Number(data) : 1,
        isError,
        isLoading
    }
}

/**
 * Fetches mining stats for an agent from the MTokenDistributor.
 * Uses getCurrentEpochStats which returns (updates, volume, credibility).
 */
export function useMiningStats(agentAddress?: string) {
    const { data, isError, isLoading } = useQuery({
        queryKey: ['miningStats', agentAddress],
        queryFn: async () => {
            if (!agentAddress) return null
            try {
                const result = await publicClient.readContract({
                    address: CONTRACTS.M_TOKEN_DISTRIBUTOR as Address,
                    abi: ABIS.M_TOKEN_DISTRIBUTOR,
                    functionName: 'getCurrentEpochStats',
                    args: [agentAddress as Address]
                }) as [bigint, bigint, bigint]
                return {
                    updates: result[0],
                    volume: result[1],
                    credibility: result[2]
                }
            } catch {
                // If agent hasn't contributed, return zeros
                return { updates: 0n, volume: 0n, credibility: 0n }
            }
        },
        enabled: !!agentAddress,
        refetchInterval: 30000, // Refresh every 30s
    })

    const hasData = data && (data.updates > 0n || data.volume > 0n)

    return {
        updates: data ? Number(data.updates) : 0,
        volume: data ? Number(formatUnits(data.volume, 8)) : 0, // Volume in 8 decimals
        credibility: data ? Number(data.credibility) / 100 : 0, // Basis points to %
        hasData,
        isLoading,
        isError
    }
}

/**
 * Fetches time until next epoch from MTokenDistributor.
 */
export function useTimeUntilNextEpoch() {
    const { data, isError, isLoading } = useQuery({
        queryKey: ['timeUntilNextEpoch'],
        queryFn: async () => {
            return await publicClient.readContract({
                address: CONTRACTS.M_TOKEN_DISTRIBUTOR as Address,
                abi: ABIS.M_TOKEN_DISTRIBUTOR,
                functionName: 'getTimeUntilNextEpoch'
            }) as bigint
        },
        refetchInterval: 60000, // Refresh every minute
    })

    return {
        secondsRemaining: data ? Number(data) : 0,
        isError,
        isLoading
    }
}

/**
 * Fetches wM token balance for an address.
 */
export function useWMBalance(address?: string) {
    const { data, isError, isLoading, refetch } = useQuery({
        queryKey: ['wmBalance', address],
        queryFn: async () => {
            if (!address) return 0n
            return await publicClient.readContract({
                address: CONTRACTS.WM_TOKEN as Address,
                abi: ABIS.WM_TOKEN,
                functionName: 'balanceOf',
                args: [address as Address]
            }) as bigint
        },
        enabled: !!address,
        refetchInterval: 10000, // Refresh every 10s
    })

    return {
        balance: data ? Number(formatUnits(data, 18)) : 0,
        rawBalance: data ?? 0n,
        isError,
        isLoading,
        refetch
    }
}

/**
 * Fetches aggregated stats for a feed from the Aggregator contract.
 * Returns update count (active agents would need separate tracking).
 */
export function useAggregatorStats(symbol: string) {
    const aggregatorAddress = CONTRACTS.AGGREGATOR

    const { data: updateCount, isLoading: isUpdatesLoading } = useQuery({
        queryKey: ['aggregatorUpdates', symbol],
        queryFn: async () => {
            if (!aggregatorAddress) return 0n
            try {
                return await publicClient.readContract({
                    address: aggregatorAddress as Address,
                    abi: ABIS.AGGREGATOR,
                    functionName: 'getUpdateCount',
                    args: [symbol]
                }) as bigint
            } catch {
                return 0n
            }
        },
        enabled: !!aggregatorAddress,
        refetchInterval: 30000,
    })

    const hasData = updateCount !== undefined && updateCount > 0n

    return {
        dailyUpdates: updateCount ? Number(updateCount) : 0,
        hasData,
        isLoading: isUpdatesLoading
    }
}

/**
 * Claims mined $M tokens for a specific epoch.
 * Uses window.ethereum to sign the transaction.
 */
export function useClaimRewards() {
    return useMutation({
        mutationFn: async ({ epoch }: { epoch: number }) => {
            if (typeof window === 'undefined' || !window.ethereum) {
                throw new Error('No wallet found')
            }

            const walletClient = createWalletClient({
                chain: memeCoreTestnet,
                transport: custom(window.ethereum)
            })

            const [account] = await walletClient.requestAddresses()

            // claimRewards(uint256 epoch) - claims rewards for msg.sender for specific epoch
            const hash = await walletClient.writeContract({
                address: CONTRACTS.M_TOKEN_DISTRIBUTOR as Address,
                abi: ABIS.M_TOKEN_DISTRIBUTOR,
                functionName: 'claimRewards',
                args: [BigInt(epoch)],
                account
            })

            return hash
        }
    })
}

/**
 * Fetches claimable rewards for an agent in a specific epoch.
 */
export function useClaimableRewards(agentAddress?: string, epoch?: number) {
    const { data, isError, isLoading } = useQuery({
        queryKey: ['claimableRewards', agentAddress, epoch],
        queryFn: async () => {
            if (!agentAddress || epoch === undefined) return 0n
            try {
                return await publicClient.readContract({
                    address: CONTRACTS.M_TOKEN_DISTRIBUTOR as Address,
                    abi: ABIS.M_TOKEN_DISTRIBUTOR,
                    functionName: 'getClaimableRewards',
                    args: [agentAddress as Address, BigInt(epoch)]
                }) as bigint
            } catch {
                return 0n
            }
        },
        enabled: !!agentAddress && epoch !== undefined && epoch > 0,
    })

    return {
        claimable: data ? Number(formatUnits(data, 18)) : 0,
        rawClaimable: data ?? 0n,
        isError,
        isLoading
    }
}

/**
 * Fetches epoch total volume from MTokenDistributor.
 */
export function useEpochTotalVolume(epoch?: number) {
    const { data, isError, isLoading } = useQuery({
        queryKey: ['epochTotalVolume', epoch],
        queryFn: async () => {
            if (epoch === undefined) return 0n
            try {
                return await publicClient.readContract({
                    address: CONTRACTS.M_TOKEN_DISTRIBUTOR as Address,
                    abi: ABIS.M_TOKEN_DISTRIBUTOR,
                    functionName: 'epochTotalVolume',
                    args: [BigInt(epoch)]
                }) as bigint
            } catch {
                return 0n
            }
        },
        enabled: epoch !== undefined,
        refetchInterval: 30000,
    })

    return {
        totalVolume: data ? Number(formatUnits(data, 8)) : 0,
        hasData: data !== undefined && data > 0n,
        isError,
        isLoading
    }
}
