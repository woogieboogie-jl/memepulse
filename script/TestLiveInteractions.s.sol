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
 * @title TestLiveInteractions
 * @notice Test full agent workflow on live Anvil node
 */
contract TestLiveInteractions is Script {
    function run() external {
        // Anvil default account key
        uint256 deployerKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerKey);
        
        // Agent keys (Anvil accounts 1 and 2)
        uint256 agent1Key = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;
        uint256 agent2Key = 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a;
        address agent1 = vm.addr(agent1Key);
        address agent2 = vm.addr(agent2Key);
        
        // Deployed addresses (update these after deployment)
        address configAddr = 0x5FbDB2315678afecb367f032d93F642f64180aa3;
        address registryAddr = 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512;
        address mTokenAddr = 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9;
        address distributorAddr = 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707;
        address aggregatorAddr = 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0;
        address dogeAddr = 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9;
        
        ProtocolConfig config = ProtocolConfig(configAddr);
        AgentRegistry registry = AgentRegistry(registryAddr);
        Aggregator aggregator = Aggregator(aggregatorAddr);
        PriceFeed dogeFeed = PriceFeed(dogeAddr);
        MToken mToken = MToken(mTokenAddr);
        MTokenDistributor distributor = MTokenDistributor(distributorAddr);
        
        
        // Step 1: Register agents (as deployer/owner)
        vm.startBroadcast(deployerKey);
        
        registry.registerAgent(agent1, "DOGE");
        registry.registerAgent(agent2, "DOGE");
        
        // Transfer registry ownership to distributor for epoch management
        registry.transferOwnership(address(distributor));
        
        vm.stopBroadcast();
        
        // Step 2: Submit updates as agents
        vm.startBroadcast(agent1Key);
        
        Aggregator.AgentUpdateReport memory report1 = Aggregator.AgentUpdateReport({
            price: 8500000,  // 0.085 USD
            volume: 100000000000,  // 1000 USD
            isLong: true,
            leverage: 2,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256(abi.encodePacked("agent1-tx-", block.timestamp)),
            agent: agent1
        });
        
        aggregator.submitUpdate(agent1, "DOGE", report1);
        
        vm.stopBroadcast();
        
        vm.startBroadcast(agent2Key);
        
        Aggregator.AgentUpdateReport memory report2 = Aggregator.AgentUpdateReport({
            price: 9000000,  // 0.09 USD
            volume: 200000000000,  // 2000 USD
            isLong: false,
            leverage: 3,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256(abi.encodePacked("agent2-tx-", block.timestamp)),
            agent: agent2
        });
        
        aggregator.submitUpdate(agent2, "DOGE", report2);
        
        vm.stopBroadcast();
        
        // Step 3: Check VCWAP
        uint256 vcwap = aggregator.calculateVWAP("DOGE");
        
        (, int256 feedPrice, , , ) = dogeFeed.latestRoundData();
        
        // Step 4: Advance time and epoch
        vm.startBroadcast(deployerKey);
        
        vm.warp(block.timestamp + 1 weeks);
        distributor.startNewEpoch();
        
        vm.stopBroadcast();
        
        // Step 5: Claim rewards
        vm.startBroadcast(agent1Key);
        
        uint256 claimable1 = distributor.getClaimableRewards(agent1, 1);
        
        if (claimable1 > 0) {
            distributor.claimRewards(1);
            uint256 balance1 = mToken.balanceOf(agent1);
        }
        
        vm.stopBroadcast();
        
        vm.startBroadcast(agent2Key);
        
        uint256 claimable2 = distributor.getClaimableRewards(agent2, 1);
        
        if (claimable2 > 0) {
            distributor.claimRewards(1);
            uint256 balance2 = mToken.balanceOf(agent2);
        }
        
        vm.stopBroadcast();
        
    }
}
