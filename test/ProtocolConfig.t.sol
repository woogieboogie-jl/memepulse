// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/ProtocolConfig.sol";

contract ProtocolConfigTest is Test {
    ProtocolConfig public config;
    address public owner;
    address public user;

    function setUp() public {
        owner = address(this);
        user = address(0x1);
        config = new ProtocolConfig();
    }

    function testInitialValues() public {
        assertEq(config.maxUpdatesForVCWAP(), 30);
        assertEq(config.minCredibility(), 500);
        assertEq(config.baseRewardPerUpdate(), 100000 * 10**18);
        assertEq(config.epochDuration(), 1 weeks);
        assertEq(config.initialCredibility(), 5000);
        assertEq(config.credibilityGrowthFactor(), 100);
    }

    function testSetMaxUpdates() public {
        config.setMaxUpdates(50);
        assertEq(config.maxUpdatesForVCWAP(), 50);
    }

    function testSetMaxUpdatesOutOfRange() public {
        vm.expectRevert("Invalid range");
        config.setMaxUpdates(5);

        vm.expectRevert("Invalid range");
        config.setMaxUpdates(150);
    }

    function testSetMinCredibility() public {
        config.setMinCredibility(1000);
        assertEq(config.minCredibility(), 1000);
    }

    function testSetBaseReward() public {
        uint256 newReward = 200000 * 10**18;
        config.setBaseReward(newReward);
        assertEq(config.baseRewardPerUpdate(), newReward);
    }

    function testSetEpochDuration() public {
        config.setEpochDuration(2 weeks);
        assertEq(config.epochDuration(), 2 weeks);
    }

    function testSetEpochDurationInvalid() public {
        vm.expectRevert("Invalid duration");
        config.setEpochDuration(1 hours);

        vm.expectRevert("Invalid duration");
        config.setEpochDuration(31 days);
    }

    function testFeedRewardMultiplier() public {
        // Default is 1x (10000)
        uint256 defaultReward = config.getFeedReward("DOGE");
        assertEq(defaultReward, 100000 * 10**18);

        // Set to 1.5x
        config.setFeedMultiplier("DOGE", 15000);
        uint256 boostedReward = config.getFeedReward("DOGE");
        assertEq(boostedReward, 150000 * 10**18);
    }

    function testFeedMultiplierTooHigh() public {
        vm.expectRevert("Multiplier too high");
        config.setFeedMultiplier("DOGE", 60000);
    }

    function testOnlyOwnerCanUpdate() public {
        vm.prank(user);
        vm.expectRevert();
        config.setMaxUpdates(40);
    }
}
