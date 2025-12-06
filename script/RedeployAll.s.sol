// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/AgentRegistry.sol";
import "../contracts/Aggregator.sol";
import "../contracts/MTokenDistributor.sol";
import "../contracts/PriceFeed.sol";
import "../contracts/MToken.sol";

/**
 * @title RedeployAll
 * @notice Redeploys AgentRegistry, Aggregator, MTokenDistributor with new registrar auth
 * @dev Run with: forge script script/RedeployAll.s.sol:RedeployAll --rpc-url memecore --broadcast -vvv
 * 
 * Keeps existing:
 * - ProtocolConfig (no changes)
 * - PriceFeeds (update their aggregator reference)
 * - WrappedM token (no changes)
 * - MToken (no changes)
 */
contract RedeployAll is Script {
    // Existing deployed contracts to KEEP
    address constant PROTOCOL_CONFIG = 0xC81536da58b4b2e4ff433FE511bF0e035576eC15;
    address constant M_TOKEN = 0xCe5Ab1Eb28f45552b0DB6792979Ab0A8502d09Fa; // Original MToken for distributor
    address constant WM_TOKEN = 0x07Aa8b1f50176A6783f5C710c0802f8871000920; // WrappedM we deployed
    
    // Price Feeds to UPDATE (they have setAggregator function)
    address constant PRICE_FEED_DOGE = 0x30490c9239FDc6ff8FEEF84FF6f7B657Ec6882F8;
    address constant PRICE_FEED_PEPE = 0x5DbD29ca81385606888112288bbAe95f0Eb9f170;
    address constant PRICE_FEED_SHIB = 0xa35F2923f8C6a8E9D2F655AB4cfb373864E6cC89;
    address constant PRICE_FEED_FLOKI = 0xF34772793a37Cab10E13B7fb686f93445e0f4339;
    address constant PRICE_FEED_WIF = 0xf11B4128624461839165F46cC3eF30eA84fb4DBC;
    address constant PRICE_FEED_BONK = 0x1e44CFA2C04F9bbe1C612673BC808C214bA04941;
    address constant PRICE_FEED_BTC = 0xBB906be3676b1d6872cdcA58E336Aea089c698b0;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("========================================");
        console.log("=== RedeployAll Script ===");
        console.log("========================================");
        console.log("Deployer:", deployer);
        console.log("Chain: MemeCore Testnet");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // ============================================
        // Step 1: Deploy new AgentRegistry
        // ============================================
        console.log("\n--- Step 1: Deploying AgentRegistry (with registrar role) ---");
        AgentRegistry newRegistry = new AgentRegistry();
        console.log("AgentRegistry deployed:", address(newRegistry));
        
        // ============================================
        // Step 2: Deploy new MTokenDistributor
        // ============================================
        console.log("\n--- Step 2: Deploying MTokenDistributor ---");
        MTokenDistributor newDistributor = new MTokenDistributor(
            M_TOKEN,
            address(newRegistry),
            PROTOCOL_CONFIG
        );
        console.log("MTokenDistributor deployed:", address(newDistributor));
        
        // ============================================
        // Step 3: Deploy new Aggregator
        // ============================================
        console.log("\n--- Step 3: Deploying Aggregator ---");
        Aggregator newAggregator = new Aggregator(
            address(newRegistry),
            address(newDistributor),
            PROTOCOL_CONFIG
        );
        console.log("Aggregator deployed:", address(newAggregator));
        
        // ============================================
        // Step 4: Configure AgentRegistry
        // ============================================
        console.log("\n--- Step 4: Configuring AgentRegistry ---");
        newRegistry.setAggregator(address(newAggregator));
        newRegistry.setDistributor(address(newDistributor));
        console.log("Registry configured with Aggregator and Distributor");
        
        // ============================================
        // Step 5: Configure MTokenDistributor
        // ============================================
        console.log("\n--- Step 5: Configuring MTokenDistributor ---");
        newDistributor.setAggregator(address(newAggregator));
        console.log("Distributor configured with Aggregator");
        
        // ============================================
        // Step 6: Configure Aggregator with PriceFeeds
        // ============================================
        console.log("\n--- Step 6: Setting PriceFeeds in Aggregator ---");
        newAggregator.setPriceFeed("DOGE", PRICE_FEED_DOGE);
        newAggregator.setPriceFeed("PEPE", PRICE_FEED_PEPE);
        newAggregator.setPriceFeed("SHIB", PRICE_FEED_SHIB);
        newAggregator.setPriceFeed("FLOKI", PRICE_FEED_FLOKI);
        newAggregator.setPriceFeed("WIF", PRICE_FEED_WIF);
        newAggregator.setPriceFeed("BONK", PRICE_FEED_BONK);
        newAggregator.setPriceFeed("BTC", PRICE_FEED_BTC);
        console.log("All 7 PriceFeeds configured in Aggregator");
        
        // ============================================
        // Step 7: Update PriceFeeds to point to new Aggregator
        // ============================================
        console.log("\n--- Step 7: Updating PriceFeeds to new Aggregator ---");
        PriceFeed(PRICE_FEED_DOGE).setAggregator(address(newAggregator));
        PriceFeed(PRICE_FEED_PEPE).setAggregator(address(newAggregator));
        PriceFeed(PRICE_FEED_SHIB).setAggregator(address(newAggregator));
        PriceFeed(PRICE_FEED_FLOKI).setAggregator(address(newAggregator));
        PriceFeed(PRICE_FEED_WIF).setAggregator(address(newAggregator));
        PriceFeed(PRICE_FEED_BONK).setAggregator(address(newAggregator));
        PriceFeed(PRICE_FEED_BTC).setAggregator(address(newAggregator));
        console.log("All 7 PriceFeeds updated to new Aggregator");
        
        vm.stopBroadcast();
        
        // ============================================
        // Summary
        // ============================================
        console.log("\n========================================");
        console.log("=== DEPLOYMENT COMPLETE ===");
        console.log("========================================");
        console.log("\nNEW CONTRACTS (update lib/contracts.ts):");
        console.log("----------------------------------------");
        console.log("AGENT_REGISTRY:", address(newRegistry));
        console.log("AGGREGATOR:", address(newAggregator));
        console.log("M_TOKEN_DISTRIBUTOR:", address(newDistributor));
        console.log("\nKEPT EXISTING:");
        console.log("----------------------------------------");
        console.log("PROTOCOL_CONFIG:", PROTOCOL_CONFIG);
        console.log("WM_TOKEN:", WM_TOKEN);
        console.log("PRICE_FEEDS: (unchanged addresses)");
        console.log("\n!!! COPY THE NEW ADDRESSES ABOVE TO lib/contracts.ts !!!");
    }
}

