// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentRegistry
 * @notice Manages agent registration per feed and tracks credibility scores
 * @dev ERC-8004 inspired reputation pattern for oracle credibility
 *      Registration is restricted to owner and authorized registrars
 */
contract AgentRegistry is Ownable {
    // ============ State Variables ============

    // Role-based access control
    address public aggregator;
    address public distributor;
    
    // Registrar role - addresses authorized to register agents
    mapping(address => bool) public registrars;

    // agent => feed symbol => registered
    mapping(address => mapping(string => bool)) public registrations;
    
    // agent => credibility score (basis points, 10000 = 100%)
    mapping(address => uint256) public credibilityScores;
    
    // agent => total updates submitted
    mapping(address => uint256) public updateCount;
    
    // agent => cumulative accuracy score
    mapping(address => uint256) public accuracyScore;
    
    // agent => epoch when first registered
    mapping(address => uint256) public agentStartEpoch;
    
    // Current epoch (incremented by MTokenDistributor)
    uint256 public currentEpoch = 1;
    
    // Default credibility for new agents (50% = 5000 basis points)
    uint256 public constant DEFAULT_CREDIBILITY = 5000;
    
    // Minimum updates before credibility is fully calculated
    uint256 public constant MIN_UPDATES_FOR_FULL_CREDIBILITY = 10;
    
    // Credibility growth factor per epoch (logarithmic)
    uint256 public constant GROWTH_FACTOR = 100;  // 1% per epoch, logarithmic

    // ============ Events ============

    event AgentRegistered(address indexed agent, string indexed feedSymbol, uint256 timestamp);
    event CredibilityUpdated(address indexed agent, uint256 oldScore, uint256 newScore);
    event AggregatorSet(address indexed aggregator);
    event DistributorSet(address indexed distributor);
    event RegistrarUpdated(address indexed registrar, bool authorized);
    
    event UpdateRecorded(
        address indexed agent,
        uint256 newCount
    );

    // ============ Modifiers ============

    modifier onlyAggregator() {
        require(msg.sender == aggregator, "Only aggregator");
        _;
    }

    modifier onlyDistributor() {
        require(msg.sender == distributor, "Only distributor");
        _;
    }
    
    /**
     * @notice Only owner or authorized registrars can call
     */
    modifier onlyRegistrar() {
        require(msg.sender == owner() || registrars[msg.sender], "Not authorized registrar");
        _;
    }

    // ============ Constructor ============

    constructor() Ownable(msg.sender) {}

    // ============ External Functions ============

    /**
     * @notice Set aggregator address (owner only)
     * @param _aggregator Address of Aggregator contract
     */
    function setAggregator(address _aggregator) external onlyOwner {
        require(_aggregator != address(0), "Invalid aggregator");
        aggregator = _aggregator;
        emit AggregatorSet(_aggregator);
    }

    /**
     * @notice Set distributor address (owner only)
     * @param _distributor Address of MTokenDistributor contract
     */
    function setDistributor(address _distributor) external onlyOwner {
        require(_distributor != address(0), "Invalid distributor");
        distributor = _distributor;
        emit DistributorSet(_distributor);
    }
    
    /**
     * @notice Add or remove a registrar (owner only)
     * @param registrar Address to authorize/deauthorize
     * @param authorized True to authorize, false to revoke
     */
    function setRegistrar(address registrar, bool authorized) external onlyOwner {
        require(registrar != address(0), "Invalid registrar");
        registrars[registrar] = authorized;
        emit RegistrarUpdated(registrar, authorized);
    }
    
    /**
     * @notice Check if an address is an authorized registrar
     * @param account Address to check
     */
    function isRegistrar(address account) external view returns (bool) {
        return account == owner() || registrars[account];
    }

    /**
     * @notice Register an agent to a specific feed (registrar only)
     * @param agent Address of the agent
     * @param feedSymbol Symbol of the feed (e.g., "DOGE")
     */
    function registerAgent(address agent, string calldata feedSymbol) external onlyRegistrar {
        require(!registrations[agent][feedSymbol], "Already registered");
        
        registrations[agent][feedSymbol] = true;
        
        // Initialize credibility and epoch tracking if first registration
        if (credibilityScores[agent] == 0) {
            credibilityScores[agent] = DEFAULT_CREDIBILITY;
            agentStartEpoch[agent] = currentEpoch;
        }
        
        emit AgentRegistered(agent, feedSymbol, block.timestamp);
    }

    /**
     * @notice Check if agent is registered to a feed
     * @param agent Address of the agent
     * @param feedSymbol Symbol of the feed
     */
    function isRegistered(address agent, string calldata feedSymbol) 
        external 
        view 
        returns (bool) 
    {
        return registrations[agent][feedSymbol];
    }

    /**
     * @notice Get credibility score for an agent with logarithmic growth
     * @param agent Address of the agent
     * @return Credibility score in basis points (10000 = 100%)
     * @dev Credibility = baseCredibility + log-linear growth based on epochs active
     */
    function getCredibility(address agent) external view returns (uint256) {
        uint256 baseScore = credibilityScores[agent];
        if (baseScore == 0) return DEFAULT_CREDIBILITY;
        
        // Calculate logarithmic growth bonus
        uint256 epochsActive = currentEpoch > agentStartEpoch[agent] 
            ? currentEpoch - agentStartEpoch[agent] 
            : 0;
        
        if (epochsActive == 0) return baseScore;
        
        // Logarithmic growth: bonus = GROWTH_FACTOR * log2(epochsActive + 1)
        // Approximation: Each doubling of epochs adds GROWTH_FACTOR
        uint256 logBonus = 0;
        uint256 temp = epochsActive + 1;
        
        while (temp > 1) {
            logBonus += GROWTH_FACTOR;
            temp = temp / 2;
        }
        
        uint256 finalScore = baseScore + logBonus;
        
        // Cap at 100%
        return finalScore > 10000 ? 10000 : finalScore;
    }
    
    /**
     * @notice Increment epoch (distributor only)
     */
    function incrementEpoch() external onlyDistributor {
        currentEpoch++;
    }

    /**
     * @notice Record an update from an agent (aggregator only)
     * @param agent Address of the agent
     */
    function recordUpdate(address agent) external onlyAggregator {
        updateCount[agent]++;
        emit UpdateRecorded(agent, updateCount[agent]);
    }

    /**
     * @notice Update credibility based on accuracy (called by Aggregator)
     * @param agent Address of the agent
     * @param accuracyBasisPoints Accuracy in basis points (10000 = 100% accurate)
     */
    function updateCredibilityFromAccuracy(address agent, uint256 accuracyBasisPoints) 
        external 
        onlyOwner 
    {
        uint256 updates = updateCount[agent];
        
        // Add to cumulative accuracy
        accuracyScore[agent] += accuracyBasisPoints;
        
        uint256 oldScore = credibilityScores[agent];
        uint256 newScore;
        
        if (updates < MIN_UPDATES_FOR_FULL_CREDIBILITY) {
            // New agents start at 50%, gradually approach calculated score
            newScore = DEFAULT_CREDIBILITY;
        } else {
            // Calculate average accuracy
            uint256 avgAccuracy = accuracyScore[agent] / updates;
            newScore = avgAccuracy > 10000 ? 10000 : avgAccuracy;
        }
        
        credibilityScores[agent] = newScore;
        emit CredibilityUpdated(agent, oldScore, newScore);
    }

    /**
     * @notice Manually set credibility (admin override)
     * @param agent Address of the agent
     * @param newScore New credibility score in basis points
     */
    function setCredibility(address agent, uint256 newScore) external onlyOwner {
        require(newScore <= 10000, "Score too high");
        
        uint256 oldScore = credibilityScores[agent];
        credibilityScores[agent] = newScore;
        
        emit CredibilityUpdated(agent, oldScore, newScore);
    }

    /**
     * @notice Get agent statistics
     * @param agent Address of the agent
     */
    function getAgentStats(address agent) 
        external 
        view 
        returns (
            uint256 updates,
            uint256 credibility,
            uint256 avgAccuracy
        ) 
    {
        updates = updateCount[agent];
        credibility = credibilityScores[agent];
        avgAccuracy = updates > 0 ? accuracyScore[agent] / updates : 0;
    }
}
