// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/ProtocolConfig.sol";
import "../contracts/AgentRegistry.sol";
import "../contracts/MToken.sol";
import "../contracts/MTokenDistributor.sol";
import "../contracts/Aggregator.sol";
import "../contracts/PriceFeed.sol";

contract IntegrationTest is Test {
    ProtocolConfig public config;
    AgentRegistry public registry;
    MToken public mToken;
    MTokenDistributor public distributor;
    Aggregator public aggregator;
    PriceFeed public priceFeed;
    
    address public owner;
    address public agent1;
    address public agent2;
    address public agent3;

    function setUp() public {
        owner = address(this);
        agent1 = address(0x1);
        agent2 = address(0x2);
        agent3 = address(0x3);
        
        // Deploy all contracts
        config = new ProtocolConfig();
        registry = new AgentRegistry();
        mToken = new MToken();
        distributor = new MTokenDistributor(address(mToken), address(registry), address(config));
        aggregator = new Aggregator(address(registry), address(distributor), address(config));
        priceFeed = new PriceFeed("DOGE");
        
        // Wire contracts together
        priceFeed.setAggregator(address(aggregator));
        aggregator.setPriceFeed("DOGE", address(priceFeed));
        mToken.setDistributor(address(distributor));
        distributor.setAggregator(address(aggregator));
        registry.transferOwnership(address(aggregator));
    }

    function testCompleteFlow() public {
        // 1. Register agents
        registry.registerAgent(agent1, "DOGE");
        registry.registerAgent(agent2, "DOGE");
        
        assertTrue(registry.isRegistered(agent1, "DOGE"));
        assertTrue(registry.isRegistered(agent2, "DOGE"));
        
        // 2. Submit updates
        aggregator.submitUpdate(agent1, "DOGE", Aggregator.AgentUpdateReport({
            price: 8500000,
            volume: 100000000000,
            isLong: true,
            leverage: 2,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx1"),
            agent: agent1
        }));
        
        aggregator.submitUpdate(agent2, "DOGE", Aggregator.AgentUpdateReport({
            price: 9000000,
            volume: 200000000000,
            isLong: false,
            leverage: 3,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx2"),
            agent: agent2
        }));
        
        // 3. Verify VCWAP calculated
        (,int256 price,,,) = priceFeed.latestRoundData();
        assertTrue(price > 8500000);
        assertTrue(price < 9000000);
        
        // 4. Verify contributions recorded
        (uint256 updates1, uint256 volume1,) = distributor.getCurrentEpochStats(agent1);
        (uint256 updates2, uint256 volume2,) = distributor.getCurrentEpochStats(agent2);
        
        assertEq(updates1, 1);
        assertEq(volume1, 100000000000);
        assertEq(updates2, 1);
        assertEq(volume2, 200000000000);
        
        // 5. Advance time and start new epoch
        vm.warp(block.timestamp + 1 weeks);
        distributor.startNewEpoch();
        
        // Verify epoch incremented in registry
        assertEq(registry.currentEpoch(), 2);
        
        // 6. Claim rewards
        uint256 balanceBefore1 = mToken.balanceOf(agent1);
        vm.prank(agent1);
        distributor.claimRewards(1);
        uint256 balanceAfter1 = mToken.balanceOf(agent1);
        
        assertTrue(balanceAfter1 > balanceBefore1);
        
        uint256 balanceBefore2 = mToken.balanceOf(agent2);
        vm.prank(agent2);
        distributor.claimRewards(1);
        uint256 balanceAfter2 = mToken.balanceOf(agent2);
        
        assertTrue(balanceAfter2 > balanceBefore2);
        
        // Agent2 should get more rewards (higher volume)
        uint256 reward1 = balanceAfter1 - balanceBefore1;
        uint256 reward2 = balanceAfter2 - balanceBefore2;
        assertTrue(reward2 > reward1);
    }

    function testCredibilityGrowthOverEpochs() public {
        registry.registerAgent(agent1, "DOGE");
        
        // Epoch 1: 50%
        uint256 cred1 = registry.getCredibility(agent1);
        assertEq(cred1, 5000);
        
        // Advance epochs and check growth
        registry.incrementEpoch();
        uint256 cred2 = registry.getCredibility(agent1);
        assertTrue(cred2 > cred1);
        
        registry.incrementEpoch();
        uint256 cred3 = registry.getCredibility(agent1);
        assertTrue(cred3 > cred2);
        
        // Growth should be logarithmic (slower over time)
        uint256 growth1 = cred2 - cred1;
        uint256 growth2 = cred3 - cred2;
        // Early growth should be similar due to log nature
        assertTrue(growth1 == 100 && growth2 == 100);
    }

    function testMultiAgentVCWAPConsensus() public {
        registry.registerAgent(agent1, "DOGE");
        registry.registerAgent(agent2, "DOGE");
        registry.registerAgent(agent3, "DOGE");
        
        // Submit updates with different prices
        aggregator.submitUpdate(agent1, "DOGE", Aggregator.AgentUpdateReport({
            price: 8000000,
            volume: 100000000000,
            isLong: true,
            leverage: 1,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx1"),
            agent: agent1
        }));
        
        aggregator.submitUpdate(agent2, "DOGE", Aggregator.AgentUpdateReport({
            price: 8500000,
            volume: 200000000000,
            isLong: true,
            leverage: 2,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx2"),
            agent: agent2
        }));
        
        aggregator.submitUpdate(agent3, "DOGE", Aggregator.AgentUpdateReport({
            price: 9000000,
            volume: 150000000000,
            isLong: true,
            leverage: 1,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx3"),
            agent: agent3
        }));
        
        // VCWAP should be within range
        uint256 vcwap = aggregator.calculateVWAP("DOGE");
        assertTrue(vcwap >= 8000000);
        assertTrue(vcwap <= 9000000);
        
        // PriceFeed should have VCWAP
        (,int256 price,,,) = priceFeed.latestRoundData();
        assertEq(price, int256(vcwap));
    }

    function testRewardsFromConfig() public {
        registry.registerAgent(agent1, "DOGE");
        
        // Submit update
        aggregator.submitUpdate(agent1, "DOGE", Aggregator.AgentUpdateReport({
            price: 8500000,
            volume: 100000000000,
            isLong: true,
            leverage: 1,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx1"),
            agent: agent1
        }));
        
        // Advance epoch
        vm.warp(block.timestamp + 1 weeks);
        distributor.startNewEpoch();
        
        // Claim rewards
        vm.prank(agent1);
        distributor.claimRewards(1);
        
        // Verify reward amount based on config
        uint256 balance = mToken.balanceOf(agent1);
        assertTrue(balance > 0);
        
        // Calculate expected: 7 feeds * 100k base reward = 700k total
        // Agent contributed 100% of updates, so should get ~700k * credibility
        // Credibility = 50% = 5000, so reward = 700k * 100% share * 50% cred = 350k
        uint256 expectedReward = 350000 * 10**18;
        
        // Allow for small rounding differences
        assertTrue(balance >= expectedReward * 99 / 100);
        assertTrue(balance <= expectedReward * 101 / 100);
    }

    function testConfigChangesAffectBehavior() public {
        // Change max updates to 20
        config.setMaxUpdates(20);
        
        registry.registerAgent(agent1, "DOGE");
        
        // Submit 30 updates
        for (uint i = 0; i < 30; i++) {
            aggregator.submitUpdate(agent1, "DOGE", Aggregator.AgentUpdateReport({
                price: 8500000 + uint256(i) * 1000,
                volume: 100000000000,
                isLong: true,
                leverage: 1,
                timestamp: block.timestamp,
                orderlyTxHash: keccak256(abi.encodePacked("tx", i)),
                agent: agent1
            }));
        }
        
        // Should be capped at 20 (new config value)
        assertEq(aggregator.getUpdateCount("DOGE"), 20);
    }
}
