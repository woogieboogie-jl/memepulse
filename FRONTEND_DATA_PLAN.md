# MemePulse Frontend Data Layer - Complete Implementation Plan

**Objective:** Ship a production-ready frontend before AI agent integration, with all data flows mapped, real contract reads, proper caching, and hydration strategies.

---

## 📊 Executive Summary

### Current State
| Category | Status | Notes |
|----------|--------|-------|
| **Zustand Stores** | ✅ Implemented | market-store.ts, user-store.ts |
| **React Query Hooks** | ⚠️ Partial | Contract reads exist but some hooks use mock data |
| **Contract Reads** | ⚠️ Partial | `useOraclePrice` works, others need real implementation |
| **Contract Writes** | ⚠️ Stub | `claimRewards` exists but needs full flow |
| **Mock Data** | ⚠️ Heavy | Most components use hardcoded/generated mock data |
| **Hydration** | ⚠️ Issues | Some SSR/CSR mismatches possible |

### Priority Matrix
| Priority | Task | Impact |
|----------|------|--------|
| 🔴 Critical | GlobalTicker - needs real oracle prices | User-facing, broken without |
| 🔴 Critical | PulseCard/OracleFeed - hardcoded mock data | Main oracle page broken |
| 🟠 High | PoMGauge - hardcoded APR values | Misleading if fake |
| 🟠 High | NavHeader $M balance - hardcoded | User sees fake balance |
| 🟡 Medium | Agent pages - mock agent data | Demo acceptable |
| 🟡 Medium | Trading page - simulated data | Orderly handles this later |

---

## 🗂️ Component-by-Component Data Audit

### 1. GLOBAL COMPONENTS (layout.tsx)

#### `GlobalTicker` - Price Band
**File:** `components/global-ticker.tsx`

| Data Required | Current Source | Target Source | Action |
|---------------|----------------|---------------|--------|
| Live prices (BTC, DOGE, PEPE, etc.) | `useOraclePrice()` ✅ | Real PriceFeed contracts | ✅ DONE |
| 24h change % | Mock random | **NEEDS: Event indexer or API** | 🔴 TODO |

**Current Implementation:**
```typescript
// ✅ Good - reads from real contracts
const { price, isLoading } = useOraclePrice(symbol)
// ❌ Bad - mock change
const mockChange = (Math.random() * 10) - 5 // Commented out but structure exists
```

**Proposed Fix:**
1. **Option A (Hackathon):** Store last price in Zustand, calculate change client-side
2. **Option B (Production):** Index `VWAPCalculated` events from Aggregator contract

**Data Flow:**
```
PriceFeed.sol → useOraclePrice() → Zustand(optional) → GlobalTicker
                    ↑
              React Query (5s cache)
```

---

#### `NavHeader` - $M Token Balance
**File:** `components/nav-header.tsx`

| Data Required | Current Source | Target Source | Action |
|---------------|----------------|---------------|--------|
| User $M balance | Hardcoded `1,240` | MToken contract | 🔴 TODO |
| Registration status | localStorage | localStorage | ✅ OK |
| Key expiry status | localStorage | localStorage | ✅ OK |

**Current Implementation:**
```typescript
// Line 173-176: HARDCODED!
<span className="text-sm font-bold text-primary">1,240</span>
<span className="text-xs text-muted-foreground">$M</span>
```

**Proposed Fix:**
```typescript
// Add new hook: hooks/use-m-token-balance.ts
export function useMTokenBalance(address?: string) {
  return useQuery({
    queryKey: ['mTokenBalance', address],
    queryFn: async () => {
      if (!address) return BigInt(0)
      return await publicClient.readContract({
        address: CONTRACTS.M_TOKEN as Address,
        abi: ['function balanceOf(address) view returns (uint256)'],
        functionName: 'balanceOf',
        args: [address]
      })
    },
    enabled: !!address,
    staleTime: 30_000 // 30s cache
  })
}
```

---

### 2. ORACLE PAGE (`/oracle`)

#### `OracleFeed` - Main Oracle Dashboard
**File:** `components/oracle-feed.tsx`

