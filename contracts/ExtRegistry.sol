// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

import "./Interfaces/GnosisSafe.sol";

/// @title ExtRegistry
/// @notice This contract is responsible to track authorized external contracts.
/// @notice Other modules should query this contract before making any external call.
contract ExtRegistry {
    event SafeChanged(GnosisSafe indexed safe);
    event ExternalAddressSet(address indexed ext, bool indexed allowed);

    /// @notice The safe this registry is bounded to.
    GnosisSafe internal safe;

    mapping(address => bool) public isExternalAddressAllowed;

    constructor(GnosisSafe _safe) {
        safe = _safe;
    }

    function setSafe(GnosisSafe _safe) external {
        require(msg.sender == address(safe), "ER1");
        safe = _safe;
        emit SafeChanged(_safe);
    }

    function setExternalAddress(address ext, bool allowed) external {
        if (allowed) {
            require(msg.sender == address(safe), "ER1");
        } else {
            require(msg.sender == address(safe) || safe.isOwner(msg.sender), "ER2");
        }

        isExternalAddressAllowed[ext] = allowed;
        emit ExternalAddressSet(ext, allowed);
    }
}
