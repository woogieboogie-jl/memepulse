// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MToken
 * @notice ERC20 token for MemePulse oracle rewards
 * @dev Standard ERC20 with controlled minting
 */
contract MToken is ERC20, Ownable {
    // ============ State Variables ============

    address public distributor;
    
    // ============ Events ============

    event DistributorUpdated(
        address indexed oldDistributor,
        address indexed newDistributor
    );

    // ============ Modifiers ============

    modifier onlyDistributor() {
        require(msg.sender == distributor, "Only distributor");
        _;
    }

    // ============ Constructor ============

    constructor() ERC20("MemeCore Token", "M") Ownable(msg.sender) {
        // Initial mint to owner (can be burned or transferred to treasury)
        _mint(msg.sender, 1_000_000_000 * 10**18);  // 1B M tokens
    }

    // ============ External Functions ============

    /**
     * @notice Mint tokens (only distributor)
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyDistributor {
        _mint(to, amount);
    }

    /**
     * @notice Set distributor address (admin only)
     * @param _distributor Address of MTokenDistributor contract
     */
    function setDistributor(address _distributor) external onlyOwner {
        require(_distributor != address(0), "Invalid distributor");
        
        address oldDistributor = distributor;
        distributor = _distributor;
        
        emit DistributorUpdated(oldDistributor, _distributor);
    }

    /**
     * @notice Burn tokens from caller
     * @param amount Amount to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
