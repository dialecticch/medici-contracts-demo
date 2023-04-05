// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

import "../../../Interfaces/GnosisSafe.sol";

/// @title CompoundableMixin
/// @notice Harvest and reinvest rewards.
/// @dev Inherit from this to implement compounding in a strategy.
abstract contract CompoundableMixin {
    /// @notice Compounds the current strategy. This method will withdraw rewards, sell them and redeposit the amount harvested.
    /// @dev Use `harvest` from if compounding is NOT necessary.
    /// @param pool The pool to harvest.
    /// @param safe The GnosisSafe harvesting rewards.
    /// @param data Additional data.
    function compound(
        uint256 pool,
        GnosisSafe safe,
        bytes calldata data
    ) external virtual;

    function supportsInterface(bytes4 interfaceID) public view virtual returns (bool) {
        return interfaceID == this.compound.selector;
    }
}