| Data Required | Current Source | Target Source | Action |
|---------------|----------------|---------------|--------|
| Memecoin list | Hardcoded array (line 17-87) | Config + contracts | 🔴 TODO |
| Price per coin | Props passed | `useOraclePrice()` | ⚠️ Indirect |
| Social Score | Hardcoded | Contract (credibility proxy) | 🔴 TODO |
| Mining APY | Hardcoded | MTokenDistributor | 🔴 TODO |
| 24h Volume | Hardcoded | Aggregator events | 🟠 TODO |

**Current Implementation:**
```typescript
// Lines 17-87: ENTIRE DATA IS HARDCODED MOCK!
const MEMECOIN_ORACLE_DATA: PulseCardProps[] = [
    {
        memecoin: 'Dogecoin',
        symbol: 'DOGE',
        currentPrice: 0.085, // FAKE
        socialScore: 78,     // FAKE
        miningAPY: 45,       // FAKE
        ...
    },
    // ... more hardcoded data
]
```

**Proposed Fix:**
```typescript
// Create: lib/memecoin-config.ts
export const SUPPORTED_MEMECOINS = [
  { symbol: 'DOGE', name: 'Dogecoin', emoji: '🐕' },
  { symbol: 'PEPE', name: 'Pepe', emoji: '🐸' },
  // ... from CONTRACTS.PRICE_FEEDS keys
]

// Update OracleFeed to fetch live data
function OracleFeed() {
  const symbols = Object.keys(CONTRACTS.PRICE_FEEDS)
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {symbols.map((symbol) => (
        <PulseCard key={symbol} symbol={symbol} />
      ))}
    </div>
  )
}
```

---

#### `PulseCard` - Individual Oracle Card
**File:** `components/pulse-card.tsx`

| Data Required | Current Source | Target Source | Status |
|---------------|----------------|---------------|--------|
| Price | `useOraclePrice()` ✅ | Real contracts | ✅ DONE |
| Social Score | `useAggregatorStats()` | Mock → needs real | 🔴 TODO |
| Mining APY | Props (hardcoded) | MTokenDistributor | 🔴 TODO |
| 24h Volume | `useAggregatorStats()` | Mock → needs real | 🟠 TODO |
| 24h Price Change | Props (hardcoded) | Price history | 🟠 TODO |
| Last Update Time | `updatedAt` from contract ✅ | Real | ✅ DONE |

**Good Pattern Already in Use:**
```typescript
// Line 41-42: Actually reads from contracts!
const { price: livePrice, updatedAt } = useOraclePrice(symbol)
const { stats } = useAggregatorStats(symbol)
```

**Problem:** `useAggregatorStats` returns mock data:
```typescript
// hooks/use-aggregator-stats.ts - Line 31-43: ALL MOCK!
setStats({
    volume24h: mockVolume,           // FAKE
    sentiment: mockSentiment,         // FAKE
    activeAgents: mockAgents,         // FAKE
    updatesToday: mockAgents * 24,   // FAKE
    avgAccuracy: 92.5                // FAKE
})
```

---

#### `TradingEventFeed` - Live Mining Events
**File:** `components/trading-event-feed.tsx`

| Data Required | Current Source | Target Source | Action |
|---------------|----------------|---------------|--------|
| Mining events | Hardcoded array (line 19-47) | Contract events | 🟠 TODO |

**Current Implementation:**
```typescript
// Lines 19-47: HARDCODED FAKE EVENTS!
const [events, setEvents] = useState<TradingEvent[]>([
    { user: '0x1234...5678', memecoin: 'DOGE', amount: 50, ... },
    // ... more fake events
])
```

**Proposed Fix:**
```typescript
// Subscribe to MTokenDistributor RewardDistributed events
const { data: events } = useQuery({
  queryKey: ['miningEvents'],
  queryFn: async () => {
    const logs = await publicClient.getLogs({
      address: CONTRACTS.M_TOKEN_DISTRIBUTOR,
      event: parseAbiItem('event RewardDistributed(address indexed agent, uint256 amount)'),
      fromBlock: 'latest'  // or last 100 blocks
    })
    return logs.map(formatEvent)
  },
  refetchInterval: 10_000
})
```

---

### 3. TRADE PAGE (`/trade`)

#### `TradingChart` - Candlestick Chart
**File:** `components/trading-chart.tsx`

