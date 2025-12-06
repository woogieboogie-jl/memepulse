/**
 * MemePulse Contract Registry
 * 
 * Central source of truth for all contract addresses on MemeCore Testnet.
 * Chain ID: 43522 (Insectarium Testnet)
 * 
 * Last updated: After RedeployAll.s.sol execution
 */

// ============================================
// CORE CONTRACTS
// ============================================

export const CONTRACTS = {
  // Agent management with registrar-based access control
  AGENT_REGISTRY: '0xd49df845D77Dd02DE442197BE0D4ccde0A076738',
  
  // Oracle aggregation - receives updates, calculates VCWAP
  // Fixed: Now requires msg.sender == agent (auth fix Dec 2024)
  AGGREGATOR: '0xFeAB9a221f6bcDb4c160cD81954eE4405EdF0e35',
  
  // Epoch-based reward distribution
  M_TOKEN_DISTRIBUTOR: '0xaa6b8aD37f435Dc7e095ba6a20b6b2e7E0e285a1',
  
  // Protocol parameters (epoch duration, reward rates, etc.)
  PROTOCOL_CONFIG: '0xC81536da58b4b2e4ff433FE511bF0e035576eC15',
  
  // Wrapped M token (ERC20) - 1M supply
  WM_TOKEN: '0x07Aa8b1f50176A6783f5C710c0802f8871000920',
  
  // Per-memecoin Chainlink-compatible price feeds
  PRICE_FEEDS: {
    DOGE: '0x30490c9239FDc6ff8FEEF84FF6f7B657Ec6882F8',
    PEPE: '0x5DbD29ca81385606888112288bbAe95f0Eb9f170',
    SHIB: '0xa35F2923f8C6a8E9D2F655AB4cfb373864E6cC89',
    FLOKI: '0xF34772793a37Cab10E13B7fb686f93445e0f4339',
    WIF: '0xf11B4128624461839165F46cC3eF30eA84fb4DBC',
    BONK: '0x1e44CFA2C04F9bbe1C612673BC808C214bA04941',
    BTC: '0xBB906be3676b1d6872cdcA58E336Aea089c698b0',
  }
} as const;

// ============================================
// SEED AGENTS (Demo/Test Data)
// ============================================

// Seed agent for demo data
// With auth fix, the deployer wallet acts as the seed agent for all feeds
// This allows us to submit seed updates (since we have the private key)
export const SEED_AGENT = {
  // Deployer wallet - registered as agent for ALL feeds
  ADDRESS: '0x95ed40013Cb3990013Af947a635D1A3E31057426',
  FEEDS: ['DOGE', 'PEPE', 'SHIB', 'FLOKI', 'WIF', 'BONK', 'BTC'],
} as const;

// ============================================
// NETWORK CONFIGURATION
// ============================================

export const MEMECORE_NETWORK = {
  chainId: 43522,
  chainName: 'MemeCore Insectarium Testnet',
  rpcUrl: 'https://rpc-testnet.memecore.com',
  blockExplorer: 'https://testnet.memecorescan.io',
  nativeCurrency: {
    name: 'M',
    symbol: 'M',
    decimals: 18,
  },
} as const;

// ============================================
// MEMECOIN METADATA
// ============================================

export const MEMECOIN_INFO: Record<string, {
  name: string;
  emoji: string;
  rewardMultiplier: number; // Basis points (10000 = 1x)
}> = {
  DOGE: { name: 'Dogecoin', emoji: '🐕', rewardMultiplier: 10000 },
  PEPE: { name: 'Pepe', emoji: '🐸', rewardMultiplier: 12000 },
  SHIB: { name: 'Shiba Inu', emoji: '🐕‍🦺', rewardMultiplier: 10000 },
  FLOKI: { name: 'Floki', emoji: '🐺', rewardMultiplier: 11000 },
  WIF: { name: 'dogwifhat', emoji: '🎩', rewardMultiplier: 13000 },
  BONK: { name: 'Bonk', emoji: '💥', rewardMultiplier: 12000 },
  BTC: { name: 'Bitcoin', emoji: '₿', rewardMultiplier: 8000 },
};

