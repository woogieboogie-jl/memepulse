import { NextResponse } from 'next/server'
import { createWalletClient, http, keccak256, encodePacked, defineChain } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { MEMECORE_NETWORK } from '@/lib/contracts'

// Use environment variable for private key
// Fallback to Anvil default key for local development only
const PRIVATE_KEY = process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

// MemeCore chain definition (from central config)
const memecoreTestnet = defineChain({
    id: MEMECORE_NETWORK.chainId,
    name: MEMECORE_NETWORK.chainName,
    nativeCurrency: MEMECORE_NETWORK.nativeCurrency,
    rpcUrls: {
        default: { http: [MEMECORE_NETWORK.rpcUrl] }
    },
    blockExplorers: {
        default: { name: 'MemeCoreScan', url: MEMECORE_NETWORK.blockExplorer }
    }
})

const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`)

const client = createWalletClient({
    account,
    chain: memecoreTestnet,
    transport: http()
})

export async function GET() {
    // Simulate fetching activity score (mock data)
    const mockPulse = {
        symbol: 'DOGE',
        price: 42000000, // 0.42 USD * 10^8
        volume: 1000,
        activityScore: Math.floor(Math.random() * 100), // Random score 0-100
        timestamp: Math.floor(Date.now() / 1000)
    }

    return NextResponse.json(mockPulse)
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { symbol, price, volume, activityScore, timestamp } = body

        // 1. Verify the data (e.g. check if price is within range, score is valid)
        // In a real app, we would re-fetch the data to verify it matches what the user claims,
        // or we would generate this data ourselves and just have the user request it.

        // 2. Sign the data
        // Matches Solidity: keccak256(abi.encodePacked(symbol, price, volume, activityScore, timestamp))
        // We need to encode the string "DOGE" carefully. Solidity string encoding is dynamic.
        // However, abi.encodePacked simply concatenates bytes.

        // Let's use viem's encodePacked
        const messageHash = keccak256(
            encodePacked(
                ['string', 'int256', 'uint256', 'uint256', 'uint256'],
                [symbol, BigInt(price), BigInt(volume), BigInt(activityScore), BigInt(timestamp)]
            )
        )

        const signature = await account.signMessage({
            message: { raw: messageHash }
        })

        return NextResponse.json({
            success: true,
            signature,
            payload: { symbol, price, volume, activityScore, timestamp }
        })

    } catch (error) {
        console.error('Pulse Error:', error)
        return NextResponse.json({ success: false, error: 'Failed to sign pulse' }, { status: 500 })
    }
}
