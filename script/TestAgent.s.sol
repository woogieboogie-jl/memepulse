// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/Aggregator.sol";
import "../contracts/AgentRegistry.sol";

/**
 * @title TestAgentInteraction
 * @notice Script to test agent registration and update submission on live node
 */
contract TestAgentInteraction is Script {
    function run() external {
        // Use Anvil's default private key
        uint256 agentKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address agentAddress = vm.addr(agentKey);
        
        // Load deployed contract addresses (you'll need to update these)
        address registryAddr = vm.envAddress("REGISTRY_ADDRESS");
        address aggregatorAddr = vm.envAddress("AGGREGATOR_ADDRESS");
        
        AgentRegistry registry = AgentRegistry(registryAddr);
        Aggregator aggregator = Aggregator(aggregatorAddr);
        
        vm.startBroadcast(agentKey);
        
        console.log("=== Testing Agent Interaction ===");
        console.log("Agent Address:", agentAddress);
        console.log("");
        
        // Test 1: Check if already registered
        bool isRegistered = registry.isRegistered(agentAddress, "DOGE");
        console.log("Already registered:", isRegistered);
        
        // Test 2: Submit an update
        if (isRegistered) {
            Aggregator.AgentUpdateReport memory report = Aggregator.AgentUpdateReport({
                price: 8524000,  // 0.08524 with 8 decimals
                volume: 100000000000,  // 1000 USD
                isLong: true,
                leverage: 3,
                timestamp: block.timestamp,
                orderlyTxHash: keccak256(abi.encodePacked("test-tx-", block.timestamp)),
                agent: agentAddress
            });
            
            aggregator.submitUpdate(agentAddress, "DOGE", report);
            console.log("[SUCCESS] Update submitted successfully!");
            
            // Check VCWAP
            uint256 vcwap = aggregator.calculateVWAP("DOGE");
            console.log("Current VCWAP:", vcwap);
        }
        
        vm.stopBroadcast();
    }
}
