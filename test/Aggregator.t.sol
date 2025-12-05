// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/Aggregator.sol";
import "../contracts/AgentRegistry.sol";
import "../contracts/PriceFeed.sol";
import "../contracts/ProtocolConfig.sol";

contract AggregatorTest is Test {
    Aggregator public aggregator;
    AgentRegistry public registry;
    PriceFeed public priceFeed;
    ProtocolConfig public config;
    
    address public owner;
    address public agent1;
    address public agent2;

    function setUp() public {
        owner = address(this);
        agent1 = address(0x1);
        agent2 = address(0x2);
        
        // Deploy dependencies
        config = new ProtocolConfig();
        registry = new AgentRegistry();
        aggregator = new Aggregator(address(registry), address(0), address(config));
        priceFeed = new PriceFeed("DOGE");
        
        // Configure
        priceFeed.setAggregator(address(aggregator));
        aggregator.setPriceFeed("DOGE", address(priceFeed));
        
        // Set roles on registry
        registry.setAggregator(address(aggregator));
        
        // Register agents
        registry.registerAgent(agent1, "DOGE");
        registry.registerAgent(agent2, "DOGE");
    }

    function testSubmitUpdate() public {
        Aggregator.AgentUpdateReport memory report = Aggregator.AgentUpdateReport({
            price: 8524000, // 0.08524 with 8 decimals
            volume: 100000000000, // 1000 with 8 decimals
            isLong: true,
            leverage: 3,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx1"),
            agent: agent1
        });
        
        aggregator.submitUpdate(agent1, "DOGE", report);
        assertEq(aggregator.getUpdateCount("DOGE"), 1);
    }

    function testRejectUnregisteredAgent() public {
        address unregistered = address(0x999);
        
        Aggregator.AgentUpdateReport memory report = Aggregator.AgentUpdateReport({
            price: 8524000,
            volume: 100000000000,
            isLong: true,
            leverage: 3,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx1"),
            agent: unregistered
        });
        
        vm.expectRevert("Agent not registered");
        aggregator.submitUpdate(unregistered, "DOGE", report);
    }

    function testRejectZeroVolume() public {
        Aggregator.AgentUpdateReport memory report = Aggregator.AgentUpdateReport({
            price: 8524000,
            volume: 0,
            isLong: true,
            leverage: 3,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx1"),
            agent: agent1
        });
        
        vm.expectRevert("Volume must be > 0");
        aggregator.submitUpdate(agent1, "DOGE", report);
    }

    function testRejectInvalidLeverage() public {
        Aggregator.AgentUpdateReport memory report = Aggregator.AgentUpdateReport({
            price: 8524000,
            volume: 100000000000,
            isLong: true,
            leverage: 15, // > 10
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx1"),
            agent: agent1
        });
        
        vm.expectRevert("Invalid leverage");
        aggregator.submitUpdate(agent1, "DOGE", report);
    }

    function testReplayAttackPrevention() public {
        Aggregator.AgentUpdateReport memory report = Aggregator.AgentUpdateReport({
            price: 8524000,
            volume: 100000000000,
            isLong: true,
            leverage: 3,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx1"),
            agent: agent1
        });
        
        aggregator.submitUpdate(agent1, "DOGE", report);
        
        vm.expectRevert("Already processed");
        aggregator.submitUpdate(agent1, "DOGE", report);
    }

    function testVCWAPCalculation() public {
        // Submit update 1: price=0.085, volume=1000
        aggregator.submitUpdate(agent1, "DOGE", Aggregator.AgentUpdateReport({
            price: 8500000,
            volume: 100000000000,
            isLong: true,
            leverage: 1,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx1"),
            agent: agent1
        }));
        
        // Submit update 2: price=0.090, volume=2000
        aggregator.submitUpdate(agent2, "DOGE", Aggregator.AgentUpdateReport({
            price: 9000000,
            volume: 200000000000,
            isLong: true,
            leverage: 1,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx2"),
            agent: agent2
        }));
        
        uint256 vcwap = aggregator.calculateVWAP("DOGE");
        
        // VCWAP should be weighted towards 0.090 (higher volume)
        assertTrue(vcwap > 8500000);
        assertTrue(vcwap < 9000000);
    }

    function testMaxUpdatesN30() public {
        // Submit 40 updates
        for (uint i = 0; i < 40; i++) {
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
        
        // Should be capped at 30 (config value)
        assertEq(aggregator.getUpdateCount("DOGE"), 30);
    }

    function testPriceFeedUpdated() public {
        aggregator.submitUpdate(agent1, "DOGE", Aggregator.AgentUpdateReport({
            price: 8524000,
            volume: 100000000000,
            isLong: true,
            leverage: 1,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx1"),
            agent: agent1
        }));
        
        (,int256 price,,,) = priceFeed.latestRoundData();
        assertEq(price, 8524000);
    }
}
