// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AgentRegistry.sol";
import "./PriceFeed.sol";
import "./ProtocolConfig.sol";

/**
 * @title Aggregator
 * @notice Receives agent updates, validates, calculates VCWAP, updates PriceFeed
 * @dev Central contract coordinating oracle updates with Volume-Credibility-Weighted pricing
 */
contract Aggregator is Ownable, ReentrancyGuard {
    // ============ Structs ============

    struct AgentUpdateReport {
        uint256 price;          // Execution price (8 decimals)
        uint256 volume;         // Trade size in USD (8 decimals)
        bool isLong;            // Trade direction
        uint8 leverage;         // 1-10x
        uint256 timestamp;      // Block timestamp
        bytes32 orderlyTxHash;  // Proof from Arbitrum
        address agent;          // Agent address
    }

    // ============ State Variables ============

    AgentRegistry public agentRegistry;
    address public mTokenDistributor;
    ProtocolConfig public config;
    
    // Feed symbol => PriceFeed contract
    mapping(string => PriceFeed) public priceFeeds;
    
    // Feed symbol => array of recent updates
    mapping(string => AgentUpdateReport[]) public updates;
    
    // Track processed Orderly tx hashes to prevent replay
    mapping(bytes32 => bool) public processedTxHashes;

    // ============ Events ============

    event UpdateSubmitted(
        address indexed agent,
        string indexed feedSymbol,
        uint256 price,
        uint256 volume,
        uint256 timestamp,
        bytes32 orderlyTxHash
    );

    event VWAPCalculated(
        string indexed feedSymbol,
        uint256 vwap,
        uint256 updateCount
    );
    
    event PriceFeedSet(
        string indexed feedSymbol,
        address indexed priceFeed
    );

    // ============ Constructor ============

    constructor(
        address _agentRegistry,
        address _mTokenDistributor,
        address _config
    ) Ownable(msg.sender) {
        require(_agentRegistry != address(0), "Invalid registry");
        require(_config != address(0), "Invalid config");
        agentRegistry = AgentRegistry(_agentRegistry);
        mTokenDistributor = _mTokenDistributor;
        config = ProtocolConfig(_config);
    }

    // ============ External Functions ============

    /**
     * @notice Submit agent update report
     * @param agent Address of the submitting agent
     * @param feedSymbol Symbol of the feed
     * @param report Update report struct
     */
    function submitUpdate(
        address agent,
        string calldata feedSymbol,
        AgentUpdateReport calldata report
    ) external nonReentrant {
        // Validate
        require(agentRegistry.isRegistered(agent, feedSymbol), "Agent not registered");
        require(report.volume > 0, "Volume must be > 0");
        require(report.leverage > 0, "Leverage must be > 0");
        require(report.timestamp <= block.timestamp, "Future timestamp");
        require(!processedTxHashes[report.orderlyTxHash], "Already processed");
        require(address(priceFeeds[feedSymbol]) != address(0), "Feed not found");
        
        // Mark tx as processed
        processedTxHashes[report.orderlyTxHash] = true;
        
        // Store update with agent address
        AgentUpdateReport memory fullReport = report;
        fullReport.agent = agent;
        
        updates[feedSymbol].push(fullReport);
        
        // Trim to maxUpdates from config
        uint256 maxUpdates = config.maxUpdatesForVCWAP();
        if (updates[feedSymbol].length > maxUpdates) {
            // Remove oldest update (shift array)
            for (uint256 i = 0; i < updates[feedSymbol].length - 1; i++) {
                updates[feedSymbol][i] = updates[feedSymbol][i + 1];
            }
            updates[feedSymbol].pop();
        }
        
        // Record in AgentRegistry
        agentRegistry.recordUpdate(agent);
        
        // Calculate and update VWAP
        uint256 vwap = calculateVWAP(feedSymbol);
        priceFeeds[feedSymbol].updatePrice(int256(vwap), block.timestamp);
        
        // Notify distributor (for rewards tracking)
        if (mTokenDistributor != address(0)) {
            // Call recordContribution on distributor
            (bool success, ) = mTokenDistributor.call(
                abi.encodeWithSignature(
                    "recordContribution(address,uint256)",
                    agent,
                    report.volume
                )
            );
            require(success, "Distributor call failed");
        }
        
        emit UpdateSubmitted(
            agent,
            feedSymbol,
            report.price,
            report.volume,
            report.timestamp,
            report.orderlyTxHash
        );
        
        emit VWAPCalculated(feedSymbol, vwap, updates[feedSymbol].length);
    }

    /**
     * @notice Calculate VCWAP (Volume-Credibility-Weighted Average Price) from last N updates
     * @dev VCWAP = Σ(price × weight) / Σ(weight) where weight = volume × credibility × leverage
     * @param feedSymbol Symbol of the feed
     * @return vcwap Calculated VCWAP price
     */
    function calculateVWAP(string calldata feedSymbol) 
        public 
        view 
        returns (uint256) 
    {
        AgentUpdateReport[] storage recentUpdates = updates[feedSymbol];
        uint256 count = recentUpdates.length;
        
        require(count > 0, "No updates available");
        
        uint256 weightedSum = 0;
        uint256 totalWeight = 0;
        
        for (uint256 i = 0; i < count; i++) {
            AgentUpdateReport memory update = recentUpdates[i];
            
            // Get agent credibility (default 10000 = 100%)
            uint256 credibility = agentRegistry.getCredibility(update.agent);
            uint256 minCred = config.minCredibility();
            if (credibility < minCred) credibility = minCred;
            
            // VCWAP Weight = volume × credibility × leverage
            // credibility is basis points, so divide by 10000
            uint256 weight = (update.volume * credibility * update.leverage) / 10000;
            
            weightedSum += update.price * weight;
            totalWeight += weight;
        }
        
        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }

    /**
     * @notice Set price feed contract for a symbol (admin only)
     * @param feedSymbol Symbol of the feed
     * @param priceFeed Address of PriceFeed contract
     */
    function setPriceFeed(string calldata feedSymbol, address priceFeed) 
        external 
        onlyOwner 
    {
        require(priceFeed != address(0), "Invalid price feed");
        priceFeeds[feedSymbol] = PriceFeed(priceFeed);
        emit PriceFeedSet(feedSymbol, priceFeed);
    }

    /**
     * @notice Set M token distributor address
     * @param _distributor Address of distributor
     */
    function setDistributor(address _distributor) external onlyOwner {
        mTokenDistributor = _distributor;
    }

    /**
     * @notice Get last N updates for a feed
     * @param feedSymbol Symbol of the feed
     * @param n Number of updates to retrieve
     */
    function getLastNUpdates(string calldata feedSymbol, uint256 n)
        external
        view
        returns (AgentUpdateReport[] memory)
    {
        AgentUpdateReport[] storage allUpdates = updates[feedSymbol];
        uint256 count = allUpdates.length < n ? allUpdates.length : n;
        
        AgentUpdateReport[] memory result = new AgentUpdateReport[](count);
        
        for (uint256 i = 0; i < count; i++) {
            result[i] = allUpdates[allUpdates.length - count + i];
        }
        
        return result;
    }

    /**
     * @notice Get total updates for a feed
     * @param feedSymbol Symbol of the feed
     */
    function getUpdateCount(string calldata feedSymbol) 
        external 
        view 
        returns (uint256) 
    {
        return updates[feedSymbol].length;
    }
}
