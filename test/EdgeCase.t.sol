// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/Aggregator.sol";
import "../contracts/AgentRegistry.sol";
import "../contracts/PriceFeed.sol";
import "../contracts/ProtocolConfig.sol";
import "../contracts/MTokenDistributor.sol";
import "../contracts/MToken.sol";

/**
 * @title EdgeCaseTest
 * @notice Comprehensive edge case and boundary testing
 */
contract EdgeCaseTest is Test {
    Aggregator public aggregator;
    AgentRegistry public registry;
    PriceFeed public priceFeed;
    ProtocolConfig public config;
    MTokenDistributor public distributor;
    MToken public mToken;
    
    address public agent1;
    address public agent2;

    function setUp() public {
        agent1 = address(0x1);
        agent2 = address(0x2);
        
        config = new ProtocolConfig();
        registry = new AgentRegistry();
        mToken = new MToken();
        distributor = new MTokenDistributor(address(mToken), address(registry), address(config));
        aggregator = new Aggregator(address(registry), address(distributor), address(config));
        priceFeed = new PriceFeed("DOGE");
        
        priceFeed.setAggregator(address(aggregator));
        aggregator.setPriceFeed("DOGE", address(priceFeed));
        registry.setAggregator(address(aggregator));
        registry.setDistributor(address(distributor));
        mToken.setDistributor(address(distributor));
        distributor.setAggregator(address(aggregator));
        
        registry.registerAgent(agent1, "DOGE");
        registry.registerAgent(agent2, "DOGE");
    }

    // ========== EXTREME VALUE TESTING ==========

    function testMaxUint256Volume() public {
        // Test with maximum possible volume (should be rejected by volume cap)
        Aggregator.AgentUpdateReport memory report = Aggregator.AgentUpdateReport({
            price: 1,
            volume: type(uint256).max,
            isLong: true,
            leverage: 1,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx1"),
            agent: agent1
        });
        
        // Should revert with "Volume too high" due to MAX_VOLUME cap
        vm.expectRevert("Volume too high");
        aggregator.submitUpdate(agent1, "DOGE", report);
    }

    function testMinimalValues() public {
        // Set max credibility for agent to ensure tiny volume still has weight
        registry.setCredibility(agent1, 10000);  // 100%
        
        // Smallest possible valid values
        Aggregator.AgentUpdateReport memory report = Aggregator.AgentUpdateReport({
            price: 1,  // 0.00000001 USD
            volume: 1, // Smallest volume
            isLong: true,
            leverage: 1,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx1"),
            agent: agent1
        });
        
        aggregator.submitUpdate(agent1, "DOGE", report);
        (, int256 price, , , ) = priceFeed.latestRoundData();
        assertEq(price, 1);
    }

    function testMaximumLeverage() public {
        // Test with extremely high leverage
        Aggregator.AgentUpdateReport memory report = Aggregator.AgentUpdateReport({
            price: 8500000,
            volume: 100000000000,
            isLong: true,
            leverage: 100, // High leverage (uint8 max is 255)
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx1"),
            agent: agent1
        });
        
        // Should work (no ceiling)
        aggregator.submitUpdate(agent1, "DOGE", report);
    }

    // ========== TIMESTAMP EDGE CASES ==========

    function testFutureTimestampRejected() public {
        Aggregator.AgentUpdateReport memory report = Aggregator.AgentUpdateReport({
            price: 8500000,
            volume: 100000000000,
            isLong: true,
            leverage: 1,
            timestamp: block.timestamp + 1 hours,
            orderlyTxHash: keccak256("tx1"),
            agent: agent1
        });
        
        vm.expectRevert("Future timestamp");
        aggregator.submitUpdate(agent1, "DOGE", report);
    }

    function testVeryOldTimestamp() public {
        // Warp time forward first to avoid underflow at genesis
        vm.warp(block.timestamp + 365 days);
        
        // Old timestamp (1 year ago) - currently accepted
        Aggregator.AgentUpdateReport memory report = Aggregator.AgentUpdateReport({
            price: 8500000,
            volume: 100000000000,
            isLong: true,
            leverage: 1,
            timestamp: block.timestamp - 364 days,
            orderlyTxHash: keccak256("tx1"),
            agent: agent1
        });
        
        // Currently no staleness check (EDGE CASE: Should we add one?)
        aggregator.submitUpdate(agent1, "DOGE", report);
    }

    // ========== CREDIBILITY EDGE CASES ==========

    function testZeroCredibility() public {
        // Set credibility to near-zero (500 basis points = 5%)
        registry.setCredibility(agent1, 500);
        
        Aggregator.AgentUpdateReport memory report = Aggregator.AgentUpdateReport({
            price: 8500000,
            volume: 100000000000,
            isLong: true,
            leverage: 1,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx1"),
            agent: agent1
        });
        
        aggregator.submitUpdate(agent1, "DOGE", report);
        
        // Update should be included but with minimal weight
        uint256 vcwap = aggregator.calculateVWAP("DOGE");
        assertTrue(vcwap > 0);
    }

    function testMaxCredibility() public {
        // Set to 100% credibility
        registry.setCredibility(agent1, 10000);
        
        Aggregator.AgentUpdateReport memory report = Aggregator.AgentUpdateReport({
            price: 8500000,
            volume: 100000000000,
            isLong: true,
            leverage: 1,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx1"),
            agent: agent1
        });
        
        aggregator.submitUpdate(agent1, "DOGE", report);
        
        uint256 vcwap = aggregator.calculateVWAP("DOGE");
        assertEq(vcwap, 8500000);
    }

    // ========== REWARD CALCULATION EDGE CASES ==========

    function testTinyVolumeReward() public {
        // Set max credibility for both agents
        registry.setCredibility(agent1, 10000);
        registry.setCredibility(agent2, 10000);
        
        // Agent with very small contribution
        aggregator.submitUpdate(agent1, "DOGE", Aggregator.AgentUpdateReport({
            price: 8500000,
            volume: 1, // Tiny volume
            isLong: true,
            leverage: 1,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx1"),
            agent: agent1
        }));
        
        aggregator.submitUpdate(agent2, "DOGE", Aggregator.AgentUpdateReport({
            price: 8500000,
            volume: 1000000000000000,  // Large but not overflow-causing
            isLong: true,
            leverage: 1,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx2"),
            agent: agent2
        }));
        
        vm.warp(block.timestamp + 1 weeks);
        distributor.startNewEpoch();
        
        // Agent1 reward might round to zero
        uint256 reward1 = distributor.calculateReward(agent1, 1);
        uint256 reward2 = distributor.calculateReward(agent2, 1);
        
        // Agent2 should get almost all rewards
        assertTrue(reward2 > reward1 * 1000);
    }

    // ========== MULTI-FEED EDGE CASES ==========

    function testAgentMultipleFeeds() public {
        // Register agent to another feed
        PriceFeed pepe = new PriceFeed("PEPE");
        pepe.setAggregator(address(aggregator));
        aggregator.setPriceFeed("PEPE", address(pepe));
        registry.registerAgent(agent1, "PEPE");
        
        // Submit to both feeds
        aggregator.submitUpdate(agent1, "DOGE", Aggregator.AgentUpdateReport({
            price: 8500000,
            volume: 100000000000,
            isLong: true,
            leverage: 1,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("doge-tx"),
            agent: agent1
        }));
        
        aggregator.submitUpdate(agent1, "PEPE", Aggregator.AgentUpdateReport({
            price: 1000,
            volume: 100000000000,
            isLong: true,
            leverage: 1,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("pepe-tx"),
            agent: agent1
        }));
        
        // Both should work
        (, int256 dogePrice, , , ) = priceFeed.latestRoundData();
        (, int256 pepePrice, , , ) = pepe.latestRoundData();
        
        assertEq(dogePrice, 8500000);
        assertEq(pepePrice, 1000);
    }

    // ========== VCWAP WINDOW EDGE CASES ==========

    function testExactly30Updates() public {
        // Submit exactly 30 updates
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
        
        assertEq(aggregator.getUpdateCount("DOGE"), 30);
    }

    function testOneBeyond30Updates() public {
        // Submit 31 updates - oldest should be removed
        for (uint i = 0; i < 31; i++) {
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
        
        // Should still be 30
        assertEq(aggregator.getUpdateCount("DOGE"), 30);
    }

    // ========== CONCURRENT OPERATIONS ==========

    function testMultipleAgentsSameTimestamp() public {
        uint256 timestamp = block.timestamp;
        
        // Both agents submit at exact same time
        aggregator.submitUpdate(agent1, "DOGE", Aggregator.AgentUpdateReport({
            price: 8000000,
            volume: 100000000000,
            isLong: true,
            leverage: 1,
            timestamp: timestamp,
            orderlyTxHash: keccak256("tx1"),
            agent: agent1
        }));
        
        aggregator.submitUpdate(agent2, "DOGE", Aggregator.AgentUpdateReport({
            price: 9000000,
            volume: 100000000000,
            isLong: true,
            leverage: 1,
            timestamp: timestamp,
            orderlyTxHash: keccak256("tx2"),
            agent: agent2
        }));
        
        // VCWAP should be in between
        uint256 vcwap = aggregator.calculateVWAP("DOGE");
        assertTrue(vcwap >= 8000000 && vcwap <= 9000000);
    }

    // ========== EPOCH EDGE CASES ==========

    function testClaimRightAfterEpochEnd() public {
        aggregator.submitUpdate(agent1, "DOGE", Aggregator.AgentUpdateReport({
            price: 8500000,
            volume: 100000000000,
            isLong: true,
            leverage: 1,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx1"),
            agent: agent1
        }));
        
        // Exactly 1 week later
        vm.warp(block.timestamp + 1 weeks);
        distributor.startNewEpoch();
        
        // Should be able to claim immediately
        vm.prank(agent1);
        distributor.claimRewards(1);
        
        assertTrue(mToken.balanceOf(agent1) > 0);
    }

    function testCannotClaimCurrentEpoch() public {
        aggregator.submitUpdate(agent1, "DOGE", Aggregator.AgentUpdateReport({
            price: 8500000,
            volume: 100000000000,
            isLong: true,
            leverage: 1,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx1"),
            agent: agent1
        }));
        
        // Try to claim current epoch
        vm.prank(agent1);
        vm.expectRevert("Epoch not ended");
        distributor.claimRewards(1);
    }
}
