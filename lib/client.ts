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
        default: { name: 'MemeCoreScan', url: 'https://formicarium.memecorescan.io' },
    },
})

export const publicClient = createPublicClient({
    chain: memeCoreTestnet,
    transport: http()
})
