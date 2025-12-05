// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PriceFeed
 * @notice Chainlink AggregatorV3Interface compatible price feed
 * @dev Stores oracle price data for one memecoin
 */
contract PriceFeed is Ownable {
    // ============ State Variables ============

    address public aggregator;
    string public symbol;
    uint8 public constant decimals = 8;
    uint256 public constant version = 1;
    
    struct Round {
        int256 answer;
        uint256 startedAt;
        uint256 updatedAt;
        uint80 answeredInRound;
    }
    
    uint80 public currentRoundId;
    mapping(uint80 => Round) public rounds;

    // ============ Events ============

    event PriceUpdated(
        uint80 indexed roundId,
        int256 price,
        uint256 timestamp
    );
    
    event AggregatorUpdated(
        address indexed oldAggregator,
        address indexed newAggregator
    );

    // ============ Modifiers ============

    modifier onlyAggregator() {
        require(msg.sender == aggregator, "Only aggregator");
        _;
    }

    // ============ Constructor ============

    constructor(string memory _symbol) Ownable(msg.sender) {
        symbol = _symbol;
        currentRoundId = 0;
    }

    // ============ External Functions ============

    /**
     * @notice Update price (called by Aggregator)
     * @param newPrice New VWAP price (8 decimals)
     * @param timestamp Update timestamp
     */
    function updatePrice(int256 newPrice, uint256 timestamp) 
        external 
        onlyAggregator 
    {
        require(newPrice > 0, "Invalid price");
        
        currentRoundId++;
        
        rounds[currentRoundId] = Round({
            answer: newPrice,
            startedAt: timestamp,
            updatedAt: block.timestamp,
            answeredInRound: currentRoundId
        });
        
        emit PriceUpdated(currentRoundId, newPrice, timestamp);
    }

    /**
     * @notice Set aggregator address (admin only)
     * @param newAggregator Address of the Aggregator contract
     */
    function setAggregator(address newAggregator) external onlyOwner {
        require(newAggregator != address(0), "Invalid aggregator");
        
        address oldAggregator = aggregator;
        aggregator = newAggregator;
        
        emit AggregatorUpdated(oldAggregator, newAggregator);
    }

    // ============ Chainlink AggregatorV3Interface ============

    /**
     * @notice Get latest round data (Chainlink compatible)
     */
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        Round memory round = rounds[currentRoundId];
        return (
            currentRoundId,
            round.answer,
            round.startedAt,
            round.updatedAt,
            round.answeredInRound
        );
    }

    /**
     * @notice Get round data by ID (Chainlink compatible)
     */
    function getRoundData(uint80 _roundId)
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        Round memory round = rounds[_roundId];
        require(round.updatedAt > 0, "Round not found");
        
        return (
            _roundId,
            round.answer,
            round.startedAt,
            round.updatedAt,
            round.answeredInRound
        );
    }

    /**
     * @notice Get feed description
     */
    function description() external view returns (string memory) {
        return string(abi.encodePacked(symbol, " / USD"));
    }
}
