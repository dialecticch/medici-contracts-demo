// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

interface PoolRegistry {
    struct PoolInfo {
        address implementation;
        address stakingAddress;
        address stakingToken;
        address rewardsAddress;
        uint8 active;
    }

    function poolInfo(uint256) external view returns (PoolInfo memory);

    function vaultMap(uint256, address) external view returns (address);
}
