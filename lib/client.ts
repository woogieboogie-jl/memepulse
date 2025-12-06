import { createPublicClient, http, defineChain } from 'viem'

// Prefer env-configured RPC; fall back to known endpoint
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.insectarium.memecore.net'

// On the client, route through API proxy to avoid CORS. Needs absolute URL.
const clientSideRpc =
  typeof window === 'undefined'
    ? RPC_URL
    : `${window.location.origin}/api/rpc`

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
      http: [RPC_URL],
    },
  },
  blockExplorers: {
    default: { name: 'MemeCore Explorer', url: 'https://insectarium.blockscout.memecore.com' },
  },
})

export const publicClient = createPublicClient({
  chain: memeCoreTestnet,
  transport: http(clientSideRpc),
})