| Data Required | Current Source | Target Source | Action |
|---------------|----------------|---------------|--------|
| OHLCV candles | `generateCandleData()` mock | Orderly API (later) | ⏳ AI Agent |
| Current price | `chartData[last].close` | Orderly or Oracle | ⏳ AI Agent |

**Note:** This will be handled by Orderly integration (colleague's work).

---

#### `OrderBook` - Bid/Ask Depth
**File:** `components/order-book.tsx`

| Data Required | Current Source | Target Source | Action |
|---------------|----------------|---------------|--------|
| Bids/Asks | `generateOrderBook()` mock | Orderly WebSocket | ⏳ AI Agent |

**Note:** Orderly Network provides real order book data.

---

#### `TradeFeed` - Recent Trades
**File:** `components/trade-feed.tsx`

| Data Required | Current Source | Target Source | Action |
|---------------|----------------|---------------|--------|
| Recent trades | `generateRecentTrades()` mock | Orderly WebSocket | ⏳ AI Agent |

---

#### `PoMGauge` - Mining Rewards Widget
**File:** `components/pom-gauge.tsx`

| Data Required | Current Source | Target Source | Action |
|---------------|----------------|---------------|--------|
| 24h Volume | Hardcoded `124500` | MTokenDistributor | 🔴 TODO |
| Distribution Rate | Hardcoded `0.05` | ProtocolConfig | 🔴 TODO |
| Next Epoch Time | Hardcoded `"04:12:30"` | ProtocolConfig | 🔴 TODO |

**Current Implementation:**
```typescript
// Lines 9-13: ALL HARDCODED!
const volume24h = 124500
const distributionRate = 0.05
const estimatedRewards = volume24h * distributionRate
const nextEpoch = "04:12:30"
```

**Proposed Fix:**
```typescript
// Create: hooks/use-pom-stats.ts
export function usePoMStats() {
  const { data: config } = useQuery({
    queryKey: ['protocolConfig'],
    queryFn: async () => ({
      epochDuration: await publicClient.readContract({
        address: CONTRACTS.PROTOCOL_CONFIG,
        abi: ['function epochDuration() view returns (uint256)'],
        functionName: 'epochDuration'
      }),
      rewardRate: await publicClient.readContract({
        address: CONTRACTS.PROTOCOL_CONFIG,
        abi: ['function rewardPerVolume() view returns (uint256)'],
        functionName: 'rewardPerVolume'
      })
    }),
    staleTime: 60_000
  })
  
  return { ...config, nextEpochIn: calculateTimeToNextEpoch(config?.epochDuration) }
}
```

---

#### `MarketList` - Sidebar Asset List
**File:** `components/market-list.tsx`

| Data Required | Current Source | Target Source | Action |
|---------------|----------------|---------------|--------|
| Market list | `generateMarketData()` mock | Config + Oracle | 🟡 TODO |
| Prices | Mock generator | Zustand or Oracle | 🟡 TODO |
| 24h change | Mock generator | Price history | 🟡 TODO |

---

### 4. MY AGENTS PAGE (`/my-agents`)

#### `AgentCard` - Agent Overview Cards
**File:** `components/agent-card.tsx`

| Data Required | Current Source | Target Source | Action |
|---------------|----------------|---------------|--------|
| Agent list | `getUserAgents()` mock | AgentRegistry + localStorage | 🟡 TODO |
| Social Score | `useCredibility()` ⚠️ | Real but agent address undefined | 🔴 FIX |
| $M Mined | `useMiningStats()` ⚠️ | Real but agent address undefined | 🔴 FIX |
| Performance data | Mock array | Backend/localStorage | 🟡 Later |

**Issue:** Hooks exist but `agent.address` is often undefined:
```typescript
// Line 85-86
const { unclaimed } = useMiningStats(address)  // address often undefined!
```

**Fix:** Ensure agents created via `/create` store their wallet address.

---

#### `PortfolioOverview` - Portfolio Chart
**File:** `components/portfolio-overview.tsx`

| Data Required | Current Source | Target Source | Action |
|---------------|----------------|---------------|--------|
| Total Equity | `getPortfolioMetrics()` mock | User positions | ✅ OK (simulated) |
| Chart data | `getPortfolioChartData()` mock | Historical equity | 🟡 Later |
| Sharpe/WinRate | Hardcoded | Backend/calculated | 🟡 Later |

---

### 5. AGENT DETAIL PAGE (`/agent/[id]`)

| Data Required | Current Source | Target Source | Action |
|---------------|----------------|---------------|--------|
| Agent data | `getAgentById()` mock | AgentRegistry + localStorage | 🟡 Later |
| Credibility | `useCredibility()` ✅ | Real contracts | ✅ DONE |
| Mining stats | `useMiningStats()` ✅ | Real contracts | ✅ DONE |
| Performance chart | Mock array | Backend | 🟡 Later |
| Positions | Mock array | Orderly | ⏳ AI Agent |
| Trade history | Mock array | Orderly | ⏳ AI Agent |
| Reasoning log | Mock array | Backend | 🟡 Later |

---

## 🔧 Implementation Roadmap

### Phase 1: Critical Fixes (Before Ship) ⏰ 1-2 days

#### 1.1 Create `useMTokenBalance` Hook
```typescript
// hooks/use-m-token-balance.ts
import { useQuery } from '@tanstack/react-query'
import { publicClient } from '@/lib/client'
import { CONTRACTS } from '@/lib/contracts'
import { formatUnits } from 'viem'

export function useMTokenBalance(address?: string) {
  return useQuery({
    queryKey: ['mTokenBalance', address],
    queryFn: async () => {
      if (!address) return 0
      const balance = await publicClient.readContract({
        address: CONTRACTS.M_TOKEN as `0x${string}`,
        abi: [{ 
          name: 'balanceOf',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ type: 'uint256' }]
        }],
        functionName: 'balanceOf',
        args: [address as `0x${string}`]
      })
      return Number(formatUnits(balance as bigint, 18))
    },
    enabled: !!address,
    staleTime: 30_000
  })
}
```

#### 1.2 Fix NavHeader $M Balance
```typescript
// components/nav-header.tsx - Update lines 170-177
const { address } = useWallet()
const { data: mBalance = 0 } = useMTokenBalance(address)

// Replace hardcoded 1,240 with:
<span className="text-sm font-bold text-primary">
  {mBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
</span>
```

#### 1.3 Remove Hardcoded OracleFeed Data
```typescript
// components/oracle-feed.tsx - Complete rewrite
'use client'

import { CONTRACTS } from '@/lib/contracts'
import { PulseCard } from './pulse-card'

const MEMECOIN_CONFIG = {
  BTC: { name: 'Bitcoin', emoji: '₿' },
  DOGE: { name: 'Dogecoin', emoji: '🐕' },
  PEPE: { name: 'Pepe', emoji: '🐸' },
  SHIB: { name: 'Shiba Inu', emoji: '🐕‍🦺' },
  FLOKI: { name: 'Floki Inu', emoji: '🐺' },
  WIF: { name: 'dogwifhat', emoji: '🎩' },
  BONK: { name: 'Bonk', emoji: '💥' },
}

export function OracleFeed() {
  const symbols = Object.keys(CONTRACTS.PRICE_FEEDS) as Array<keyof typeof CONTRACTS.PRICE_FEEDS>
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {symbols.map((symbol) => (
        <PulseCard
          key={symbol}
          symbol={symbol}
          memecoin={MEMECOIN_CONFIG[symbol]?.name || symbol}
        />
      ))}
    </div>
  )
}
```

#### 1.4 Implement Real `useAggregatorStats`
```typescript
// hooks/use-aggregator-stats.ts - Replace mock with real
'use client'

import { useQuery } from '@tanstack/react-query'
import { publicClient } from '@/lib/client'
import { CONTRACTS, ABIS } from '@/lib/contracts'

export function useAggregatorStats(symbol: keyof typeof CONTRACTS.PRICE_FEEDS) {
  return useQuery({
    queryKey: ['aggregatorStats', symbol],
    queryFn: async () => {
      // Get update count from Aggregator
      const updateCount = await publicClient.readContract({
        address: CONTRACTS.AGGREGATOR as `0x${string}`,
        abi: ABIS.AGGREGATOR,
        functionName: 'getUpdateCount',
        args: [symbol]
      }) as bigint
      
      // Calculate stats from update count
      // Volume and sentiment would need event indexing for accuracy
      // For now, derive from update count
      const updatesToday = Number(updateCount)
      const activeAgents = Math.ceil(updatesToday / 24) // Rough estimate
      
      return {
        updatesToday,
        activeAgents,
        volume24h: updatesToday * 1000, // Placeholder until indexer
        sentiment: 50 + Math.min(activeAgents * 3, 40), // Placeholder formula
        avgAccuracy: 95
      }
    },
    staleTime: 30_000,
    refetchInterval: 60_000
  })
}
```

#### 1.5 Add Price History for 24h Change
```typescript
// lib/store/price-history-store.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface PriceHistoryState {
  history: Record<string, Array<{ price: number; timestamp: number }>>
  addPrice: (symbol: string, price: number) => void
  get24hChange: (symbol: string, currentPrice: number) => number
}

export const usePriceHistoryStore = create<PriceHistoryState>()(
  persist(
    (set, get) => ({
      history: {},
      
      addPrice: (symbol, price) => {
        const now = Date.now()
        const cutoff = now - 24 * 60 * 60 * 1000 // 24h ago
        
        set((state) => {
          const existing = state.history[symbol] || []
          const filtered = existing.filter(p => p.timestamp > cutoff)
          
          return {
            history: {
              ...state.history,
              [symbol]: [...filtered, { price, timestamp: now }].slice(-1440) // Max 1440 points (1 per minute for 24h)
            }
          }
        })
      },
      
      get24hChange: (symbol, currentPrice) => {
        const { history } = get()
        const prices = history[symbol] || []
        if (prices.length === 0) return 0
        
        const oldestPrice = prices[0].price
        return ((currentPrice - oldestPrice) / oldestPrice) * 100
      }
    }),
    {
      name: 'memepulse-price-history',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
```

---

### Phase 2: PoM/Mining Data (Before Ship) ⏰ 1 day

#### 2.1 Create `useProtocolConfig` Hook
```typescript
// hooks/use-protocol-config.ts
export function useProtocolConfig() {
  return useQuery({
    queryKey: ['protocolConfig'],
    queryFn: async () => {
      const [epochDuration, rewardRate, currentEpoch] = await Promise.all([
        publicClient.readContract({
          address: CONTRACTS.PROTOCOL_CONFIG as `0x${string}`,
          abi: ['function epochDuration() view returns (uint256)'],
          functionName: 'epochDuration'
        }),
        publicClient.readContract({
          address: CONTRACTS.PROTOCOL_CONFIG as `0x${string}`,
          abi: ['function rewardPerVolume() view returns (uint256)'],
          functionName: 'rewardPerVolume'
        }),
        publicClient.readContract({
          address: CONTRACTS.M_TOKEN_DISTRIBUTOR as `0x${string}`,
          abi: ['function currentEpoch() view returns (uint256)'],
          functionName: 'currentEpoch'
        })
      ])
      
      return {
        epochDuration: Number(epochDuration),
        rewardRate: Number(formatUnits(rewardRate as bigint, 18)),
        currentEpoch: Number(currentEpoch)
      }
    },
    staleTime: 300_000 // 5 min cache
  })
}
```

#### 2.2 Update PoMGauge Component
```typescript
// components/pom-gauge.tsx - Use real data
const { data: config } = useProtocolConfig()
const { data: distributorStats } = useDistributorStats()

const volume24h = distributorStats?.totalVolume || 0
const distributionRate = config?.rewardRate || 0.05
const estimatedRewards = volume24h * distributionRate
const nextEpoch = formatCountdown(config?.epochDuration || 0)
```

---

### Phase 3: Agent Management (Post-Ship Polish)

#### 3.1 Agent Creation Storage
When user creates an agent via `/create`:
1. Generate/derive agent wallet address
2. Store in localStorage:
```typescript
interface StoredAgent {
  id: string
  name: string
  memecoin: string
  strategy: string
  triggers: string[]
  contexts: string[]
  walletAddress: string // CRITICAL - needed for contract reads
  createdAt: number
}
```

#### 3.2 Connect Agent Data to Real Contracts
```typescript
// Update agent-card.tsx to use address from stored agent
const storedAgents = JSON.parse(localStorage.getItem('memepulse-agents') || '[]')
const { unclaimed } = useMiningStats(storedAgents.find(a => a.id === id)?.walletAddress)
```

---

## 🧩 Hydration Strategy

### Problem Areas
1. **GlobalTicker**: Server renders empty, client fetches prices → flash
2. **PulseCard**: Mock data on server, real data on client → mismatch
3. **Charts**: No data on server → empty state

### Solutions

#### 1. Consistent Loading States
```typescript
// Pattern: Always show skeleton on server, hydrate on client
export function PulseCard({ symbol }: Props) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => setMounted(true), [])
  
  if (!mounted) {
    return <PulseCardSkeleton />
  }
  
  // Real content with data
}
```

#### 2. Suppress Hydration Warnings for Dynamic Data
```typescript
// For components with frequently changing data
<span suppressHydrationWarning>
  ${price.toFixed(8)}
</span>
```

#### 3. Use `useLayoutEffect` for Critical Paths
```typescript
// For data that must match immediately
useLayoutEffect(() => {
  const stored = localStorage.getItem('orderly_registered')
  setIsRegistered(stored === 'true')
}, [])
```

---

## 📋 Contract ABIs Needed

Add to `lib/contracts.ts`:

```typescript
export const ABIS = {
  // ... existing ABIs
  
  M_TOKEN: [
    "function balanceOf(address account) view returns (uint256)",
    "function totalSupply() view returns (uint256)"
  ],
  
  PROTOCOL_CONFIG: [
    "function epochDuration() view returns (uint256)",
    "function rewardPerVolume() view returns (uint256)",
    "function maxUpdatesForVCWAP() view returns (uint256)",
    "function minCredibility() view returns (uint256)"
  ],
  
  AGGREGATOR_EVENTS: [
    "event UpdateSubmitted(address indexed agent, string indexed feedSymbol, uint256 price, uint256 volume, uint256 timestamp, bytes32 orderlyTxHash)",
    "event VWAPCalculated(string indexed feedSymbol, uint256 vwap, uint256 updateCount)"
  ]
} as const
```

---

## 🚀 Implementation Checklist

### Must Have (Before Ship)
- [ ] `useMTokenBalance` hook
- [ ] Fix NavHeader $M balance (remove hardcoded 1,240)
- [ ] Replace hardcoded `MEMECOIN_ORACLE_DATA` in OracleFeed
- [ ] Implement real `useAggregatorStats` (at least update count)
- [ ] Add price history store for 24h change calculation
- [ ] Fix hydration issues with `mounted` pattern

### Should Have (Before Ship)
- [ ] `useProtocolConfig` hook
- [ ] Real PoMGauge data
- [ ] Event-based TradingEventFeed
- [ ] Proper loading skeletons everywhere

### Nice to Have (Post-Ship)
- [ ] Full event indexing for historical data
- [ ] Chart data from indexed events
- [ ] Agent wallet derivation/storage
- [ ] Performance metrics calculation

---

## 📁 New Files to Create

```
hooks/
├── use-m-token-balance.ts    # NEW
├── use-protocol-config.ts    # NEW
├── use-pom-stats.ts          # NEW
lib/
├── store/
│   ├── price-history-store.ts # NEW
├── memecoin-config.ts        # NEW (extract from components)
```

---

## ⚠️ Known Issues & Workarounds

### 1. RPC Rate Limiting
**Problem:** Too many contract calls can hit rate limits
**Solution:** 
- Use React Query's `staleTime` aggressively (30s-60s minimum)
- Batch reads with `multicall` when possible
- Consider adding fallback RPC URL

### 2. Missing Event Indexer
**Problem:** No way to get historical volume, agent counts, etc.
**Workaround:** 
- Use update counts as proxy
- Store snapshots in localStorage
- Accept some data won't be available until backend exists

### 3. Agent Address Undefined
**Problem:** Many hooks fail because `agent.address` is undefined
**Fix:** 
- Ensure `/create` flow generates and stores wallet address
- Add validation before rendering components that need address

---

## 🎯 Success Criteria

1. **GlobalTicker** shows real prices from MemeCore contracts ✅
2. **OracleFeed/PulseCard** show real prices, update counts visible
3. **NavHeader** shows actual $M balance (0 if none)
4. **PoMGauge** shows real epoch timing and rates
5. **No hydration errors** in console
6. **Loading states** visible while fetching
7. **Components don't break** if contract calls fail

---

*Last Updated: 2025-12-05*
*Status: Planning Complete - Ready for Implementation*

