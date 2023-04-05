// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

/// @title DeltaExposureMixin
abstract contract DeltaExposureMixin {
    function getDeltas(address safe) public view virtual returns (address[] memory, int256[] memory);
}
