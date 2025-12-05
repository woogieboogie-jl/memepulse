// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/ProtocolConfig.sol";
import "../contracts/AgentRegistry.sol";
import "../contracts/MToken.sol";
import "../contracts/MTokenDistributor.sol";
import "../contracts/Aggregator.sol";
import "../contracts/PriceFeed.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("=== MemePulse Oracle Deployment ===");
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("");

        // 1. Deploy ProtocolConfig
        console.log("Deploying ProtocolConfig...");
        ProtocolConfig config = new ProtocolConfig();
        console.log("  ProtocolConfig:", address(config));
        console.log("");

        // 2. Deploy AgentRegistry
        console.log("Deploying AgentRegistry...");
        AgentRegistry registry = new AgentRegistry();
        console.log("  AgentRegistry:", address(registry));
        console.log("");

        // 3. Deploy MToken
        console.log("Deploying MToken...");
        MToken mToken = new MToken();
        console.log("  MToken:", address(mToken));
        console.log("");

        // 4. Deploy MTokenDistributor
        console.log("Deploying MTokenDistributor...");
        MTokenDistributor distributor = new MTokenDistributor(
            address(mToken),
            address(registry),
            address(config)
        );
        console.log("  MTokenDistributor:", address(distributor));
        console.log("");

        // 5. Deploy Aggregator
        console.log("Deploying Aggregator...");
        Aggregator aggregator = new Aggregator(
            address(registry),
            address(distributor),
            address(config)
        );
        console.log("  Aggregator:", address(aggregator));
        console.log("");

        // 6. Deploy PriceFeeds (7x)
        console.log("Deploying PriceFeeds...");
        string[7] memory feeds = ["BTC", "DOGE", "PEPE", "SHIB", "FLOKI", "WIF", "BONK"];
        address[] memory priceFeedAddresses = new address[](7);
        
        for (uint i = 0; i < feeds.length; i++) {
            PriceFeed feed = new PriceFeed(feeds[i]);
            priceFeedAddresses[i] = address(feed);
            console.log(string.concat("  ", feeds[i], " PriceFeed:"), address(feed));
            
            // Configure
            feed.setAggregator(address(aggregator));
            aggregator.setPriceFeed(feeds[i], address(feed));
        }
        console.log("");

        // 7. Wire contracts together
        console.log("Wiring contracts...");
        mToken.setDistributor(address(distributor));
        console.log("  MToken distributor set");
        
        distributor.setAggregator(address(aggregator));
        console.log("  Distributor aggregator set");
        
        registry.transferOwnership(address(aggregator));
        console.log("  AgentRegistry ownership transferred to Aggregator");
        console.log("");

        vm.stopBroadcast();

        // Output deployment addresses as JSON
        console.log("=== Deployment Complete ===");
        console.log("");
        console.log("Save these addresses to deployments/memecore_testnet.json:");
        console.log("{");
        console.log('  "network": "MemeCore Testnet",');
        console.log('  "chainId": 12227332,');
        console.log('  "contracts": {');
        console.log(string.concat('    "config": "', vm.toString(address(config)), '",'));
        console.log(string.concat('    "registry": "', vm.toString(address(registry)), '",'));
        console.log(string.concat('    "mToken": "', vm.toString(address(mToken)), '",'));
        console.log(string.concat('    "distributor": "', vm.toString(address(distributor)), '",'));
        console.log(string.concat('    "aggregator": "', vm.toString(address(aggregator)), '",'));
        console.log('    "priceFeeds": {');
        for (uint i = 0; i < feeds.length; i++) {
            string memory comma = i < feeds.length - 1 ? "," : "";
            console.log(string.concat('      "', feeds[i], '": "', vm.toString(priceFeedAddresses[i]), '"', comma));
        }
        console.log('    }');
        console.log('  }');
        console.log('}');
    }
}
