// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface AggregatorV3Interface {
    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80);
}

interface IMemeVault {
    function distributeReward(address agent, uint256 volume, uint256 score) external;
}

contract AgentOracle is AggregatorV3Interface {
    address public trustedSigner; // Backend (MemePulse) signer address
    address public memeVault;     // Reward contract address

    struct OraclePayload {
        string symbol;      // e.g., "DOGE"
        int256 price;       // e.g., 42000000
        uint256 volume;     // e.g., 1000 USDC
        uint256 socialScore;// 0~100 (Pulse Score)
        uint256 timestamp;  // Execution Time
        bytes signature;    // Signed by Backend
    }

    mapping(string => int256) public latestPrices;
    mapping(string => uint256) public latestScores;

    event PulseUpdated(string symbol, int256 price, uint256 score, address agent);

    constructor(address _trustedSigner) {
        trustedSigner = _trustedSigner;
    }

    function setMemeVault(address _memeVault) external {
        // In production, add onlyOwner modifier
        memeVault = _memeVault;
    }

    // [Core] Function for agents to submit data
    function submitPulse(OraclePayload calldata payload) external {
        // 1. Verify Signature (Data Integrity Check)
        bytes32 messageHash = keccak256(abi.encodePacked(
            payload.symbol, payload.price, payload.volume, payload.socialScore, payload.timestamp
        ));
        bytes32 ethSignedMessageHash = getEthSignedMessageHash(messageHash);
        address recoveredSigner = recoverSigner(ethSignedMessageHash, payload.signature);
        
        require(recoveredSigner == trustedSigner, "Invalid Pulse Signature");
        require(block.timestamp < payload.timestamp + 5 minutes, "Stale Pulse");

        // 2. Update Data (Oracle)
        latestPrices[payload.symbol] = payload.price;
        latestScores[payload.symbol] = payload.socialScore;

        // 3. Request Reward Distribution (PoM Mining)
        if (memeVault != address(0)) {
            IMemeVault(memeVault).distributeReward(msg.sender, payload.volume, payload.socialScore);
        }
        
        emit PulseUpdated(payload.symbol, payload.price, payload.socialScore, msg.sender);
    }

    // Helper: Get Eth Signed Message Hash
    function getEthSignedMessageHash(bytes32 _messageHash) public pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash));
    }

    // Helper: Recover Signer
    function recoverSigner(bytes32 _ethSignedMessageHash, bytes _signature) public pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(_signature);
        return ecrecover(_ethSignedMessageHash, v, r, s);
    }

    function splitSignature(bytes memory sig) public pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "invalid signature length");
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }

    // Chainlink Compatible Interface (Other DApps can use this)
    function latestRoundData() external view override returns (uint80, int256, uint256, uint256, uint80) {
        // Returning DOGE price as default for this hackathon demo
        return (0, latestPrices["DOGE"], 0, block.timestamp, 0);
    }
}