// ============================================
// CONTRACT ABIS (Human-Readable)
// ============================================

export const ABIS = {
  AGENT_REGISTRY: [
    "function getCredibility(address agent) external view returns (uint256)",
    "function isRegistered(address agent, string feedSymbol) external view returns (bool)",
    "function getAgentStats(address agent) external view returns (uint256 updates, uint256 credibility, uint256 avgAccuracy)",
    "function updateCount(address agent) external view returns (uint256)",
    "function credibilityScores(address agent) external view returns (uint256)",
    "function registrars(address) external view returns (bool)",
    "function isRegistrar(address account) external view returns (bool)",
    // Write functions (for registrars)
    "function registerAgent(address agent, string feedSymbol) external",
    "function setRegistrar(address registrar, bool authorized) external"
  ],
  AGGREGATOR: [
    "function calculateVWAP(string feedSymbol) external view returns (uint256)",
    "function getUpdateCount(string feedSymbol) external view returns (uint256)",
    "function getLastNUpdates(string feedSymbol, uint256 n) external view returns (tuple(uint256 price, uint256 volume, bool isLong, uint8 leverage, uint256 timestamp, bytes32 orderlyTxHash, address agent)[])",
    "event UpdateSubmitted(address indexed agent, string indexed feedSymbol, uint256 price, uint256 volume, uint256 timestamp, bytes32 orderlyTxHash)",
    // Write function
    "function submitUpdate(address agent, string feedSymbol, tuple(uint256 price, uint256 volume, bool isLong, uint8 leverage, uint256 timestamp, bytes32 orderlyTxHash, address agent) report) external"
  ],
  M_TOKEN_DISTRIBUTOR: [
    "function currentEpoch() external view returns (uint256)",
    "function epochStartTime() external view returns (uint256)",
    "function getTimeUntilNextEpoch() external view returns (uint256)",
    "function getCurrentEpochStats(address agent) external view returns (uint256 updates, uint256 volume, uint256 credibility)",
    "function calculateReward(address agent, uint256 epoch) external view returns (uint256)",
    "function getClaimableRewards(address agent, uint256 epoch) external view returns (uint256)",
    "function claimRewards(uint256 epoch) external",
    "function claimed(uint256 epoch, address agent) external view returns (bool)",
    "function agentVolume(uint256 epoch, address agent) external view returns (uint256)",
    "function epochTotalVolume(uint256 epoch) external view returns (uint256)",
    "function epochTotalReward(uint256 epoch) external view returns (uint256)"
  ],
  PROTOCOL_CONFIG: [
    "function epochDuration() external view returns (uint256)",
    "function baseRewardPerUpdate() external view returns (uint256)",
    "function maxUpdatesForVCWAP() external view returns (uint256)",
    "function minCredibility() external view returns (uint256)",
    "function getFeedReward(string feedSymbol) external view returns (uint256)",
    "function feedRewardMultipliers(string) external view returns (uint256)",
    // Write function
    "function setFeedMultiplier(string feedSymbol, uint256 multiplier) external"
  ],
  PRICE_FEED: [
    "function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
    "function decimals() external view returns (uint8)",
    "function currentRoundId() external view returns (uint80)",
    "function symbol() external view returns (string)",
    "function description() external view returns (string)"
  ],
  WM_TOKEN: [
    "function balanceOf(address account) external view returns (uint256)",
    "function totalSupply() external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string)",
    "function name() external view returns (string)",
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)"
  ]
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getSupportedMemecoins(): string[] {
  return Object.keys(CONTRACTS.PRICE_FEEDS);
}

export function getPriceFeedAddress(symbol: string): string | undefined {
  return CONTRACTS.PRICE_FEEDS[symbol as keyof typeof CONTRACTS.PRICE_FEEDS];
}

export function getMemecoinEmoji(symbol: string): string {
  return MEMECOIN_INFO[symbol]?.emoji || '🪙';
}

export function getMemecoinName(symbol: string): string {
  return MEMECOIN_INFO[symbol]?.name || symbol;
}

export function isMemecoinSupported(symbol: string): boolean {
  return symbol.toUpperCase() in CONTRACTS.PRICE_FEEDS;
}
