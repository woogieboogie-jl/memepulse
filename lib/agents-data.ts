import { AgentCardProps } from '@/components/agent-card'
import { SEED_AGENT, getSupportedMemecoins } from '@/lib/contracts'

// Generate performance data for sparklines
export const generatePerformanceData = (startValue: number, trend: 'up' | 'down' | 'flat') => {
  const data = []
  let value = startValue
  for (let i = 0; i < 24; i++) {
    const change = trend === 'up' ? Math.random() * 100 : trend === 'down' ? -Math.random() * 100 : (Math.random() - 0.5) * 50
    value += change
    data.push({ time: `${i}:00`, value })
  }
  return data
}

// Agent detail data structure
export interface AgentDetailData {
  id: string
  address?: string // Wallet address for on-chain data
  name: string
  creator?: string
  strategy: string
  funded: number
  pnl: number

  // PRD-Aligned: Memecoin-specific fields
  memecoin: string // DOGE, PEPE, SHIB, FLOKI, etc.
  mTokensMined: number // $M rewards earned from oracle contributions
  oracleContributions: number // Number of pulses submitted to chain

  winRate: number
  sharpeRatio: number
  maxDrawdown?: number
  avgTradeDuration?: string
  totalTrades?: number
  totalDeposits?: number
  collateralStake?: number
  investorCount?: number
  triggers: string[]
  contexts: string[]
  status?: 'active' | 'paused'
  isOwned?: boolean
  isPublished?: boolean
  sharpeTarget?: number
  performanceData: Array<{ time: string; value: number }> | Array<{ date: string; value: number }>
  positions: Array<{
    id: string
    asset: string
    type: 'Long' | 'Short'
    entry: number
    current: number
    pnl: number
    leverage: string
    txHash: string
  }>
  completedTrades: Array<{
    id: string
    date: string
    asset: string
    type: 'Long' | 'Short'
    entry: number
    exit: number
    pnl: number
    duration: string
    txHash: string
  }>
  transactions: Array<{
    id: string
    type: string
    amount: number
    date: string
    txHash: string
    chain: string
  }>
  reasoningLog: Array<{
    id: string
    time: string
    trigger: string
    context: string
    action: string
    reasoning: string
  }>
  qualificationCriteria?: AgentCardProps['qualificationCriteria']
}

