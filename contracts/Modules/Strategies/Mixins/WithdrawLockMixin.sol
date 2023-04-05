// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

import "../../../Interfaces/GnosisSafe.sol";

abstract contract WithdrawLockMixin {
    function triggerWithdraw(
        uint256 pool,
        GnosisSafe safe,
        uint256 amount
    ) external virtual;

    function lockDuration(uint256 pool, GnosisSafe safe) external view virtual returns (uint256);

    function isLocked(uint256 pool, GnosisSafe safe) external view virtual returns (bool);

    function supportsInterface(bytes4 interfaceID) public view virtual returns (bool) {
        return interfaceID == this.isLocked.selector;
    }
}
