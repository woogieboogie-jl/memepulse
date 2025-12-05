// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../contracts/PriceFeed.sol";

/**
 * @title ExampleDapp
 * @notice Example of how external dapps can consume MemePulse price feeds
 * @dev Uses standard Chainlink AggregatorV3Interface
 */
contract ExampleDapp {
    // MemePulse price feed (Chainlink-compatible)
    PriceFeed public dogeFeed;
    
    constructor(address _dogeFeedAddress) {
        dogeFeed = PriceFeed(_dogeFeedAddress);
    }
    
    /**
     * @notice Get current DOGE price (same as Chainlink)
     * @return price Latest DOGE/USD price (8 decimals)
     */
    function getCurrentDogePrice() external view returns (int256 price) {
        (
            /* uint80 roundId */,
            int256 answer,
            /* uint256 startedAt */,
            /* uint256 updatedAt */,
            /* uint80 answeredInRound */
        ) = dogeFeed.latestRoundData();
        
        return answer;
    }
    
    /**
     * @notice Get price with metadata (full Chainlink response)
     */
    function getDogePriceWithMetadata() 
        external 
        view 
        returns (
            uint80 roundId,
            int256 price,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) 
    {
        return dogeFeed.latestRoundData();
    }
    
    /**
     * @notice Example: Execute trade if price is below threshold
     */
    function buyDogeIfCheap(uint256 maxPriceUSD) external view returns (bool shouldBuy) {
        (, int256 currentPrice, , , ) = dogeFeed.latestRoundData();
        
        // Price is in 8 decimals, so 10000000 = $0.10
        return uint256(currentPrice) < maxPriceUSD;
    }
    
    /**
     * @notice Example: Get price for DeFi protocol
     */
    function getDogeValueInUSD(uint256 dogeAmount) external view returns (uint256 valueUSD) {
        (, int256 price, , , ) = dogeFeed.latestRoundData();
        require(price > 0, "Invalid price");
        
        // dogeAmount is in DOGE decimals (assume 8)
        // price is in USD with 8 decimals
        // Result in USD with 8 decimals
        return (dogeAmount * uint256(price)) / 1e8;
    }
}
