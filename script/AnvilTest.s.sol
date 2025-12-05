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
        
        // Use addresses from MemeCore Testnet deployment
        address configAddr = 0xC81536da58b4b2e4ff433FE511bF0e035576eC15;
        address registryAddr = 0xb90b78B0aE7f8210200EdedC73F9034bD7a644eF;
        address aggregatorAddr = 0xc8e8e0F33d0cD24Ee2cF2536fe2e34c6f0D83cd4;
        address dogeAddr = 0x30490c9239FDc6ff8FEEF84FF6f7B657Ec6882F8;
        
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
