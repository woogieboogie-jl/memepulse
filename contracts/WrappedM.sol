// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title WrappedM
 * @notice ERC20 wrapped version of native M token for MemePulse
 * @dev Simple ERC20 with fixed initial supply - simulating wrapped native token
 */
contract WrappedM is ERC20 {
    constructor() ERC20("Wrapped M", "wM") {
        // Mint 1M tokens to deployer (simulating subsidiary from MemeCore)
        _mint(msg.sender, 1_000_000 * 10**18);
    }
}

