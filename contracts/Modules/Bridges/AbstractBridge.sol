// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

import "../Module.sol";
import "../../AuthContext.sol";
import "../../Libraries/Roles.sol";
import "../../Interfaces/ERC20.sol";
import "../../Interfaces/GnosisSafe.sol";

abstract contract AbstractBridge is Module, AuthContext {
    ERC20 public immutable bridgeToken;

    event Bridged(GnosisSafe indexed safe, address indexed receiver, uint256 amount, uint256 toChainId);
    event AllowedBridgeContract(address indexed bridge, uint256 toChainId);
    event AllowedReceiverAddress(address indexed safe, address indexed receiver, uint256 toChainId);

    /// @notice whitelist 1 contract for each from/to chainId
    mapping(uint256 => address) public allowedBridgeAddresses;

    /// @notice whitelist multiple addresses for each destination chainId
    mapping(address => mapping(uint256 => mapping(address => bool))) public allowedReceiverAddresses;

    /// @dev checks the receiving chain and address are allowed
    modifier onlyAllowedReceiver(
        GnosisSafe safe,
        uint256 destChainId,
        address receiver
    ) {
        require(allowedBridgeAddresses[destChainId] != address(0), "B03");
        require(allowedReceiverAddresses[address(safe)][destChainId][receiver], "B04");

        _;
    }

    constructor(
        ExtRegistry _extRegistry,
        AuthRegistry _authRegistry,
        ERC20 _bridgeToken
    ) AuthContext(_extRegistry, _authRegistry) {
        bridgeToken = _bridgeToken;
    }

    function bridge(
        GnosisSafe safe,
        address receiverAddress,
        uint256 destChainId,
        bool isTransferFromL1,
        bytes memory bridgeData
    ) external virtual;

    /// @notice allows safe to whitelist a bridging protocol to a destination chain
    function allowBridgeContract(uint256 toChainId, address bridgeContract) external virtual authorized(Roles.BRIDGE_ADMIN) {
        allowedBridgeAddresses[toChainId] = bridgeContract;
        emit AllowedBridgeContract(bridgeContract, toChainId);
    }

    /// @notice allows safe to whitelist a receiver address to receiver assets on a destination chain
    function allowReceiverAddress(
        GnosisSafe safe,
        uint256 toChainId,
        address receiverAddress,
        bool value
    ) external virtual authorized(Roles.BRIDGE_ADMIN) {
        allowedReceiverAddresses[address(safe)][toChainId][receiverAddress] = value;
        emit AllowedReceiverAddress(address(safe), receiverAddress, toChainId);
    }
}
