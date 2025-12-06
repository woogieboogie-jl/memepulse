// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/AgentRegistry.sol";
import "../contracts/Aggregator.sol";
import "../contracts/ProtocolConfig.sol";

/**
 * @title SeedData
 * @notice Seeds the oracle with initial demo data
 * @dev Run with: forge script script/SeedData.s.sol:SeedData --rpc-url memecore --broadcast -vvv
 * 
 * This script:
 * 1. Sets feed reward multipliers in ProtocolConfig
 * 2. Registers deployer as seed agent for each feed
 * 3. Submits initial price updates (deployer signs as the agent)
 * 
 * NOTE: With the auth fix (msg.sender == agent), we use the deployer wallet
 * as the seed agent since we need the private key to sign transactions.
 */
contract SeedData is Script {
    // Deployed contracts
    address constant AGENT_REGISTRY = 0xd49df845D77Dd02DE442197BE0D4ccde0A076738;
    address constant AGGREGATOR = 0xFeAB9a221f6bcDb4c160cD81954eE4405EdF0e35; // New with auth fix
    address constant PROTOCOL_CONFIG = 0xC81536da58b4b2e4ff433FE511bF0e035576eC15;
    
    // Salt for unique tx hashes
    bytes32 constant SEED_SALT = keccak256("MEMEPULSE_SEED_V2");
    
    // Feed symbols
    string[] internal symbols;
    
    // Realistic prices (8 decimals)
    uint256 constant PRICE_DOGE = 8500000;        // $0.085
    uint256 constant PRICE_PEPE = 1200;           // $0.000012
    uint256 constant PRICE_SHIB = 780;            // $0.0000078
    uint256 constant PRICE_FLOKI = 16000;         // $0.00016
    uint256 constant PRICE_WIF = 42000000;        // $0.42
    uint256 constant PRICE_BONK = 350;            // $0.0000035
    uint256 constant PRICE_BTC = 4325000000000;   // $43,250
    
    // Volume in USD (8 decimals) - realistic daily volumes
    uint256 constant VOLUME_DOGE = 12500000000000;   // $125K
    uint256 constant VOLUME_PEPE = 8900000000000;    // $89K
    uint256 constant VOLUME_SHIB = 6700000000000;    // $67K
    uint256 constant VOLUME_FLOKI = 15600000000000;  // $156K
    uint256 constant VOLUME_WIF = 9800000000000;     // $98K
    uint256 constant VOLUME_BONK = 11200000000000;   // $112K
    uint256 constant VOLUME_BTC = 58000000000000;    // $580K
    
    // Reward multipliers (basis points, 10000 = 1x)
    uint256 constant MULT_DOGE = 10000;  // 1.0x baseline
    uint256 constant MULT_PEPE = 12000;  // 1.2x high volatility
    uint256 constant MULT_SHIB = 10000;  // 1.0x baseline
    uint256 constant MULT_FLOKI = 11000; // 1.1x medium
    uint256 constant MULT_WIF = 13000;   // 1.3x needs liquidity
    uint256 constant MULT_BONK = 12000;  // 1.2x high volatility
    uint256 constant MULT_BTC = 8000;    // 0.8x stable

    constructor() {
        symbols.push("DOGE");
        symbols.push("PEPE");
        symbols.push("SHIB");
        symbols.push("FLOKI");
        symbols.push("WIF");
        symbols.push("BONK");
        symbols.push("BTC");
    }

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("========================================");
        console.log("=== SeedData Script (v2 - Auth Fix) ===");
        console.log("========================================");
        console.log("Deployer (Seed Agent):", deployer);
        console.log("NOTE: Deployer is registered as agent for all feeds");
        
        AgentRegistry registry = AgentRegistry(AGENT_REGISTRY);
        Aggregator aggregator = Aggregator(AGGREGATOR);
        ProtocolConfig config = ProtocolConfig(PROTOCOL_CONFIG);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // ============================================
        // Step 1: Set Feed Reward Multipliers
        // ============================================
        console.log("\n--- Step 1: Setting Feed Reward Multipliers ---");
        config.setFeedMultiplier("DOGE", MULT_DOGE);
        config.setFeedMultiplier("PEPE", MULT_PEPE);
        config.setFeedMultiplier("SHIB", MULT_SHIB);
        config.setFeedMultiplier("FLOKI", MULT_FLOKI);
        config.setFeedMultiplier("WIF", MULT_WIF);
        config.setFeedMultiplier("BONK", MULT_BONK);
        config.setFeedMultiplier("BTC", MULT_BTC);
        console.log("Feed multipliers configured");
        
        // ============================================
        // Step 2: Register Deployer as Seed Agent
        // ============================================
        console.log("\n--- Step 2: Registering Deployer as Seed Agent ---");
        
        // Register deployer for all feeds (skip if already registered)
        _tryRegister(registry, deployer, "DOGE");
        _tryRegister(registry, deployer, "PEPE");
        _tryRegister(registry, deployer, "SHIB");
        _tryRegister(registry, deployer, "FLOKI");
        _tryRegister(registry, deployer, "WIF");
        _tryRegister(registry, deployer, "BONK");
        _tryRegister(registry, deployer, "BTC");
        
        console.log("Deployer registered for all 7 feeds");
        
        // ============================================
        // Step 3: Submit Initial Price Updates
        // ============================================
        console.log("\n--- Step 3: Submitting Initial Price Updates ---");
        
        // All updates are from deployer (who is now msg.sender)
        _submitUpdate(aggregator, deployer, "DOGE", PRICE_DOGE, VOLUME_DOGE, 1);
        console.log("DOGE price submitted: $0.085");
        
        _submitUpdate(aggregator, deployer, "PEPE", PRICE_PEPE, VOLUME_PEPE, 2);
        console.log("PEPE price submitted: $0.000012");
        
        _submitUpdate(aggregator, deployer, "SHIB", PRICE_SHIB, VOLUME_SHIB, 3);
        console.log("SHIB price submitted: $0.0000078");
        
        _submitUpdate(aggregator, deployer, "FLOKI", PRICE_FLOKI, VOLUME_FLOKI, 4);
        console.log("FLOKI price submitted: $0.00016");
        
        _submitUpdate(aggregator, deployer, "WIF", PRICE_WIF, VOLUME_WIF, 5);
        console.log("WIF price submitted: $0.42");
        
        _submitUpdate(aggregator, deployer, "BONK", PRICE_BONK, VOLUME_BONK, 6);
        console.log("BONK price submitted: $0.0000035");
        
        _submitUpdate(aggregator, deployer, "BTC", PRICE_BTC, VOLUME_BTC, 7);
        console.log("BTC price submitted: $43,250");
        
        vm.stopBroadcast();
        
        // ============================================
        // Summary
        // ============================================
        console.log("\n========================================");
        console.log("=== SEED DATA COMPLETE ===");
        console.log("========================================");
        console.log("\nSEED AGENT (Deployer):", deployer);
        console.log("Registered for: DOGE, PEPE, SHIB, FLOKI, WIF, BONK, BTC");
        console.log("\nAll feeds now have initial oracle data!");
        console.log("Frontend should display real prices.");
    }
    
    function _tryRegister(AgentRegistry registry, address agent, string memory feedSymbol) internal {
        // Try to register, ignore if already registered
        try registry.registerAgent(agent, feedSymbol) {
            console.log("Registered for", feedSymbol);
        } catch {
            console.log("Already registered for", feedSymbol);
        }
    }
    
    function _submitUpdate(
        Aggregator aggregator,
        address agent,
        string memory feedSymbol,
        uint256 price,
        uint256 volume,
        uint256 txIndex
    ) internal {
        // Generate unique tx hash for this seed update
        bytes32 txHash = keccak256(abi.encodePacked(SEED_SALT, "TX", feedSymbol, txIndex, block.timestamp));
        
        Aggregator.AgentUpdateReport memory report = Aggregator.AgentUpdateReport({
            price: price,
            volume: volume,
            isLong: true,
            leverage: 2,
            timestamp: block.timestamp,
            orderlyTxHash: txHash,
            agent: agent
        });
        
        // Now msg.sender (deployer) == agent, so this works with the auth fix
        aggregator.submitUpdate(agent, feedSymbol, report);
    }
}

