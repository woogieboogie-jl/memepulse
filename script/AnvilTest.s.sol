// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/ProtocolConfig.sol";
import "../contracts/AgentRegistry.sol";
import "../contracts/Aggregator.sol";
import "../contracts/PriceFeed.sol";
import "../contracts/MToken.sol";
import "../contracts/MTokenDistributor.sol";

/**
 * @title AnvilTest
 * @notice Simplified test for Anvil deployment verification
 */
contract AnvilTest is Script {
    function run() external {
        uint256 deployerKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        
        // Use addresses from latest deployment
        address configAddr = 0x5FbDB2315678afecb367f032d93F642f64180aa3;
        address registryAddr = 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512;
        address aggregatorAddr = 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9;
        address dogeAddr = 0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6;
        
        AgentRegistry registry = AgentRegistry(registryAddr);
        Aggregator aggregator = Aggregator(aggregatorAddr);
        PriceFeed dogeFeed = PriceFeed(dogeAddr);
        
        vm.startBroadcast(deployerKey);
        
        // Test 1: Register agent
        address agent = vm.addr(deployerKey);
        registry.registerAgent(agent, "DOGE");
        
        // Test 2: Submit update
        aggregator.submitUpdate(agent, "DOGE", Aggregator.AgentUpdateReport({
            price: 8500000,
            volume: 100000000000,
            isLong: true,
            leverage: 2,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("test-tx"),
            agent: agent
        }));
        
        // Test 3: Check VCWAP
        (, int256 price, , , ) = dogeFeed.latestRoundData();
        require(price == 8500000, "Price mismatch");
        
        vm.stopBroadcast();
        
        console.log("Anvil tests passed!");
        console.log("Agent:", agent);
        console.log("DOGE Price:", uint256(price));
    }
}
