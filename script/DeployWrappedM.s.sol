// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/WrappedM.sol";

/**
 * @title DeployWrappedM
 * @notice Deployment script for WrappedM token
 * @dev Run with: forge script script/DeployWrappedM.s.sol:DeployWrappedM --rpc-url memecore --broadcast
 */
contract DeployWrappedM is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        WrappedM wrappedM = new WrappedM();
        
        console.log("WrappedM deployed at:", address(wrappedM));
        console.log("Deployer balance:", wrappedM.balanceOf(msg.sender));
        
        vm.stopBroadcast();
    }
}

