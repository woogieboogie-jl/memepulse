// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract MemeVault {
    IERC20 public mToken;
    address public oracleAddress;

    modifier onlyOracle() {
        require(msg.sender == oracleAddress, "Only Oracle can call this");
        _;
    }

    constructor(address _mToken) {
        mToken = IERC20(_mToken);
    }

    function setOracleAddress(address _oracleAddress) external {
        // In production, add onlyOwner modifier
        oracleAddress = _oracleAddress;
    }

    // Reward Formula: (Volume * Score) / Difficulty
    function distributeReward(address agent, uint256 volume, uint256 score) external onlyOracle {
        // Simple formula for hackathon: 1 Volume * 1 Score = 1 Token (scaled)
        // Adjust divider to control inflation
        uint256 rewardAmount = (volume * score) / 100; 
        
        // Check if vault has enough balance
        // if (mToken.balanceOf(address(this)) >= rewardAmount) {
        //    mToken.transfer(agent, rewardAmount);
        // }
        // For demo purposes, we might just emit an event if no token is connected yet
    }
}
