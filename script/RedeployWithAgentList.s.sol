// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/AgentRegistry.sol";
import "../contracts/Aggregator.sol";
import "../contracts/MTokenDistributor.sol";
import "../contracts/PriceFeed.sol";

/**
 * @title RedeployWithAgentList
 * @notice Redeploy AgentRegistry (with getAgentsForFeed), Aggregator, and MTokenDistributor
 * @dev Run with: forge script script/RedeployWithAgentList.s.sol:RedeployWithAgentList --rpc-url memecore --broadcast
 */
contract RedeployWithAgentList is Script {
    // Existing contracts (not redeployed)
    address constant PROTOCOL_CONFIG = 0xC81536da58b4b2e4ff433FE511bF0e035576eC15;
    address constant WM_TOKEN = 0x07Aa8b1f50176A6783f5C710c0802f8871000920;
    
    // Price feeds (not redeployed)
    address constant DOGE_FEED = 0x30490c9239FDc6ff8FEEF84FF6f7B657Ec6882F8;
    address constant PEPE_FEED = 0x5DbD29ca81385606888112288bbAe95f0Eb9f170;
    address constant SHIB_FEED = 0xa35F2923f8C6a8E9D2F655AB4cfb373864E6cC89;
    address constant FLOKI_FEED = 0xF34772793a37Cab10E13B7fb686f93445e0f4339;
    address constant WIF_FEED = 0xf11B4128624461839165F46cC3eF30eA84fb4DBC;
    address constant BONK_FEED = 0x1e44CFA2C04F9bbe1C612673BC808C214bA04941;
    address constant BTC_FEED = 0xBB906be3676b1d6872cdcA58E336Aea089c698b0;
    
    // Seed agent (deployer wallet)
    address constant SEED_AGENT = 0x95ed40013Cb3990013Af947a635D1A3E31057426;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy new AgentRegistry
        AgentRegistry registry = new AgentRegistry();
        console.log("AgentRegistry deployed at:", address(registry));
        
        // 2. Deploy new MTokenDistributor
        MTokenDistributor distributor = new MTokenDistributor(
            address(registry),
            WM_TOKEN,
            PROTOCOL_CONFIG
        );
        console.log("MTokenDistributor deployed at:", address(distributor));
        
        // 3. Deploy new Aggregator
        Aggregator aggregator = new Aggregator(
            address(registry),
            address(distributor),
            PROTOCOL_CONFIG
        );
        console.log("Aggregator deployed at:", address(aggregator));
        
        // 4. Set cross-references in registry
        registry.setAggregator(address(aggregator));
        registry.setDistributor(address(distributor));
        console.log("Set registry cross-references");
        
        // 5. Set aggregator in distributor
        distributor.setAggregator(address(aggregator));
        console.log("Set distributor aggregator reference");
        
        // 6. Set price feeds in aggregator
        aggregator.setPriceFeed("DOGE", DOGE_FEED);
        aggregator.setPriceFeed("PEPE", PEPE_FEED);
        aggregator.setPriceFeed("SHIB", SHIB_FEED);
        aggregator.setPriceFeed("FLOKI", FLOKI_FEED);
        aggregator.setPriceFeed("WIF", WIF_FEED);
        aggregator.setPriceFeed("BONK", BONK_FEED);
        aggregator.setPriceFeed("BTC", BTC_FEED);
        console.log("Set price feeds in aggregator");
        
        // 7. Update price feed owners to new aggregator
        PriceFeed(DOGE_FEED).setAggregator(address(aggregator));
        PriceFeed(PEPE_FEED).setAggregator(address(aggregator));
        PriceFeed(SHIB_FEED).setAggregator(address(aggregator));
        PriceFeed(FLOKI_FEED).setAggregator(address(aggregator));
        PriceFeed(WIF_FEED).setAggregator(address(aggregator));
        PriceFeed(BONK_FEED).setAggregator(address(aggregator));
        PriceFeed(BTC_FEED).setAggregator(address(aggregator));
        console.log("Updated price feed aggregator references");
        
        // 8. Register seed agent for all feeds
        string[7] memory feeds = ["DOGE", "PEPE", "SHIB", "FLOKI", "WIF", "BONK", "BTC"];
        for (uint i = 0; i < feeds.length; i++) {
            registry.registerAgent(SEED_AGENT, feeds[i]);
            console.log("Registered seed agent for:", feeds[i]);
        }
        
        // 9. Verify registrations using new getter
        console.log("\n=== Verification ===");
        for (uint i = 0; i < feeds.length; i++) {
            address[] memory agents = registry.getAgentsForFeed(feeds[i]);
            console.log("Feed:", feeds[i], "- Agents:", agents.length);
            for (uint j = 0; j < agents.length; j++) {
                console.log("  Agent:", agents[j]);
            }
        }
        
        vm.stopBroadcast();
        
        console.log("\n=== UPDATE lib/contracts.ts ===");
        console.log("AGENT_REGISTRY:", address(registry));
        console.log("AGGREGATOR:", address(aggregator));
        console.log("M_TOKEN_DISTRIBUTOR:", address(distributor));
    }
}

