// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

import "./ExtRegistry.sol";
import "./AuthRegistry.sol";

/// @title AuthContext
/// @dev Inherit from this contract to have access to global registries.
abstract contract AuthContext {
    /// @notice External addresses registry.
    ExtRegistry public immutable extRegistry;

    /// @notice Roles registry.
    AuthRegistry public immutable authRegistry;

    modifier authorized(uint8 role) {
        require(authRegistry.hasRole(msg.sender, role), "AC1");
        _;
    }

    constructor(ExtRegistry _extRegistry, AuthRegistry _authRegistry) {
        extRegistry = _extRegistry;
        authRegistry = _authRegistry;
    }
}
