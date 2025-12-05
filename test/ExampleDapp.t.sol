// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/ExampleDapp.sol";
import "../contracts/PriceFeed.sol";
import "../contracts/Aggregator.sol";
import "../contracts/AgentRegistry.sol";
import "../contracts/ProtocolConfig.sol";

/**
 * @title ExampleDappTest
 * @notice Test external dapp integration with MemePulse feeds
 */
contract ExampleDappTest is Test {
    ExampleDapp public dapp;
    PriceFeed public dogeFeed;
    Aggregator public aggregator;
    AgentRegistry public registry;
    ProtocolConfig public config;
    
    address public agent;

    function setUp() public {
        agent = address(0x1);
        
        config = new ProtocolConfig();
        registry = new AgentRegistry();
        aggregator = new Aggregator(address(registry), address(0), address(config));
        dogeFeed = new PriceFeed("DOGE");
        
        dogeFeed.setAggregator(address(aggregator));
        aggregator.setPriceFeed("DOGE", address(dogeFeed));
        registry.setAggregator(address(aggregator));
        registry.registerAgent(agent, "DOGE");
        
        // Deploy example dapp
        dapp = new ExampleDapp(address(dogeFeed));
        
        // Submit a price update
        aggregator.submitUpdate(agent, "DOGE", Aggregator.AgentUpdateReport({
            price: 8500000,  // $0.085
            volume: 100000000000,
            isLong: true,
            leverage: 2,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx1"),
            agent: agent
        }));
    }

    function testDappCanReadPrice() public {
        int256 price = dapp.getCurrentDogePrice();
        assertEq(price, 8500000);
    }

    function testDappCanReadPriceWithMetadata() public {
        (
            uint80 roundId,
            int256 price,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = dapp.getDogePriceWithMetadata();
        
        assertGt(roundId, 0);
        assertEq(price, 8500000);
        assertGt(updatedAt, 0);
        assertEq(answeredInRound, roundId);
    }

    function testDappLogic() public {
        // Price is 0.085, so should buy if threshold is > 0.085
        bool shouldBuy = dapp.buyDogeIfCheap(10000000);  // $0.10 threshold
        assertTrue(shouldBuy);
        
        bool shouldNotBuy = dapp.buyDogeIfCheap(8000000);  // $0.08 threshold
        assertFalse(shouldNotBuy);
    }

    function testDappValueCalculation() public {
        // 1000 DOGE at $0.085 = $85
        uint256 value = dapp.getDogeValueInUSD(100000000000);  // 1000 DOGE (8 decimals)
        assertEq(value, 8500000000);  // $85 (8 decimals)
    }

    function testDappWorksAfterPriceUpdate() public {
        // Submit new price
        aggregator.submitUpdate(agent, "DOGE", Aggregator.AgentUpdateReport({
            price: 12000000,  // $0.12
            volume: 100000000000,
            isLong: true,
            leverage: 1,
            timestamp: block.timestamp,
            orderlyTxHash: keccak256("tx2"),
            agent: agent
        }));
        
        // Dapp should see new price (VCWAP of 8.5M and 12M)
        // Update 1: 8.5M * 200B weight (lev 2)
        // Update 2: 12M * 100B weight (lev 1)
        // Avg = (1700 + 1200) / 300 = 9.666666
        int256 price = dapp.getCurrentDogePrice();
        assertEq(price, 9666666);
    }
}
