// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/PriceFeed.sol";
import "../contracts/Aggregator.sol";
import "../contracts/AgentRegistry.sol";
import "../contracts/ProtocolConfig.sol";

/**
 * @title ChainlinkCompatibilityTest
 * @notice Test that external dapps can consume our price feeds via Chainlink interface
 */
contract ChainlinkCompatibilityTest is Test {
    PriceFeed public priceFeed;
    Aggregator public aggregator;
    AgentRegistry public registry;
    ProtocolConfig public config;
    
    address public agent;

    function setUp() public {
        agent = address(0x1);
        
        config = new ProtocolConfig();
        registry = new AgentRegistry();
        aggregator = new Aggregator(address(registry), address(0), address(config));
        priceFeed = new PriceFeed("DOGE");
        
        priceFeed.setAggregator(address(aggregator));
        aggregator.setPriceFeed("DOGE", address(priceFeed));
        registry.setAggregator(address(aggregator));
        
        registry.registerAgent(agent, "DOGE");
    }

    function testChainlinkInterfaceCompatibility() public {
        // Submit update to populate price
        aggregator.submitUpdate(agent, "DOGE", Aggregator.AgentUpdateReport({
            price: 8524000,  // 0.08524 USD
            volume: 100000000000,
            isLong: true,
            leverage: 2,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx1"),
            agent: agent
        }));
        
        // Test 1: Call latestRoundData (Chainlink interface)
        (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        
        // Verify response structure
        assertGt(roundId, 0);
        assertEq(answer, 8524000);
        assertGt(updatedAt, 0);
        assertEq(answeredInRound, roundId);
        
        // Test 2: Simulate external dapp consumption
        MockDapp dapp = new MockDapp(address(priceFeed));
        int256 price = dapp.getPrice();
        assertEq(price, 8524000);
    }

    function testMultipleUpdatesIncrementRound() public {
        // Submit first update
        aggregator.submitUpdate(agent, "DOGE", Aggregator.AgentUpdateReport({
            price: 8500000,
            volume: 100000000000,
            isLong: true,
            leverage: 1,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx1"),
            agent: agent
        }));
        
        (uint80 round1, int256 price1, , , ) = priceFeed.latestRoundData();
        assertEq(price1, 8500000);
        
        // Submit second update
        aggregator.submitUpdate(agent, "DOGE", Aggregator.AgentUpdateReport({
            price: 9000000,
            volume: 100000000000,
            isLong: true,
            leverage: 1,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx2"),
            agent: agent
        }));
        
        (uint80 round2, int256 price2, , , ) = priceFeed.latestRoundData();
        
        // Round should increment
        assertEq(round2, round1 + 1);
        // Price should be VCWAP of both updates (8500000 + 9000000) / 2 = 8750000
        assertEq(price2, 8750000);
    }

    function testPriceUpdateTimestamp() public {
        uint256 beforeTime = block.timestamp;
        
        aggregator.submitUpdate(agent, "DOGE", Aggregator.AgentUpdateReport({
            price: 8500000,
            volume: 100000000000,
            isLong: true,
            leverage: 1,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx1"),
            agent: agent
        }));
        
        (, , , uint256 updatedAt, ) = priceFeed.latestRoundData();
        
        assertGe(updatedAt, beforeTime);
        assertLe(updatedAt, block.timestamp);
    }
}

/**
 * @title MockDapp
 * @notice Simulates an external dapp consuming Chainlink price feed
 */
contract MockDapp {
    AggregatorV3Interface public priceFeed;
    
    constructor(address _priceFeed) {
        priceFeed = AggregatorV3Interface(_priceFeed);
    }
    
    function getPrice() external view returns (int256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }
}

// Chainlink interface (minimal)
interface AggregatorV3Interface {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}
