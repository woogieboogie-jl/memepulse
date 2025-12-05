// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/ProtocolConfig.sol";
import "../contracts/AgentRegistry.sol";
import "../contracts/Aggregator.sol";
import "../contracts/PriceFeed.sol";
import "../contracts/MToken.sol";
import "../contracts/MTokenDistributor.sol";

/**
 * @title VerifyDeployment
 * @notice Verify deployed contracts work on live Anvil node
 */
contract VerifyDeployment is Script {
    function run() external view {
        // Read addresses from environment or use deployed addresses
        address configAddr = 0x5FbDB2315678afecb367f032d93F642f64180aa3;  // First deployment
        address registryAddr = 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512;
        address aggregatorAddr = 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0;
        address dogeAddr = 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9;
        
        console.log("=== Verifying Deployment ===");
        console.log("");
        
        // Check ProtocolConfig
        ProtocolConfig config = ProtocolConfig(configAddr);
        console.log("ProtocolConfig:");
        console.log("  maxUpdatesForVCWAP:", config.maxUpdatesForVCWAP());
        console.log("  baseRewardPerUpdate:", config.baseRewardPerUpdate() / 10**18, "M");
        console.log("  epochDuration:", config.epochDuration() / 1 days, "days");
        console.log("");
        
        // Check AgentRegistry
        AgentRegistry registry = AgentRegistry(registryAddr);
        console.log("AgentRegistry:");
        console.log("  currentEpoch:", registry.currentEpoch());
        console.log("");
        
        // Check Aggregator
        Aggregator aggregator = Aggregator(aggregatorAddr);
        console.log("Aggregator:");
        console.log("  DOGE Feed:", address(aggregator.priceFeeds("DOGE")));
        console.log("");
        
        // Check PriceFeed
        PriceFeed dogeFeed = PriceFeed(dogeAddr);
        console.log("DOGE PriceFeed:");
        console.log("  symbol:", dogeFeed.symbol());
        (uint80 roundId, int256 price, , , ) = dogeFeed.latestRoundData();
        console.log("  roundId:", roundId);
        console.log("  price:", price);
        
        console.log("");
        console.log("[OK] All contracts deployed and responding!");
    }
}