// Centralized agent data
// Note: For demo, agent address references the seed agent (deployer wallet)
export const allAgentsData: Record<string, AgentDetailData> = {
  '1': {
    id: '1',
    address: SEED_AGENT.ADDRESS, // Seed agent - registered for all feeds
    name: 'DOGE Pulse',
    creator: '0x742d...4e89',
    strategy: 'Monitors DOGE social sentiment and whale movements. Trades on Elon tweets and large wallet transfers.',
    funded: 5240,
    pnl: 8247.32,

    // PRD-Aligned Memecoin Fields
    memecoin: 'DOGE',
    mTokensMined: 1240,
    oracleContributions: 142,

    winRate: 67.5,
    sharpeRatio: 2.3,
    maxDrawdown: 12.5,
    avgTradeDuration: '4h 15m',
    totalTrades: 142,
    totalDeposits: 45640,
    collateralStake: 500,
    investorCount: 12,
    triggers: ['Volume Spike'],
    contexts: ['On-chain', 'Market'],
    status: 'active',
    isOwned: true,
    isPublished: true,
    sharpeTarget: 2.0,
    performanceData: [
      { time: '00:00', value: 5000 },
      { time: '04:00', value: 5120 },
      { time: '08:00', value: 5240 },
      { time: '12:00', value: 5180 },
      { time: '16:00', value: 5340 },
      { time: '20:00', value: 5487 },
    ],
    positions: [
      { id: '1', asset: 'BTC/USD', type: 'Long', entry: 42350, current: 43120, pnl: 770, leverage: '3x', txHash: '0x1234...5678' },
      { id: '2', asset: 'ETH/USD', type: 'Short', entry: 3250, current: 3180, pnl: 210, leverage: '2x', txHash: '0xabcd...ef01' },
      { id: '3', asset: 'SOL/USD', type: 'Long', entry: 98.2, current: 101.5, pnl: 330, leverage: '4x', txHash: '0xef12...3456' },
      { id: '4', asset: 'AVAX/USD', type: 'Short', entry: 38.5, current: 37.1, pnl: 140, leverage: '2x', txHash: '0x789a...bcde' },
    ],
    completedTrades: [
      { id: '1', date: '2024-01-15 14:32', asset: 'BTC/USD', type: 'Long', entry: 41200, exit: 42100, pnl: 900, duration: '4h 23m', txHash: '0x9876...5432' },
      { id: '2', date: '2024-01-15 08:15', asset: 'SOL/USD', type: 'Short', entry: 98.5, exit: 95.2, pnl: 198, duration: '2h 15m', txHash: '0xfedc...ba98' },
      { id: '3', date: '2024-01-14 22:45', asset: 'ETH/USD', type: 'Long', entry: 3100, exit: 3080, pnl: -120, duration: '6h 12m', txHash: '0x1111...2222' },
      { id: '4', date: '2024-01-14 16:30', asset: 'BTC/USD', type: 'Short', entry: 42800, exit: 41500, pnl: 1300, duration: '3h 45m', txHash: '0x2222...3333' },
      { id: '5', date: '2024-01-13 20:15', asset: 'MATIC/USD', type: 'Long', entry: 0.82, exit: 0.88, pnl: 365, duration: '5h 20m', txHash: '0x3333...4444' },
      { id: '6', date: '2024-01-13 14:20', asset: 'LINK/USD', type: 'Short', entry: 14.8, exit: 14.2, pnl: 405, duration: '4h 10m', txHash: '0x4444...5555' },
      { id: '7', date: '2024-01-12 18:45', asset: 'ETH/USD', type: 'Long', entry: 3120, exit: 3180, pnl: 480, duration: '7h 30m', txHash: '0x5555...6666' },
      { id: '8', date: '2024-01-12 10:30', asset: 'SOL/USD', type: 'Short', entry: 102, exit: 99.5, pnl: 250, duration: '2h 50m', txHash: '0x6666...7777' },
      { id: '9', date: '2024-01-11 22:00', asset: 'BTC/USD', type: 'Long', entry: 40500, exit: 40200, pnl: -300, duration: '8h 15m', txHash: '0x7777...8888' },
      { id: '10', date: '2024-01-11 15:45', asset: 'AVAX/USD', type: 'Short', entry: 39.2, exit: 37.8, pnl: 280, duration: '3h 20m', txHash: '0x8888...9999' },
      { id: '11', date: '2024-01-10 19:20', asset: 'ETH/USD', type: 'Long', entry: 3080, exit: 3140, pnl: 480, duration: '6h 40m', txHash: '0x9999...aaaa' },
      { id: '12', date: '2024-01-10 12:10', asset: 'BTC/USD', type: 'Short', entry: 41800, exit: 41000, pnl: 800, duration: '4h 30m', txHash: '0xaaaa...bbbb' },
    ],
    transactions: [
      { id: '1', type: 'Creation', amount: 10, date: '2024-01-10 10:00', txHash: '0xaaaa...bbbb', chain: 'Ethereum' },
      { id: '2', type: 'Deposit', amount: 5000, date: '2024-01-10 10:15', txHash: '0xcccc...dddd', chain: 'Ethereum' },
      { id: '3', type: 'Trade', amount: 900, date: '2024-01-15 14:32', txHash: '0x9876...5432', chain: 'Ethereum' },
      { id: '4', type: 'Deposit', amount: 240, date: '2024-01-14 16:20', txHash: '0xeeee...ffff', chain: 'Ethereum' },
      { id: '5', type: 'Trade', amount: 1300, date: '2024-01-14 16:30', txHash: '0x2222...3333', chain: 'Ethereum' },
      { id: '6', type: 'Trade', amount: 365, date: '2024-01-13 20:15', txHash: '0x3333...4444', chain: 'Ethereum' },
      { id: '7', type: 'Trade', amount: 405, date: '2024-01-13 14:20', txHash: '0x4444...5555', chain: 'Ethereum' },
      { id: '8', type: 'Trade', amount: 480, date: '2024-01-12 18:45', txHash: '0x5555...6666', chain: 'Ethereum' },
      { id: '9', type: 'Trade', amount: 250, date: '2024-01-12 10:30', txHash: '0x6666...7777', chain: 'Ethereum' },
      { id: '10', type: 'Trade', amount: -300, date: '2024-01-11 22:00', txHash: '0x7777...8888', chain: 'Ethereum' },
      { id: '11', type: 'Deposit', amount: 500, date: '2024-01-11 18:00', txHash: '0xdddd...eeee', chain: 'Ethereum' },
      { id: '12', type: 'Trade', amount: 280, date: '2024-01-11 15:45', txHash: '0x8888...9999', chain: 'Ethereum' },
      { id: '13', type: 'Trade', amount: 480, date: '2024-01-10 19:20', txHash: '0x9999...aaaa', chain: 'Ethereum' },
      { id: '14', type: 'Trade', amount: 800, date: '2024-01-10 12:10', txHash: '0xaaaa...bbbb', chain: 'Ethereum' },
    ],
    reasoningLog: [
      { id: '1', time: '2024-01-15 14:32', trigger: 'Volume Spike', context: 'On-chain whale movement detected', action: 'Opened long position BTC 3x leverage', reasoning: 'Large wallet transferred 1000 BTC to exchange, historically precedes price increase. Volume spike 250% above 30-day average' },
      { id: '2', time: '2024-01-15 08:15', trigger: 'Volume Spike', context: 'SOL broke resistance with high volume', action: 'Opened short position SOL 2x', reasoning: 'Price hit overbought RSI levels (78) combined with decreasing volume after initial spike. Counter-trend opportunity' },
      { id: '3', time: '2024-01-14 16:30', trigger: 'Volume Spike', context: 'Massive BTC sell-off detected on-chain', action: 'Opened short position BTC 4x', reasoning: 'Whale wallet moved 2000 BTC to exchange. Historical data shows 70% probability of price drop within 4 hours' },
      { id: '4', time: '2024-01-13 20:15', trigger: 'Volume Spike', context: 'MATIC volume surge on multiple exchanges', action: 'Opened long position MATIC 3x', reasoning: 'Unusual volume pattern detected across Binance, Coinbase, and Kraken. Positive momentum indicators' },
      { id: '5', time: '2024-01-13 14:20', trigger: 'Volume Spike', context: 'LINK volume spike with decreasing price', action: 'Opened short position LINK 2x', reasoning: 'High volume sell-off detected. Price declining despite volume increase suggests bearish sentiment' },
      { id: '6', time: '2024-01-12 18:45', trigger: 'Volume Spike', context: 'ETH accumulation detected from multiple wallets', action: 'Opened long position ETH 3x', reasoning: 'Multiple medium-sized wallets accumulating ETH. On-chain metrics show strong holder sentiment' },
      { id: '7', time: '2024-01-12 10:30', trigger: 'Volume Spike', context: 'SOL volume spike at resistance level', action: 'Opened short position SOL 2x', reasoning: 'Volume spike at key resistance $102. RSI divergence suggests reversal potential' },
      { id: '8', time: '2024-01-11 15:45', trigger: 'Volume Spike', context: 'AVAX unusual volume pattern detected', action: 'Opened short position AVAX 2x', reasoning: 'Volume spike with price stagnation indicates distribution phase. Bearish signal' },
    ],
  },
  '2': {
    id: '2',
    name: 'PEPE Pulse',
    strategy: 'Tracks PEPE meme trends across Twitter and Reddit. Scalps on viral moments and social spikes.',
    funded: 2100,
    pnl: -342.18,

    // PRD-Aligned Memecoin Fields  
    memecoin: 'PEPE',
    mTokensMined: 340,
    oracleContributions: 89,

    winRate: 42.1,
    sharpeRatio: 1.2,
    triggers: ['Social Signal'],
    contexts: ['Social'],
    status: 'active',
    isOwned: true,
    isPublished: false,
    sharpeTarget: 2.0,
    performanceData: generatePerformanceData(2500, 'down'),
    positions: [
      { id: '1', asset: 'DOGE/USD', type: 'Long', entry: 0.085, current: 0.082, pnl: -63, leverage: '2x', txHash: '0x2222...3333' },
      { id: '2', asset: 'TSLA/USD', type: 'Long', entry: 247, current: 249, pnl: 40, leverage: '1x', txHash: '0x3333...4444' },
    ],
    completedTrades: [
      { id: '1', date: '2024-01-14 10:30', asset: 'DOGE/USD', type: 'Long', entry: 0.088, exit: 0.085, pnl: -34, duration: '3h 45m', txHash: '0x3333...4444' },
      { id: '2', date: '2024-01-13 15:20', asset: 'TSLA/USD', type: 'Long', entry: 245, exit: 248, pnl: 120, duration: '5h 10m', txHash: '0x4444...5555' },
      { id: '3', date: '2024-01-13 08:45', asset: 'DOGE/USD', type: 'Long', entry: 0.082, exit: 0.086, pnl: 48, duration: '2h 30m', txHash: '0x5555...6666' },
      { id: '4', date: '2024-01-12 19:20', asset: 'TSLA/USD', type: 'Short', entry: 250, exit: 247, pnl: 90, duration: '4h 15m', txHash: '0x6666...7777' },
      { id: '5', date: '2024-01-12 11:10', asset: 'DOGE/USD', type: 'Long', entry: 0.084, exit: 0.081, pnl: -36, duration: '6h 20m', txHash: '0x7777...8888' },
      { id: '6', date: '2024-01-11 16:30', asset: 'TSLA/USD', type: 'Long', entry: 243, exit: 246, pnl: 90, duration: '3h 45m', txHash: '0x8888...9999' },
      { id: '7', date: '2024-01-11 09:15', asset: 'DOGE/USD', type: 'Short', entry: 0.087, exit: 0.085, pnl: 23, duration: '1h 50m', txHash: '0x9999...aaaa' },
      { id: '8', date: '2024-01-10 20:00', asset: 'TSLA/USD', type: 'Long', entry: 244, exit: 242, pnl: -40, duration: '7h 30m', txHash: '0xaaaa...bbbb' },
      { id: '9', date: '2024-01-10 14:25', asset: 'DOGE/USD', type: 'Long', entry: 0.083, exit: 0.086, pnl: 36, duration: '4h 10m', txHash: '0xbbbb...cccc' },
    ],
    transactions: [
      { id: '1', type: 'Creation', amount: 10, date: '2024-01-10 10:00', txHash: '0xaaaa...bbbb', chain: 'Ethereum' },
      { id: '2', type: 'Deposit', amount: 2100, date: '2024-01-10 10:20', txHash: '0xcccc...dddd', chain: 'Ethereum' },
      { id: '3', type: 'Trade', amount: -34, date: '2024-01-14 10:30', txHash: '0x3333...4444', chain: 'Ethereum' },
      { id: '4', type: 'Trade', amount: 120, date: '2024-01-13 15:20', txHash: '0x4444...5555', chain: 'Ethereum' },
      { id: '5', type: 'Trade', amount: 48, date: '2024-01-13 08:45', txHash: '0x5555...6666', chain: 'Ethereum' },
      { id: '6', type: 'Trade', amount: 90, date: '2024-01-12 19:20', txHash: '0x6666...7777', chain: 'Ethereum' },
      { id: '7', type: 'Trade', amount: -36, date: '2024-01-12 11:10', txHash: '0x7777...8888', chain: 'Ethereum' },
      { id: '8', type: 'Trade', amount: 90, date: '2024-01-11 16:30', txHash: '0x8888...9999', chain: 'Ethereum' },
      { id: '9', type: 'Trade', amount: 23, date: '2024-01-11 09:15', txHash: '0x9999...aaaa', chain: 'Ethereum' },
      { id: '10', type: 'Trade', amount: -40, date: '2024-01-10 20:00', txHash: '0xaaaa...bbbb', chain: 'Ethereum' },
      { id: '11', type: 'Trade', amount: 36, date: '2024-01-10 14:25', txHash: '0xbbbb...cccc', chain: 'Ethereum' },
    ],
    reasoningLog: [
      { id: '1', time: '2024-01-14 10:30', trigger: 'Social Signal', context: 'Elon tweeted about Dogecoin', action: 'Opened long position DOGE 2x', reasoning: 'Positive sentiment detected in tweet mentioning "Dogecoin to the moon". Historical correlation: 65% price increase within 4 hours' },
      { id: '2', time: '2024-01-13 15:20', trigger: 'Social Signal', context: 'Elon mentioned Tesla in positive context', action: 'Opened long position TSLA 1x', reasoning: 'Tweet about Tesla production milestones. Stock typically reacts positively to operational updates' },
      { id: '3', time: '2024-01-13 08:45', trigger: 'Social Signal', context: 'DOGE trending on Twitter with 50k+ mentions', action: 'Opened long position DOGE 2x', reasoning: 'Social volume spike detected. Sentiment analysis shows 78% positive mentions. Entry before mainstream adoption' },
      { id: '4', time: '2024-01-12 19:20', trigger: 'Social Signal', context: 'TSLA bearish sentiment on Reddit', action: 'Opened short position TSLA 1x', reasoning: 'Negative sentiment detected across r/wallstreetbets and r/stocks. Short-term bearish momentum expected' },
      { id: '5', time: '2024-01-12 11:10', trigger: 'Social Signal', context: 'DOGE mentioned by crypto influencer', action: 'Opened long position DOGE 2x', reasoning: 'Large crypto influencer with 2M followers mentioned DOGE. Historical impact: average 5% price increase' },
      { id: '6', time: '2024-01-11 16:30', trigger: 'Social Signal', context: 'TSLA positive earnings discussion', action: 'Opened long position TSLA 1x', reasoning: 'Social media discussion about potential strong earnings. Pre-earnings momentum typically positive' },
      { id: '7', time: '2024-01-11 09:15', trigger: 'Social Signal', context: 'DOGE overbought sentiment detected', action: 'Opened short position DOGE 2x', reasoning: 'Social sentiment analysis shows overbought conditions. FOMO peak detected, expecting pullback' },
    ],
    qualificationCriteria: {
      sharpeRatio: { current: 1.2, target: 2.0 },
      poolSize: { current: 2100, target: 5000 },
      tradingVolume: { current: 8500, target: 20000 },
      benchmarkPerformance: { current: 3.2, target: 8.1 },
    },
  },
  '3': {
    id: '3',
    name: 'SHIB Pulse',
    strategy: 'SHIB momentum and community sentiment tracker. Currently paused awaiting funding.',
    funded: 0,
    pnl: 0,

    // PRD-Aligned Memecoin Fields
    memecoin: 'SHIB',
    mTokensMined: 0,
    oracleContributions: 0,

    winRate: 0,
    sharpeRatio: 0,
    triggers: ['Price Movement'],
    contexts: ['Market'],
    status: 'paused',
    isOwned: true,
    isPublished: false,
    sharpeTarget: 2.0,
    performanceData: [],
    positions: [],
    completedTrades: [],
    transactions: [
      { id: '1', type: 'Creation', amount: 10, date: '2024-01-12 10:00', txHash: '0xaaaa...bbbb', chain: 'Ethereum' },
    ],
    reasoningLog: [],
    qualificationCriteria: {
      sharpeRatio: { current: 0, target: 2.0 },
      poolSize: { current: 0, target: 5000 },
      tradingVolume: { current: 0, target: 20000 },
      benchmarkPerformance: { current: 0, target: 8.1 },
    },
  },
  '4': {
    id: '4',
    name: 'FLOKI Pulse',
    creator: '0x8f3a...2b1c',
    strategy: 'FLOKI Viking community pulse monitor. Captures viral TikTok trends and social momentum.',
    funded: 0,
    pnl: 12450.18,

    // PRD-Aligned Memecoin Fields
    memecoin: 'FLOKI',
    mTokensMined: 2650,
    oracleContributions: 156,

    winRate: 71.2,
    sharpeRatio: 2.8,
    maxDrawdown: 8.4,
    avgTradeDuration: '3h 45m',
    totalTrades: 89,
    totalDeposits: 67320,
    collateralStake: 1000,
    investorCount: 24,
    triggers: ['Social Signal'],
    contexts: ['Social', 'Market'],
    isPublished: true,
    performanceData: [
      { date: 'Oct 18', value: 10000 },
      { date: 'Oct 20', value: 10800 },
      { date: 'Oct 22', value: 11500 },
      { date: 'Oct 24', value: 11200 },
      { date: 'Oct 26', value: 11800 },
      { date: 'Oct 28', value: 12400 },
      { date: 'Oct 30', value: 12100 },
      { date: 'Nov 1', value: 12650 },
      { date: 'Nov 3', value: 12450 },
    ],
    positions: [
      { id: '1', asset: 'PEPE/USD', type: 'Long', entry: 0.000012, current: 0.000014, pnl: 167, leverage: '4x', txHash: '0x5555...6666' },
      { id: '2', asset: 'SHIB/USD', type: 'Short', entry: 0.000008, current: 0.000007, pnl: 125, leverage: '3x', txHash: '0x6666...7777' },
      { id: '3', asset: 'FLOKI/USD', type: 'Long', entry: 0.00015, current: 0.00018, pnl: 200, leverage: '5x', txHash: '0x7777...8888' },
      { id: '4', asset: 'DOGE/USD', type: 'Long', entry: 0.085, current: 0.088, pnl: 176, leverage: '3x', txHash: '0x8888...9999' },
    ],
    completedTrades: [
      { id: '1', date: '2024-11-03 11:20', asset: 'PEPE/USD', type: 'Long', entry: 0.000011, exit: 0.000013, pnl: 182, duration: '2h 30m', txHash: '0x7777...8888' },
      { id: '2', date: '2024-11-02 14:45', asset: 'DOGE/USD', type: 'Long', entry: 0.083, exit: 0.087, pnl: 240, duration: '3h 15m', txHash: '0x8888...9999' },
      { id: '3', date: '2024-11-02 08:30', asset: 'SHIB/USD', type: 'Long', entry: 0.0000075, exit: 0.0000085, pnl: 133, duration: '4h 20m', txHash: '0x9999...aaaa' },
      { id: '4', date: '2024-11-01 19:15', asset: 'PEPE/USD', type: 'Short', entry: 0.000013, exit: 0.000012, pnl: 77, duration: '1h 45m', txHash: '0xaaaa...bbbb' },
      { id: '5', date: '2024-11-01 12:00', asset: 'FLOKI/USD', type: 'Long', entry: 0.00014, exit: 0.00016, pnl: 143, duration: '3h 30m', txHash: '0xbbbb...cccc' },
      { id: '6', date: '2024-10-31 16:45', asset: 'DOGE/USD', type: 'Long', entry: 0.081, exit: 0.084, pnl: 185, duration: '5h 10m', txHash: '0xcccc...dddd' },
      { id: '7', date: '2024-10-31 09:20', asset: 'SHIB/USD', type: 'Short', entry: 0.0000082, exit: 0.0000078, pnl: 49, duration: '2h 15m', txHash: '0xdddd...eeee' },
      { id: '8', date: '2024-10-30 21:30', asset: 'PEPE/USD', type: 'Long', entry: 0.0000105, exit: 0.000012, pnl: 143, duration: '6h 45m', txHash: '0xeeee...ffff' },
      { id: '9', date: '2024-10-30 14:10', asset: 'FLOKI/USD', type: 'Long', entry: 0.00013, exit: 0.000135, pnl: 38, duration: '3h 50m', txHash: '0xffff...0000' },
      { id: '10', date: '2024-10-29 18:00', asset: 'DOGE/USD', type: 'Short', entry: 0.084, exit: 0.082, pnl: 119, duration: '4h 30m', txHash: '0x0000...1111' },
      { id: '11', date: '2024-10-29 10:45', asset: 'PEPE/USD', type: 'Long', entry: 0.000010, exit: 0.0000115, pnl: 150, duration: '5h 20m', txHash: '0x1111...2222' },
      { id: '12', date: '2024-10-28 15:20', asset: 'SHIB/USD', type: 'Long', entry: 0.0000072, exit: 0.0000078, pnl: 83, duration: '3h 15m', txHash: '0x2222...3333' },
    ],
    transactions: [
      { id: '1', type: 'Creation', amount: 10, date: '2024-10-10 10:00', txHash: '0xaaaa...bbbb', chain: 'Ethereum' },
      { id: '2', type: 'Deposit', amount: 5000, date: '2024-10-10 10:15', txHash: '0xcccc...dddd', chain: 'Ethereum' },
      { id: '3', type: 'Trade', amount: 182, date: '2024-11-03 11:20', txHash: '0x7777...8888', chain: 'Ethereum' },
      { id: '4', type: 'Trade', amount: 240, date: '2024-11-02 14:45', txHash: '0x8888...9999', chain: 'Ethereum' },
      { id: '5', type: 'Trade', amount: 133, date: '2024-11-02 08:30', txHash: '0x9999...aaaa', chain: 'Ethereum' },
      { id: '6', type: 'Trade', amount: 77, date: '2024-11-01 19:15', txHash: '0xaaaa...bbbb', chain: 'Ethereum' },
      { id: '7', type: 'Trade', amount: 143, date: '2024-11-01 12:00', txHash: '0xbbbb...cccc', chain: 'Ethereum' },
      { id: '8', type: 'Deposit', amount: 2000, date: '2024-10-31 20:00', txHash: '0xeeee...ffff', chain: 'Ethereum' },
      { id: '9', type: 'Trade', amount: 185, date: '2024-10-31 16:45', txHash: '0xcccc...dddd', chain: 'Ethereum' },
      { id: '10', type: 'Trade', amount: 49, date: '2024-10-31 09:20', txHash: '0xdddd...eeee', chain: 'Ethereum' },
      { id: '11', type: 'Trade', amount: 143, date: '2024-10-30 21:30', txHash: '0xeeee...ffff', chain: 'Ethereum' },
      { id: '12', type: 'Trade', amount: 38, date: '2024-10-30 14:10', txHash: '0xffff...0000', chain: 'Ethereum' },
      { id: '13', type: 'Trade', amount: 119, date: '2024-10-29 18:00', txHash: '0x0000...1111', chain: 'Ethereum' },
      { id: '14', type: 'Trade', amount: 150, date: '2024-10-29 10:45', txHash: '0x1111...2222', chain: 'Ethereum' },
      { id: '15', type: 'Trade', amount: 83, date: '2024-10-28 15:20', txHash: '0x2222...3333', chain: 'Ethereum' },
    ],
    reasoningLog: [
      { id: '1', time: '2024-11-03 11:20', trigger: 'Social Signal', context: 'PEPE trending on Twitter with 100k+ mentions', action: 'Opened long position PEPE 4x', reasoning: 'Strong positive sentiment spike detected across Twitter, Reddit, and Discord. Sentiment score: 85/100. Historical correlation: 80% price increase within 3 hours' },
      { id: '2', time: '2024-11-02 14:45', trigger: 'Social Signal', context: 'DOGE mentioned by major crypto influencer', action: 'Opened long position DOGE 3x', reasoning: 'Influencer with 5M followers posted about DOGE. Social volume increased 300%. Entry before mainstream adoption' },
      { id: '3', time: '2024-11-02 08:30', trigger: 'Social Signal', context: 'SHIB positive sentiment on Reddit r/cryptocurrency', action: 'Opened long position SHIB 3x', reasoning: 'Reddit sentiment analysis shows 72% positive mentions. Community engagement up 150%. Bullish pattern detected' },
      { id: '4', time: '2024-11-01 19:15', trigger: 'Social Signal', context: 'PEPE overbought sentiment detected', action: 'Opened short position PEPE 2x', reasoning: 'Social sentiment reached extreme levels (95/100). FOMO peak detected. Expecting pullback within 2 hours' },
      { id: '5', time: '2024-11-01 12:00', trigger: 'Social Signal', context: 'FLOKI viral TikTok video trending', action: 'Opened long position FLOKI 5x', reasoning: 'TikTok video about FLOKI reached 2M views in 2 hours. Social momentum extremely strong. High-risk, high-reward entry' },
      { id: '6', time: '2024-10-31 16:45', trigger: 'Social Signal', context: 'DOGE community celebration event', action: 'Opened long position DOGE 3x', reasoning: 'Community-organized event generating positive buzz. Historical pattern: community events lead to 5-10% price increase' },
      { id: '7', time: '2024-10-31 09:20', trigger: 'Social Signal', context: 'SHIB bearish sentiment spike', action: 'Opened short position SHIB 2x', reasoning: 'Negative sentiment detected across social platforms. Fear index rising. Short-term bearish momentum expected' },
      { id: '8', time: '2024-10-30 21:30', trigger: 'Social Signal', context: 'PEPE meme resurgence on Twitter', action: 'Opened long position PEPE 4x', reasoning: 'Meme culture revival detected. PEPE memes trending with 50k+ retweets. Cultural momentum indicator strong' },
    ],
  },
  '5': {
    id: '5',
    name: 'WIF Pulse',
    creator: '0x6d2e...9a4f',
    strategy: 'Dogwifhat (WIF) social sentiment and breakout monitor. Tracks Solana meme trends.',
    funded: 0,
    pnl: 5630.92,

    // PRD-Aligned Memecoin Fields
    memecoin: 'WIF',
    mTokensMined: 890,
    oracleContributions: 98,

    winRate: 58.3,
    sharpeRatio: 2.1,
    totalDeposits: 32180,
    collateralStake: 350,
    investorCount: 8,
    triggers: ['Price Movement'],
    contexts: ['Market'],
    isPublished: true,
    performanceData: [
      { date: 'Oct 18', value: 10000 },
      { date: 'Oct 20', value: 9800 },
      { date: 'Oct 22', value: 10200 },
      { date: 'Oct 24', value: 9500 },
      { date: 'Oct 26', value: 10100 },
      { date: 'Oct 28', value: 9900 },
      { date: 'Oct 30', value: 10400 },
      { date: 'Nov 1', value: 10200 },
      { date: 'Nov 3', value: 10630 },
    ],
    positions: [
      { id: '1', asset: 'BTC/USD', type: 'Long', entry: 43800, current: 44500, pnl: 700, leverage: '2x', txHash: '0x9999...aaaa' },
      { id: '2', asset: 'ETH/USD', type: 'Long', entry: 3220, current: 3280, pnl: 360, leverage: '3x', txHash: '0xaaaa...bbbb' },
      { id: '3', asset: 'SOL/USD', type: 'Short', entry: 101, current: 98.5, pnl: 250, leverage: '2x', txHash: '0xbbbb...cccc' },
    ],
    completedTrades: [
      { id: '1', date: '2024-11-02 09:30', asset: 'ETH/USD', type: 'Long', entry: 3200, exit: 3280, pnl: 400, duration: '6h 20m', txHash: '0xaaaa...bbbb' },
      { id: '2', date: '2024-11-01 16:15', asset: 'SOL/USD', type: 'Short', entry: 102, exit: 98, pnl: 200, duration: '4h 45m', txHash: '0xbbbb...cccc' },
      { id: '3', date: '2024-11-01 08:20', asset: 'BTC/USD', type: 'Long', entry: 43200, exit: 44000, pnl: 800, duration: '8h 10m', txHash: '0xcccc...dddd' },
      { id: '4', date: '2024-10-31 19:45', asset: 'ETH/USD', type: 'Short', entry: 3250, exit: 3180, pnl: 420, duration: '5h 30m', txHash: '0xdddd...eeee' },
      { id: '5', date: '2024-10-31 11:10', asset: 'SOL/USD', type: 'Long', entry: 99.5, exit: 103, pnl: 280, duration: '6h 45m', txHash: '0xeeee...ffff' },
      { id: '6', date: '2024-10-30 15:30', asset: 'BTC/USD', type: 'Short', entry: 44500, exit: 43800, pnl: 700, duration: '4h 20m', txHash: '0xffff...0000' },
      { id: '7', date: '2024-10-30 07:00', asset: 'ETH/USD', type: 'Long', entry: 3150, exit: 3220, pnl: 490, duration: '9h 15m', txHash: '0x0000...1111' },
      { id: '8', date: '2024-10-29 18:20', asset: 'SOL/USD', type: 'Short', entry: 104, exit: 100, pnl: 240, duration: '3h 50m', txHash: '0x1111...2222' },
      { id: '9', date: '2024-10-29 10:45', asset: 'BTC/USD', type: 'Long', entry: 42800, exit: 43500, pnl: 700, duration: '7h 30m', txHash: '0x2222...3333' },
      { id: '10', date: '2024-10-28 22:00', asset: 'ETH/USD', type: 'Short', entry: 3180, exit: 3120, pnl: 360, duration: '5h 15m', txHash: '0x3333...4444' },
      { id: '11', date: '2024-10-28 14:15', asset: 'SOL/USD', type: 'Long', entry: 97, exit: 101, pnl: 320, duration: '6h 20m', txHash: '0x4444...5555' },
    ],
    transactions: [
      { id: '1', type: 'Creation', amount: 10, date: '2024-10-10 10:00', txHash: '0xaaaa...bbbb', chain: 'Ethereum' },
      { id: '2', type: 'Deposit', amount: 3000, date: '2024-10-10 10:15', txHash: '0xcccc...dddd', chain: 'Ethereum' },
      { id: '3', type: 'Trade', amount: 400, date: '2024-11-02 09:30', txHash: '0xaaaa...bbbb', chain: 'Ethereum' },
      { id: '4', type: 'Trade', amount: 200, date: '2024-11-01 16:15', txHash: '0xbbbb...cccc', chain: 'Ethereum' },
      { id: '5', type: 'Trade', amount: 800, date: '2024-11-01 08:20', txHash: '0xcccc...dddd', chain: 'Ethereum' },
      { id: '6', type: 'Trade', amount: 420, date: '2024-10-31 19:45', txHash: '0xdddd...eeee', chain: 'Ethereum' },
      { id: '7', type: 'Trade', amount: 280, date: '2024-10-31 11:10', txHash: '0xeeee...ffff', chain: 'Ethereum' },
      { id: '8', type: 'Deposit', amount: 1500, date: '2024-10-30 20:00', txHash: '0xffff...0000', chain: 'Ethereum' },
      { id: '9', type: 'Trade', amount: 700, date: '2024-10-30 15:30', txHash: '0xffff...0000', chain: 'Ethereum' },
      { id: '10', type: 'Trade', amount: 490, date: '2024-10-30 07:00', txHash: '0x0000...1111', chain: 'Ethereum' },
      { id: '11', type: 'Trade', amount: 240, date: '2024-10-29 18:20', txHash: '0x1111...2222', chain: 'Ethereum' },
      { id: '12', type: 'Trade', amount: 700, date: '2024-10-29 10:45', txHash: '0x2222...3333', chain: 'Ethereum' },
      { id: '13', type: 'Trade', amount: 360, date: '2024-10-28 22:00', txHash: '0x3333...4444', chain: 'Ethereum' },
      { id: '14', type: 'Trade', amount: 320, date: '2024-10-28 14:15', txHash: '0x4444...5555', chain: 'Ethereum' },
    ],
    reasoningLog: [
      { id: '1', time: '2024-11-02 09:30', trigger: 'Price Movement', context: 'ETH broke above resistance at $3200', action: 'Opened long position ETH 2x', reasoning: 'Strong breakout pattern with increasing volume (150% above average). RSI at 65, not overbought. Target $3300 with stop at $3180' },
      { id: '2', time: '2024-11-01 16:15', trigger: 'Price Movement', context: 'SOL rejected at resistance $102', action: 'Opened short position SOL 2x', reasoning: 'Price rejected at key resistance with bearish divergence. Volume decreasing. Target $96 with stop at $103' },
      { id: '3', time: '2024-11-01 08:20', trigger: 'Price Movement', context: 'BTC broke ascending triangle pattern', action: 'Opened long position BTC 2x', reasoning: 'Ascending triangle breakout confirmed with volume spike. Target $44500. MACD bullish crossover' },
      { id: '4', time: '2024-10-31 19:45', trigger: 'Price Movement', context: 'ETH failed to break resistance, bearish pattern', action: 'Opened short position ETH 2x', reasoning: 'Double top pattern forming at $3250. RSI divergence. Expecting retracement to $3150' },
      { id: '5', time: '2024-10-31 11:10', trigger: 'Price Movement', context: 'SOL bullish flag pattern breakout', action: 'Opened long position SOL 3x', reasoning: 'Bullish flag pattern completed. Volume confirmation. Target $105 with trailing stop' },
      { id: '6', time: '2024-10-30 15:30', trigger: 'Price Movement', context: 'BTC head and shoulders pattern forming', action: 'Opened short position BTC 2x', reasoning: 'Head and shoulders pattern detected. Neckline at $43800. Target $43000. Risk/reward 2:1' },
      { id: '7', time: '2024-10-30 07:00', trigger: 'Price Movement', context: 'ETH support bounce at $3150', action: 'Opened long position ETH 3x', reasoning: 'Strong support level held. Bullish engulfing candle. Volume increasing. Target $3250' },
      { id: '8', time: '2024-10-29 18:20', trigger: 'Price Movement', context: 'SOL overbought at $104', action: 'Opened short position SOL 2x', reasoning: 'RSI at 78, overbought. Price at resistance. Expecting pullback to $98-99 range' },
    ],
  },
  '6': {
    id: '6',
    name: 'BONK Pulse',
    creator: '0x1a5c...7e3d',
    strategy: 'BONK social volume tracker. Monitors Solana ecosystem sentiment and community activity.',
    funded: 0,
    pnl: 9872.45,

    // PRD-Aligned Memecoin Fields
    memecoin: 'BONK',
    mTokensMined: 1580,
    oracleContributions: 112,

    winRate: 64.8,
    sharpeRatio: 2.5,
    maxDrawdown: 10.2,
    avgTradeDuration: '5h 30m',
    totalTrades: 112,
    totalDeposits: 51200,
    collateralStake: 750,
    investorCount: 16,
    triggers: ['Volume Spike'],
    contexts: ['Market', 'On-chain'],
    isPublished: true,
    performanceData: [
      { date: 'Oct 18', value: 10000 },
      { date: 'Oct 20', value: 10300 },
      { date: 'Oct 22', value: 10900 },
      { date: 'Oct 24', value: 10600 },
      { date: 'Oct 26', value: 11200 },
      { date: 'Oct 28', value: 10900 },
      { date: 'Oct 30', value: 11400 },
      { date: 'Nov 1', value: 11100 },
      { date: 'Nov 3', value: 11872 },
    ],
    positions: [
      { id: '1', asset: 'SOL/USD', type: 'Long', entry: 98.5, current: 102.3, pnl: 380, leverage: '3x', txHash: '0xcccc...dddd' },
      { id: '2', asset: 'AVAX/USD', type: 'Short', entry: 38.5, current: 37.2, pnl: 130, leverage: '2x', txHash: '0xdddd...eeee' },
      { id: '3', asset: 'MATIC/USD', type: 'Long', entry: 0.86, current: 0.89, pnl: 175, leverage: '3x', txHash: '0xeeee...ffff' },
      { id: '4', asset: 'LINK/USD', type: 'Short', entry: 14.6, current: 14.0, pnl: 420, leverage: '4x', txHash: '0xffff...0000' },
    ],
    completedTrades: [
      { id: '1', date: '2024-11-03 08:00', asset: 'MATIC/USD', type: 'Long', entry: 0.85, exit: 0.89, pnl: 235, duration: '5h 30m', txHash: '0xeeee...ffff' },
      { id: '2', date: '2024-11-02 12:20', asset: 'LINK/USD', type: 'Short', entry: 14.5, exit: 14.1, pnl: 160, duration: '3h 45m', txHash: '0xffff...0000' },
      { id: '3', date: '2024-11-02 05:15', asset: 'SOL/USD', type: 'Long', entry: 97.5, exit: 100.2, pnl: 270, duration: '6h 20m', txHash: '0x0000...1111' },
      { id: '4', date: '2024-11-01 20:30', asset: 'AVAX/USD', type: 'Short', entry: 39.2, exit: 37.8, pnl: 280, duration: '4h 15m', txHash: '0x1111...2222' },
      { id: '5', date: '2024-11-01 13:45', asset: 'MATIC/USD', type: 'Short', entry: 0.88, exit: 0.85, pnl: 170, duration: '3h 30m', txHash: '0x2222...3333' },
      { id: '6', date: '2024-10-31 17:00', asset: 'LINK/USD', type: 'Long', entry: 14.2, exit: 14.8, pnl: 360, duration: '7h 10m', txHash: '0x3333...4444' },
      { id: '7', date: '2024-10-31 09:20', asset: 'SOL/USD', type: 'Short', entry: 100.5, exit: 98.2, pnl: 230, duration: '5h 45m', txHash: '0x4444...5555' },
      { id: '8', date: '2024-10-30 22:15', asset: 'AVAX/USD', type: 'Long', entry: 37.5, exit: 39.1, pnl: 320, duration: '8h 30m', txHash: '0x5555...6666' },
      { id: '9', date: '2024-10-30 14:40', asset: 'MATIC/USD', type: 'Long', entry: 0.83, exit: 0.87, pnl: 241, duration: '6h 15m', txHash: '0x6666...7777' },
      { id: '10', date: '2024-10-29 19:30', asset: 'LINK/USD', type: 'Short', entry: 14.8, exit: 14.3, pnl: 250, duration: '4h 20m', txHash: '0x7777...8888' },
      { id: '11', date: '2024-10-29 11:00', asset: 'SOL/USD', type: 'Long', entry: 96.8, exit: 99.5, pnl: 270, duration: '7h 30m', txHash: '0x8888...9999' },
      { id: '12', date: '2024-10-28 16:45', asset: 'AVAX/USD', type: 'Short', entry: 38.8, exit: 37.2, pnl: 320, duration: '5h 10m', txHash: '0x9999...aaaa' },
    ],
    transactions: [
      { id: '1', type: 'Creation', amount: 10, date: '2024-10-10 10:00', txHash: '0xaaaa...bbbb', chain: 'Ethereum' },
      { id: '2', type: 'Deposit', amount: 4000, date: '2024-10-10 10:15', txHash: '0xcccc...dddd', chain: 'Ethereum' },
      { id: '3', type: 'Trade', amount: 235, date: '2024-11-03 08:00', txHash: '0xeeee...ffff', chain: 'Ethereum' },
      { id: '4', type: 'Trade', amount: 160, date: '2024-11-02 12:20', txHash: '0xffff...0000', chain: 'Ethereum' },
      { id: '5', type: 'Trade', amount: 270, date: '2024-11-02 05:15', txHash: '0x0000...1111', chain: 'Ethereum' },
      { id: '6', type: 'Trade', amount: 280, date: '2024-11-01 20:30', txHash: '0x1111...2222', chain: 'Ethereum' },
      { id: '7', type: 'Trade', amount: 170, date: '2024-11-01 13:45', txHash: '0x2222...3333', chain: 'Ethereum' },
      { id: '8', type: 'Deposit', amount: 2500, date: '2024-10-31 21:00', txHash: '0x3333...4444', chain: 'Ethereum' },
      { id: '9', type: 'Trade', amount: 360, date: '2024-10-31 17:00', txHash: '0x3333...4444', chain: 'Ethereum' },
      { id: '10', type: 'Trade', amount: 230, date: '2024-10-31 09:20', txHash: '0x4444...5555', chain: 'Ethereum' },
      { id: '11', type: 'Trade', amount: 320, date: '2024-10-30 22:15', txHash: '0x5555...6666', chain: 'Ethereum' },
      { id: '12', type: 'Trade', amount: 241, date: '2024-10-30 14:40', txHash: '0x6666...7777', chain: 'Ethereum' },
      { id: '13', type: 'Trade', amount: 250, date: '2024-10-29 19:30', txHash: '0x7777...8888', chain: 'Ethereum' },
      { id: '14', type: 'Trade', amount: 270, date: '2024-10-29 11:00', txHash: '0x8888...9999', chain: 'Ethereum' },
      { id: '15', type: 'Trade', amount: 320, date: '2024-10-28 16:45', txHash: '0x9999...aaaa', chain: 'Ethereum' },
    ],
    reasoningLog: [
      { id: '1', time: '2024-11-03 08:00', trigger: 'Volume Spike', context: 'MATIC volume increased 300% on Binance', action: 'Opened long position MATIC 3x', reasoning: 'Unusual volume spike detected across multiple exchanges. Volume 300% above 30-day average. Historical pattern: 75% probability of 5%+ price increase within 6 hours' },
      { id: '2', time: '2024-11-02 12:20', trigger: 'Volume Spike', context: 'LINK volume surge with price decline', action: 'Opened short position LINK 4x', reasoning: 'High volume sell-off detected. Volume spike with decreasing price suggests distribution. Bearish signal confirmed' },
      { id: '3', time: '2024-11-02 05:15', trigger: 'Volume Spike', context: 'SOL volume spike at support level', action: 'Opened long position SOL 3x', reasoning: 'Volume spike at key support $97.5. Accumulation pattern detected. Strong buying pressure' },
      { id: '4', time: '2024-11-01 20:30', trigger: 'Volume Spike', context: 'AVAX unusual volume pattern', action: 'Opened short position AVAX 2x', reasoning: 'Volume spike with price stagnation indicates distribution. Large sell orders detected on-chain' },
      { id: '5', time: '2024-11-01 13:45', trigger: 'Volume Spike', context: 'MATIC volume spike at resistance', action: 'Opened short position MATIC 2x', reasoning: 'Volume spike at resistance $0.88. Rejection pattern forming. Expecting pullback' },
      { id: '6', time: '2024-10-31 17:00', trigger: 'Volume Spike', context: 'LINK accumulation volume detected', action: 'Opened long position LINK 3x', reasoning: 'Unusual accumulation pattern. Multiple wallets buying LINK. Volume 250% above average. Bullish signal' },
      { id: '7', time: '2024-10-31 09:20', trigger: 'Volume Spike', context: 'SOL volume spike with bearish divergence', action: 'Opened short position SOL 2x', reasoning: 'Volume spike at $100.5 but price failing to break higher. Bearish divergence detected. Short entry' },
      { id: '8', time: '2024-10-30 22:15', trigger: 'Volume Spike', context: 'AVAX volume surge on multiple timeframes', action: 'Opened long position AVAX 3x', reasoning: 'Volume spike detected across 1h, 4h, and daily charts. Strong momentum indicator. Target $40' },
    ],
  },
  'kol-1': {
    id: 'kol-1',
    name: 'BTC Pulse (KOL)',
    creator: 'Opend\'Or Team',
    strategy: 'Bitcoin oracle by Ju Ki Young (CryptoQuant CEO). Tracks BTC whale positions, on-chain analytics, and institutional sentiment.',
    funded: 15000,
    pnl: 12450.75,

    // PRD-Aligned Memecoin Fields (BTC as honorary meme)
    memecoin: 'BTC',
    mTokensMined: 4850,
    oracleContributions: 156,

    winRate: 72.3,
    sharpeRatio: 2.9,
    maxDrawdown: 9.1,
    avgTradeDuration: '9h 20m',
    totalTrades: 156,
    totalDeposits: 125000,
    collateralStake: 2000,
    investorCount: 45,
    triggers: ['Whale Movement', 'On-chain Signal', 'Social Consensus'],
    contexts: ['Bitcoin', 'On-chain', 'Social Oracle'],
    status: 'active',
    isOwned: false,
    isPublished: true,
    sharpeTarget: 2.5,
    performanceData: [
      { time: '00:00', value: 15000 },
      { time: '04:00', value: 15200 },
      { time: '08:00', value: 15450 },
      { time: '12:00', value: 15780 },
      { time: '16:00', value: 16120 },
      { time: '20:00', value: 16350 },
      { time: '24:00', value: 16500 },
    ],
    positions: [
      { id: '1', asset: 'BTC/USD', type: 'Long', entry: 43250, current: 44120, pnl: 4350, leverage: '2x', txHash: '0xkol1...btc1' },
      { id: '2', asset: 'BTC/USD', type: 'Long', entry: 42800, current: 44120, pnl: 6560, leverage: '3x', txHash: '0xkol2...btc2' },
    ],
    completedTrades: [
      { id: '1', date: '2024-11-03 10:30', asset: 'BTC/USD', type: 'Long', entry: 43250, exit: 44120, pnl: 4350, duration: '8h 15m', txHash: '0xkol1...btc1' },
      { id: '2', date: '2024-11-02 14:20', asset: 'BTC/USD', type: 'Long', entry: 42800, exit: 43500, pnl: 3500, duration: '12h 30m', txHash: '0xkol2...btc2' },
      { id: '3', date: '2024-11-01 18:45', asset: 'BTC/USD', type: 'Long', entry: 42500, exit: 43200, pnl: 2800, duration: '10h 20m', txHash: '0xkol3...btc3' },
    ],
    transactions: [
      { id: '1', type: 'Creation', amount: 50, date: '2024-10-15 10:00', txHash: '0xkol...init', chain: 'Ethereum' },
      { id: '2', type: 'Deposit', amount: 15000, date: '2024-10-15 10:15', txHash: '0xkol...dep1', chain: 'Ethereum' },
      { id: '3', type: 'Trade', amount: 4350, date: '2024-11-03 10:30', txHash: '0xkol1...btc1', chain: 'Ethereum' },
      { id: '4', type: 'Trade', amount: 3500, date: '2024-11-02 14:20', txHash: '0xkol2...btc2', chain: 'Ethereum' },
      { id: '5', type: 'Trade', amount: 2800, date: '2024-11-01 18:45', txHash: '0xkol3...btc3', chain: 'Ethereum' },
    ],
    reasoningLog: [
      { id: '1', time: '2024-11-03 10:30', trigger: 'Whale Movement', context: 'Ju Ki Young: Large Bitcoin whale accumulation detected - 15,000 BTC moved to cold storage', action: 'Opened long position BTC 2x', reasoning: 'Following Ju Ki Young\'s analysis: Whale accumulation pattern indicates strong bullish sentiment. Historical correlation: 80% probability of 3-5% price increase within 24h' },
      { id: '2', time: '2024-11-02 14:20', trigger: 'On-chain Signal', context: 'Ju Ki Young: Exchange outflow spike - 8,500 BTC withdrawn from exchanges', action: 'Opened long position BTC 3x', reasoning: 'Social oracle signal: Exchange outflow indicates accumulation phase. Following CryptoQuant CEO\'s trading logic' },
      { id: '3', time: '2024-11-01 18:45', trigger: 'Social Consensus', context: 'Ju Ki Young: Bitcoin MVRV ratio suggests undervaluation zone', action: 'Opened long position BTC 2x', reasoning: 'Social oracle consensus: MVRV ratio below 1.5 indicates buying opportunity. Mirroring KOL trading pattern' },
    ],
  },
}

