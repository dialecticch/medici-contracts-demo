// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

import "../../../Interfaces/GnosisSafe.sol";

abstract contract CooldownMixin {
    function cooldown(GnosisSafe safe) external virtual;

    function cooldownDuration(GnosisSafe safe) external view virtual returns (uint256);

    function hasCooleddown(GnosisSafe safe) external view virtual returns (bool);

    function supportsInterface(bytes4 interfaceID) public view virtual returns (bool) {
        return interfaceID == this.cooldown.selector;
    }
}
