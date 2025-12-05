// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/AgentRegistry.sol";

contract AgentRegistryTest is Test {
    AgentRegistry public registry;
    address public owner;
    address public agent1;
    address public agent2;

    function setUp() public {
        owner = address(this);
        agent1 = address(0x1);
        agent2 = address(0x2);
        registry = new AgentRegistry();
        
        // Set test contract as aggregator and distributor for testing
        registry.setAggregator(address(this));
        registry.setDistributor(address(this));
    }

    function testRegisterAgent() public {
        registry.registerAgent(agent1, "DOGE");
        assertTrue(registry.isRegistered(agent1, "DOGE"));
    }

    function testCannotRegisterTwice() public {
        registry.registerAgent(agent1, "DOGE");
        
        vm.expectRevert("Already registered");
        registry.registerAgent(agent1, "DOGE");
    }

    function testRegisterMultipleFeeds() public {
        registry.registerAgent(agent1, "DOGE");
        registry.registerAgent(agent1, "PEPE");
        
        assertTrue(registry.isRegistered(agent1, "DOGE"));
        assertTrue(registry.isRegistered(agent1, "PEPE"));
    }

    function testInitialCredibility() public {
        registry.registerAgent(agent1, "DOGE");
        uint256 credibility = registry.getCredibility(agent1);
        assertEq(credibility, 5000); // 50%
    }

    function testLogarithmicCredibilityGrowth() public {
        registry.registerAgent(agent1, "DOGE");
        
        // Epoch 0: 50%
        uint256 cred0 = registry.getCredibility(agent1);
        assertEq(cred0, 5000);
        
        // Epoch 1: 51% (log2(1+1) = 1, bonus = 100)
        registry.incrementEpoch();
        uint256 cred1 = registry.getCredibility(agent1);
        assertEq(cred1, 5100);
        
        // Epoch 2: 51% (log2(2+1) = 1, bonus still 100)
        registry.incrementEpoch();
        uint256 cred2 = registry.getCredibility(agent1);
        assertEq(cred2, 5100);
        
        // Epoch 4: 52% (log2(4+1) = 2, bonus = 200)
        registry.incrementEpoch();
        registry.incrementEpoch();
        uint256 cred4 = registry.getCredibility(agent1);
        assertEq(cred4, 5200);
        
        // Test logarithmic behavior: many epochs later
        for (uint i = 0; i < 20; i++) {
            registry.incrementEpoch();
        }
        uint256 credFinal = registry.getCredibility(agent1);
        assertTrue(credFinal > 5200);
        assertTrue(credFinal <= 10000); // Capped at 100%
    }

    function testCredibilityCappedAt100Percent() public {
        registry.registerAgent(agent1, "DOGE");
        
        // Manually set to test the cap
        vm.expectRevert("Score too high");
        registry.setCredibility(agent1, 15000); // Try to set above 100%
        // Should have failed in require, but let's test the getter caps it
    }
    
    function testCredibilityNeverExceeds100Percent() public {
        registry.registerAgent(agent1, "DOGE");
        
        // Set to 95%
        registry.setCredibility(agent1, 9500);
        
        // Add many epochs
        for (uint i = 0; i < 1000; i++) {
            registry.incrementEpoch();
        }
        
        uint256 credibility = registry.getCredibility(agent1);
        assertTrue(credibility <= 10000); // Should never exceed 100%
        assertTrue(credibility == 10000); // Should actually hit cap
    }

    function testRecordUpdate() public {
        registry.registerAgent(agent1, "DOGE");
        
        registry.recordUpdate(agent1);
        registry.recordUpdate(agent1);
        
        (uint256 updates,,) = registry.getAgentStats(agent1);
        assertEq(updates, 2);
    }

    function testManualCredibilitySet() public {
        registry.registerAgent(agent1, "DOGE");
        
        registry.setCredibility(agent1, 7500);
        assertEq(registry.getCredibility(agent1), 7500);
    }

    function testCredibilityCannotExceed100Percent() public {
        vm.expectRevert("Score too high");
        registry.setCredibility(agent1, 15000);
    }

    function testOnlyOwnerCanSetCredibility() public {
        registry.registerAgent(agent1, "DOGE");
        
        vm.prank(agent1);
        vm.expectRevert();
        registry.setCredibility(agent1, 8000);
    }
}
