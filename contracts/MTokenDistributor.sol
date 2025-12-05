// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./MToken.sol";
import "./AgentRegistry.sol";

/**
 * @title MTokenDistributor
 * @notice Epoch-based M token reward distribution for oracle contributors
 * @dev Pull model: agents claim rewards per epoch
 */
contract MTokenDistributor is Ownable, ReentrancyGuard {
    // ============ State Variables ============

    MToken public mToken;
    AgentRegistry public agentRegistry;
    address public aggregator;
    
    uint256 public currentEpoch;
    uint256 public epochDuration = 1 weeks;
    uint256 public epochStartTime;
    
    // epoch => total updates
    mapping(uint256 => uint256) public epochTotalUpdates;
    
    // epoch => total volume contributed
    mapping(uint256 => uint256) public epochTotalVolume;
    
    // epoch => agent => update count
    mapping(uint256 => mapping(address => uint256)) public agentUpdates;
    
    // epoch => agent => volume contributed
    mapping(uint256 => mapping(address => uint256)) public agentVolume;
    
    // epoch => agent => claimed
    mapping(uint256 => mapping(address => bool)) public claimed;
    
    // feed symbol => base reward per epoch (in M tokens)
    mapping(string => uint256) public feedBaseRewards;
    
    // epoch => total base reward
    mapping(uint256 => uint256) public epochTotalReward;
    
    // Total M tokens allocated for distribution
    uint256 public totalAllocation;
    uint256 public distributedAmount;

    // ============ Events ============

    event RewardClaimed(
        address indexed agent,
        uint256 indexed epoch,
        uint256 amount
    );

    event NewEpoch(
        uint256 indexed epoch,
        uint256 startTime,
        uint256 totalReward
    );
    
    event ContributionRecorded(
        address indexed agent,
        string indexed feedSymbol,
        uint256 volume,
        uint256 epoch
    );
    
    event FeedRewardSet(
        string indexed feedSymbol,
        uint256 baseReward
    );

    // ============ Modifiers ============

    modifier onlyAggregator() {
        require(msg.sender == aggregator, "Only aggregator");
        _;
    }

    // ============ Constructor ============

    constructor(
        address _mToken,
        address _agentRegistry
    ) Ownable(msg.sender) {
        require(_mToken != address(0), "Invalid M token");
        require(_agentRegistry != address(0), "Invalid registry");
        
        mToken = MToken(_mToken);
        agentRegistry = AgentRegistry(_agentRegistry);
        
        currentEpoch = 1;
        epochStartTime = block.timestamp;
        
        // Set default base rewards (can be updated)
        _setDefaultBaseRewards();
    }

    // ============ External Functions ============

    /**
     * @notice Record contribution from agent (called by Aggregator)
     * @param agent Address of the agent
     * @param feedSymbol Symbol of the feed
     * @param volume Volume contributed
     */
    function recordContribution(
        address agent,
        string calldata feedSymbol,
        uint256 volume
    ) external onlyAggregator {
        agentUpdates[currentEpoch][agent]++;
        agentVolume[currentEpoch][agent] += volume;
        
        epochTotalUpdates[currentEpoch]++;
        epochTotalVolume[currentEpoch] += volume;
        
        emit ContributionRecorded(agent, feedSymbol, volume, currentEpoch);
    }

    /**
     * @notice Claim rewards for a specific epoch
     * @param epoch Epoch number to claim
     */
    function claimRewards(uint256 epoch) external nonReentrant {
        require(epoch < currentEpoch, "Epoch not ended");
        require(!claimed[epoch][msg.sender], "Already claimed");
        require(agentUpdates[epoch][msg.sender] > 0, "No contributions");
        
        uint256 reward = calculateReward(msg.sender, epoch);
        require(reward > 0, "No rewards");
        
        claimed[epoch][msg.sender] = true;
        distributedAmount += reward;
        
        // Mint and transfer
        mToken.mint(msg.sender, reward);
        
        emit RewardClaimed(msg.sender, epoch, reward);
    }

    /**
     * @notice Calculate claimable rewards for an agent in an epoch
     * @param agent Address of the agent
     * @param epoch Epoch number
     * @return Claimable reward amount
     */
    function calculateReward(address agent, uint256 epoch) 
        public 
        view 
        returns (uint256) 
    {
        uint256 agentContribution = agentUpdates[epoch][agent];
        uint256 totalContributions = epochTotalUpdates[epoch];
        
        if (totalContributions == 0 || agentContribution == 0) {
            return 0;
        }
        
        // Share of total updates (basis points)
        uint256 share = (agentContribution * 10000) / totalContributions;
        
        // Credibility multiplier
        uint256 credibility = agentRegistry.getCredibility(agent);
        
        // Total reward for this epoch
        uint256 totalReward = epochTotalReward[epoch];
        
        // Reward = totalReward × share × credibility
        // share in basis points (10000 = 100%)
        // credibility in basis points (10000 = 100%)
        // So divide by 10000 × 10000 = 100,000,000
        return (totalReward * share * credibility) / 100000000;
    }

    /**
     * @notice Get claimable rewards for caller in an epoch
     * @param epoch Epoch number
     */
    function getClaimableRewards(address agent, uint256 epoch) 
        external 
        view 
        returns (uint256) 
    {
        if (claimed[epoch][agent]) {
            return 0;
        }
        return calculateReward(agent, epoch);
    }

    /**
     * @notice Start new epoch (admin only)
     */
    function startNewEpoch() external onlyOwner {
        require(
            block.timestamp >= epochStartTime + epochDuration,
            "Epoch not ended"
        );
        
        // Calculate total reward for completed epoch
        uint256 totalReward = _calculateEpochTotalReward();
        epochTotalReward[currentEpoch] = totalReward;
        
        // Increment epoch
        currentEpoch++;
        epochStartTime = block.timestamp;
        
        emit NewEpoch(currentEpoch, epochStartTime, totalReward);
    }

    /**
     * @notice Set base reward for a feed (admin only)
     * @param feedSymbol Symbol of the feed
     * @param baseReward Base reward amount per epoch
     */
    function setFeedBaseReward(string calldata feedSymbol, uint256 baseReward) 
        external 
        onlyOwner 
    {
        feedBaseRewards[feedSymbol] = baseReward;
        emit FeedRewardSet(feedSymbol, baseReward);
    }

    /**
     * @notice Set aggregator address (admin only)
     * @param _aggregator Address of Aggregator contract
     */
    function setAggregator(address _aggregator) external onlyOwner {
        require(_aggregator != address(0), "Invalid aggregator");
        aggregator = _aggregator;
    }

    /**
     * @notice Set epoch duration (admin only)
     * @param _duration New duration in seconds
     */
    function setEpochDuration(uint256 _duration) external onlyOwner {
        require(_duration >= 1 days && _duration <= 30 days, "Invalid duration");
        epochDuration = _duration;
    }

    /**
     * @notice Set total allocation (admin only)
     * @param _allocation Total M tokens allocated
     */
    function setTotalAllocation(uint256 _allocation) external onlyOwner {
        totalAllocation = _allocation;
    }

    /**
     * @notice Get time until next epoch
     */
    function getTimeUntilNextEpoch() external view returns (uint256) {
        uint256 epochEnd = epochStartTime + epochDuration;
        if (block.timestamp >= epochEnd) {
            return 0;
        }
        return epochEnd - block.timestamp;
    }

    /**
     * @notice Get agent stats for current epoch
     * @param agent Address of the agent
     */
    function getCurrentEpochStats(address agent) 
        external 
        view 
        returns (
            uint256 updates,
            uint256 volume,
            uint256 estimatedReward
        ) 
    {
        updates = agentUpdates[currentEpoch][agent];
        volume = agentVolume[currentEpoch][agent];
        estimatedReward = calculateReward(agent, currentEpoch);
    }

    // ============ Internal Functions ============

    /**
     * @notice Calculate total reward for an epoch
     */
    function _calculateEpochTotalReward() internal view returns (uint256) {
        // Sum of all feed base rewards
        // In production, this would query all active feeds
        // For now, return a fixed amount per epoch
        return 10000 * 10**18;  // 10,000 M tokens per epoch
    }

    /**
     * @notice Set default base rewards for feeds
     */
    function _setDefaultBaseRewards() internal {
        // Default: 1000 M tokens per feed per epoch
        string[7] memory feeds = ["BTC", "DOGE", "PEPE", "SHIB", "FLOKI", "WIF", "BONK"];
        
        for (uint256 i = 0; i < feeds.length; i++) {
            feedBaseRewards[feeds[i]] = 1000 * 10**18;
        }
    }
}
