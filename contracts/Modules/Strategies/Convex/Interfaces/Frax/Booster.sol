// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

interface Booster {
    function createVault(uint256) external;

    function poolRegistry() external view returns (address);

    function rewardManager() external view returns (address);

    function fxs() external view returns (address);
}
