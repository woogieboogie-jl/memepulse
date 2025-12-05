// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ProtocolConfig
 * @notice Centralized configuration for protocol parameters
 * @dev All configurable values should be managed through this contract
 */
contract ProtocolConfig is Ownable {
    // ============ State Variables ============

    // VCWAP calculation
    uint256 public maxUpdatesForVCWAP = 30;  // N value for VCWAP calculation
    uint256 public minCredibility = 500;     // 5% minimum credibility
    
    // Rewards
    uint256 public baseRewardPerUpdate = 100000 * 10**18;  // 0.1M M tokens per update
    uint256 public epochDuration = 1 weeks;
    
    // Credibility growth
    uint256 public initialCredibility = 5000;  // 50% for new agents
    uint256 public credibilityGrowthFactor = 100;  // Growth rate per epoch
    
    // Feed symbols => base reward multiplier (basis points, 10000 = 1x)
    mapping(string => uint256) public feedRewardMultipliers;

    // ============ Events ============

    event MaxUpdatesUpdated(uint256 oldValue, uint256 newValue);
    event MinCredibilityUpdated(uint256 oldValue, uint256 newValue);
    event BaseRewardUpdated(uint256 oldValue, uint256 newValue);
    event EpochDurationUpdated(uint256 oldValue, uint256 newValue);
    event CredibilityGrowthUpdated(uint256 oldValue, uint256 newValue);
    event FeedMultiplierSet(string indexed feedSymbol, uint256 multiplier);

    // ============ Constructor ============

    constructor() Ownable(msg.sender) {
        // Set default feed multipliers (all 1x initially)
        string[7] memory feeds = ["BTC", "DOGE", "PEPE", "SHIB", "FLOKI", "WIF", "BONK"];
        for (uint256 i = 0; i < feeds.length; i++) {
            feedRewardMultipliers[feeds[i]] = 10000;  // 1x
        }
    }

    // ============ Configuration Functions ============

    function setMaxUpdates(uint256 _maxUpdates) external onlyOwner {
        require(_maxUpdates >= 10 && _maxUpdates <= 100, "Invalid range");
        uint256 old = maxUpdatesForVCWAP;
        maxUpdatesForVCWAP = _maxUpdates;
        emit MaxUpdatesUpdated(old, _maxUpdates);
    }

    function setMinCredibility(uint256 _minCredibility) external onlyOwner {
        require(_minCredibility <= 10000, "Too high");
        uint256 old = minCredibility;
        minCredibility = _minCredibility;
        emit MinCredibilityUpdated(old, _minCredibility);
    }

    function setBaseReward(uint256 _baseReward) external onlyOwner {
        uint256 old = baseRewardPerUpdate;
        baseRewardPerUpdate = _baseReward;
        emit BaseRewardUpdated(old, _baseReward);
    }

    function setEpochDuration(uint256 _duration) external onlyOwner {
        require(_duration >= 1 days && _duration <= 30 days, "Invalid duration");
        uint256 old = epochDuration;
        epochDuration = _duration;
        emit EpochDurationUpdated(old, _duration);
    }

    function setCredibilityGrowthFactor(uint256 _factor) external onlyOwner {
        uint256 old = credibilityGrowthFactor;
        credibilityGrowthFactor = _factor;
        emit CredibilityGrowthUpdated(old, _factor);
    }

    function setFeedMultiplier(string calldata feedSymbol, uint256 multiplier) 
        external 
        onlyOwner 
    {
        require(multiplier <= 50000, "Multiplier too high"); // Max 5x
        feedRewardMultipliers[feedSymbol] = multiplier;
        emit FeedMultiplierSet(feedSymbol, multiplier);
    }

    // ============ View Functions ============

    function getFeedReward(string calldata feedSymbol) 
        external 
        view 
        returns (uint256) 
    {
        uint256 multiplier = feedRewardMultipliers[feedSymbol];
        if (multiplier == 0) multiplier = 10000;  // Default 1x
        
        return (baseRewardPerUpdate * multiplier) / 10000;
    }
}
