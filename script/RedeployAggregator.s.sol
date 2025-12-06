// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/Aggregator.sol";
import "../contracts/AgentRegistry.sol";
import "../contracts/MTokenDistributor.sol";
import "../contracts/PriceFeed.sol";

/**
 * @title RedeployAggregator
 * @notice Redeploys Aggregator with msg.sender == agent authentication fix
 * @dev Run with: forge script script/RedeployAggregator.s.sol:RedeployAggregator --rpc-url memecore --broadcast -vvv
 */
contract RedeployAggregator is Script {
    // Current deployed contracts
    address constant AGENT_REGISTRY = 0xd49df845D77Dd02DE442197BE0D4ccde0A076738;
    address constant M_TOKEN_DISTRIBUTOR = 0xaa6b8aD37f435Dc7e095ba6a20b6b2e7E0e285a1;
    address constant PROTOCOL_CONFIG = 0xC81536da58b4b2e4ff433FE511bF0e035576eC15;
    
    // Price Feeds to update
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
        console.log("=== RedeployAggregator Script ===");
        console.log("========================================");
        console.log("Deployer:", deployer);
        console.log("Fix: Added msg.sender == agent authentication");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // ============================================
        // Step 1: Deploy new Aggregator with fix
        // ============================================
        console.log("\n--- Step 1: Deploying new Aggregator (with auth fix) ---");
        Aggregator newAggregator = new Aggregator(
            AGENT_REGISTRY,
            M_TOKEN_DISTRIBUTOR,
            PROTOCOL_CONFIG
        );
        console.log("New Aggregator deployed:", address(newAggregator));
        
        // ============================================
        // Step 2: Configure Aggregator with PriceFeeds
        // ============================================
        console.log("\n--- Step 2: Setting PriceFeeds in new Aggregator ---");
        newAggregator.setPriceFeed("DOGE", PRICE_FEED_DOGE);
        newAggregator.setPriceFeed("PEPE", PRICE_FEED_PEPE);
        newAggregator.setPriceFeed("SHIB", PRICE_FEED_SHIB);
        newAggregator.setPriceFeed("FLOKI", PRICE_FEED_FLOKI);
        newAggregator.setPriceFeed("WIF", PRICE_FEED_WIF);
        newAggregator.setPriceFeed("BONK", PRICE_FEED_BONK);
        newAggregator.setPriceFeed("BTC", PRICE_FEED_BTC);
        console.log("All 7 PriceFeeds configured");
        
        // ============================================
        // Step 3: Update AgentRegistry to use new Aggregator
        // ============================================
        console.log("\n--- Step 3: Updating AgentRegistry ---");
        AgentRegistry(AGENT_REGISTRY).setAggregator(address(newAggregator));
        console.log("AgentRegistry now points to new Aggregator");
        
        // ============================================
        // Step 4: Update MTokenDistributor to use new Aggregator
        // ============================================
        console.log("\n--- Step 4: Updating MTokenDistributor ---");
        MTokenDistributor(M_TOKEN_DISTRIBUTOR).setAggregator(address(newAggregator));
        console.log("MTokenDistributor now points to new Aggregator");
        
        // ============================================
        // Step 5: Update all PriceFeeds to accept from new Aggregator
        // ============================================
        console.log("\n--- Step 5: Updating PriceFeeds ---");
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
        console.log("\nNEW AGGREGATOR ADDRESS:");
        console.log("AGGREGATOR:", address(newAggregator));
        console.log("\nKEPT EXISTING:");
        console.log("AGENT_REGISTRY:", AGENT_REGISTRY);
        console.log("M_TOKEN_DISTRIBUTOR:", M_TOKEN_DISTRIBUTOR);
        console.log("PROTOCOL_CONFIG:", PROTOCOL_CONFIG);
        console.log("\n!!! UPDATE lib/contracts.ts WITH NEW AGGREGATOR ADDRESS !!!");
        console.log("\n!!! NOTE: Seed data needs to be re-submitted !!!");
        console.log("The new Aggregator has no price history.");
        console.log("Run SeedData.s.sol again after updating addresses.");
    }
}

