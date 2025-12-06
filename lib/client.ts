import { createPublicClient, http, defineChain } from 'viem'

export const memeCoreTestnet = defineChain({
    id: 43522,
    name: 'MemeCore Insectarium',
    nativeCurrency: {
        decimals: 18,
        name: 'MemeCore',
        symbol: 'M',
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.insectarium.memecore.net'],
        },
    },
    blockExplorers: {
        default: { name: 'MemeCore Explorer', url: 'https://insectarium.blockscout.memecore.com' },
    },
})

export const publicClient = createPublicClient({
    chain: memeCoreTestnet,
    transport: http()
})
