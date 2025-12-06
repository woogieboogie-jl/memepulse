Data Layer Strategy (Hackathon Edition)
Objective
Implement a scalable, responsive, and persistent data layer for MemePulse without introducing a complex backend database.

Technology Decision Matrix
Technology	Use Case	Why?
Zustand	High-Frequency Global State	Ticker/Prices: We need 1-second updates without re-rendering the entire app tree. Context API is too slow for this.
TanStack Query	Async Data & Contracts	RPC Calls: Caching, frequent polling for on-chain data (APY, Oracle), and historical chart data.
LocalStorage	User Persistence	"Hackathon DB": Simulates a backend for user positions/orders so they survive page reloads.
Component Implementation Map
1. Global Components
Component	Data Source	Details
GlobalTicker	useMarketStore (Zustand)	Subscribes to stats (volume, change) for all coins to scroll 24/7.
PulseMonitor	useQuery (TanStack)	Polls 

getSocialScore()
 every 5s. Needs caching, not instant sync.
KeyRenewalModal	localStorage	Checks orderly_key_expired flag directly.
2. Manual Trade Page (/trade)
Component	Sub-Component	Data Source	Details
TradingChart	Header (Price)	useMarketStore (Zustand)	Needs instant price updates (green/red flash).
TradingChart	Graph (Candles)	useQuery (TanStack)	Fetches historical array. Cached for 5 mins to save API calls.
OrderBook	List	useQuery (TanStack)	Fetches snapshot every 2-3s. No need for global subscription.
TradeFeed	List	useQuery (TanStack)	Fetches recent trades.
PnL Cards	Stats	useUserStore (Zustand)	Calculates PnL live based on marketStore price + userStore positions.
PoM Card	Stats	useQuery (TanStack)	Reads MTokenDistributor contract for APY/Rewards.
3. Order Management System
Feature	Data Source	Logic
Place Order Form	useState (Local)	Inputs (Amount, Leverage) are local until submitted.
Submit Order	useUserStore (Zustand)	Adds order to orders array in LocalStorage.
Open Positions	useUserStore (Zustand)	Reads positions array. Persisted in LocalStorage.
Asset Balance	useUserStore (Zustand)	Mock balance (e.g., $10,000) persisted in LocalStorage.
Implementation Roadmap
Phase 1: The Stores

lib/store/market-store.ts
: The "Ticker Tape" engine.

lib/store/user-store.ts
: The "Database" (Positions, Orders, Balance).
Phase 2: The Simulation Engine
components/market-simulator.tsx: A headless component in layout.tsx.
Generates random price moves every 1s.
Updates marketStore.
Checks if marketStore.price crosses any userStore.limitOrder.
Executes orders if matched.
Phase 3: Connect Components
Refactor 

GlobalTicker
 to read from marketStore.
Refactor 

TradingChart
 to split Header (Zustand) vs Graph (TanStack).
Refactor 

TradePage
 to read/write to userStore.
