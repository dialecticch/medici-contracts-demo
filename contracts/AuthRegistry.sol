// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

import "./Interfaces/GnosisSafe.sol";

/// @title AuthRegistry
/// @notice This contract is responsible to track managers and roles.
/// @notice Other modules should query this contract to check permission before calling authorized method.
/// @notice An exhaustive list of roles can be found in the docs and in `Roles.sol`
contract AuthRegistry {
    event SafeChanged(GnosisSafe indexed newSafe);
    event UserRoleUpdated(address indexed user, uint8 indexed role, bool indexed enabled);

    /// @notice The safe this registry is bounded to.
    GnosisSafe internal safe;

    /// @notice Maps addresses to roles.
    mapping(address => bytes32) public userRoles;

    constructor(GnosisSafe _safe) {
        safe = _safe;
    }

    function setSafe(GnosisSafe _safe) external {
        require(msg.sender == address(safe), "AR1");
        safe = _safe;
        emit SafeChanged(_safe);
    }

    /// @notice Checks if the `user` has a `role`.
    /// @param user The user to check the `role` for.
    /// @param role The `role` to check.
    function hasRole(address user, uint8 role) external view returns (bool) {
        return (uint256(userRoles[user]) >> role) & 1 != 0;
    }

    /// @notice Sets a role for an address.
    /// @param user The user to modify the `role` for.
    /// @param role The role to set for the `user`.
    /// @param enabled Indicates if `role` has to be enabled or disabled for `user`.
    function setRole(
        address user,
        uint8 role,
        bool enabled
    ) external {
        if (enabled) {
            require(msg.sender == address(safe), "AR1");
            userRoles[user] |= bytes32(1 << role);
        } else {
            require(msg.sender == address(safe) || safe.isOwner(msg.sender) || user == msg.sender, "AR2");
            userRoles[user] &= ~bytes32(1 << role);
        }

        emit UserRoleUpdated(user, role, enabled);
    }
}
