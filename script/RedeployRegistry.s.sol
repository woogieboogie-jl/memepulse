// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/AgentRegistry.sol";

interface IAggregator {
    function setRegistry(address _registry) external;
}

interface IDistributor {
    function setRegistry(address _registry) external;
}

/**
 * @title RedeployRegistry
 * @notice Redeploy AgentRegistry with getAgentsForFeed getter and update references
 * @dev Run with: forge script script/RedeployRegistry.s.sol:RedeployRegistry --rpc-url memecore --broadcast
 */
contract RedeployRegistry is Script {
    // Existing contract addresses
    address constant AGGREGATOR = 0xFeAB9a221f6bcDb4c160cD81954eE4405EdF0e35;
    address constant DISTRIBUTOR = 0xaa6b8aD37f435Dc7e095ba6a20b6b2e7E0e285a1;
    
    // Seed agent (deployer wallet)
    address constant SEED_AGENT = 0x95ed40013Cb3990013Af947a635D1A3E31057426;
    
    // Feeds to register seed agent for
    string[7] feeds = ["DOGE", "PEPE", "SHIB", "FLOKI", "WIF", "BONK", "BTC"];

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy new AgentRegistry
        AgentRegistry newRegistry = new AgentRegistry();
        console.log("New AgentRegistry deployed at:", address(newRegistry));
        
        // 2. Set aggregator and distributor references
        newRegistry.setAggregator(AGGREGATOR);
        newRegistry.setDistributor(DISTRIBUTOR);
        console.log("Set aggregator and distributor references");
        
        // 3. Update Aggregator to use new registry
        IAggregator(AGGREGATOR).setRegistry(address(newRegistry));
        console.log("Updated Aggregator registry reference");
        
        // 4. Update Distributor to use new registry
        IDistributor(DISTRIBUTOR).setRegistry(address(newRegistry));
        console.log("Updated Distributor registry reference");
        
        // 5. Register seed agent for all feeds
        for (uint i = 0; i < feeds.length; i++) {
            newRegistry.registerAgent(SEED_AGENT, feeds[i]);
            console.log("Registered seed agent for feed:", feeds[i]);
        }
        
        // 6. Verify registrations
        console.log("\n=== Verification ===");
        for (uint i = 0; i < feeds.length; i++) {
            address[] memory agents = newRegistry.getAgentsForFeed(feeds[i]);
            console.log("Feed:", feeds[i], "- Agent count:", agents.length);
        }
        
        vm.stopBroadcast();
        
        console.log("\n=== UPDATE lib/contracts.ts ===");
        console.log("AGENT_REGISTRY:", address(newRegistry));
    }
}