// Get agent by ID
export function getAgentById(id: string): AgentDetailData | undefined {
  return allAgentsData[id]
}

// Fallback: allow lookup by memecoin symbol or compound ID to support on-chain agents
// Compound ID format: {SYMBOL}-{ADDRESS}-{INDEX} e.g., DOGE-0x95ed40013Cb3990013Af947a635D1A3E31057426-0
export function getAgentBySlug(idOrSymbol: string): AgentDetailData | undefined {
  // Try direct lookup first (for mock agents like '1', '2', 'kol-1')
  const direct = getAgentById(idOrSymbol)
  if (direct) return direct

  // Try parsing as compound ID: SYMBOL-ADDRESS-INDEX
  const parts = idOrSymbol.split('-')
  if (parts.length >= 3 && parts[1].startsWith('0x')) {
    // Compound ID format: SYMBOL-ADDRESS-INDEX
    const symbol = parts[0].toUpperCase()
    const address = parts[1] as `0x${string}`
    const index = parseInt(parts[2], 10)
    
    const supported = getSupportedMemecoins()
    if (!supported.includes(symbol)) return undefined

    return {
      id: idOrSymbol,
      address,
      name: `${symbol} Agent #${index + 1}`,
      creator: address,
      strategy: 'On-chain oracle agent',
      funded: 0,
      pnl: 0,
      memecoin: symbol,
      mTokensMined: 0,
      oracleContributions: 0,
      winRate: 0,
      sharpeRatio: 0,
      triggers: [],
      contexts: [],
      performanceData: [],
      positions: [],
      completedTrades: [],
      transactions: [],
      reasoningLog: [],
    }
  }

  // Fallback: simple symbol lookup (e.g., "DOGE")
  const symbol = idOrSymbol.toUpperCase()
  const supported = getSupportedMemecoins()
  if (!supported.includes(symbol)) return undefined

  return {
    id: symbol,
    address: SEED_AGENT.ADDRESS,
    name: `${symbol} Agent`,
    creator: SEED_AGENT.ADDRESS,
    strategy: 'On-chain oracle agent',
    funded: 0,
    pnl: 0,
    memecoin: symbol,
    mTokensMined: 0,
    oracleContributions: 0,
    winRate: 0,
    sharpeRatio: 0,
    triggers: [],
    contexts: [],
    performanceData: [],
    positions: [],
    completedTrades: [],
    transactions: [],
    reasoningLog: [],
  }
}

// Get all user-owned agents
export function getUserAgents(): AgentCardProps[] {
  return Object.values(allAgentsData)
    .filter(agent => agent.isOwned)
    .map(agent => ({
      id: agent.id,
      name: agent.name,
      strategy: agent.strategy,
      funded: agent.funded,
      pnl: agent.pnl,

      // PRD-Aligned fields
      memecoin: agent.memecoin,
      mTokensMined: agent.mTokensMined,
      oracleContributions: agent.oracleContributions,

      winRate: agent.winRate,
      sharpeRatio: agent.sharpeRatio,
      isOwned: true,
      status: agent.status,
      isPublished: agent.isPublished,
      sharpeTarget: agent.sharpeTarget,
      totalDeposits: agent.totalDeposits,
      collateralStake: agent.collateralStake,
      investorCount: agent.investorCount,
      triggers: agent.triggers,
      contexts: agent.contexts,
      performanceData: agent.performanceData.map(p => ({ time: 'time' in p ? p.time : p.date, value: p.value })),
      qualificationCriteria: agent.qualificationCriteria,
    }))
}

// Get all public/marketplace agents
export function getPublicAgents(): AgentCardProps[] {
  return Object.values(allAgentsData)
    .filter(agent => agent.isPublished)
    .map(agent => {
      // Check if this is a KOL agent - only BTC Pulse (KOL)
      const isKOL = agent.id === 'kol-1' || agent.name === 'BTC Pulse (KOL)'
      const kolName = isKOL ? 'Ju Ki Young' : undefined

      return {
        id: agent.id,
        name: agent.name,
        creator: agent.creator,
        strategy: agent.strategy,
        funded: agent.funded,
        pnl: agent.pnl,

        // PRD-Aligned fields
        memecoin: agent.memecoin,
        mTokensMined: agent.mTokensMined,
        oracleContributions: agent.oracleContributions,

        winRate: agent.winRate,
        sharpeRatio: agent.sharpeRatio,
        totalDeposits: agent.totalDeposits,
        collateralStake: agent.collateralStake,
        investorCount: agent.investorCount,
        triggers: agent.triggers,
        contexts: agent.contexts,
        performanceData: agent.performanceData.map(p => ({ time: 'time' in p ? p.time : p.date, value: p.value })),
        isKOL,
        kolName,
        socialOracle: isKOL ? {
          status: 'active' as const,
          lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          followerCount: 1247,
          tradingSignals: 156,
        } : undefined,
      }
    })
}

