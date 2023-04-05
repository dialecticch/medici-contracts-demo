// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

interface Booster {
    struct PoolInfo {
        address lptoken;
        address token;
        address gauge;
        address crvRewards;
        address stash;
        bool shutdown;
    }

    function withdraw(uint256, uint256) external returns (bool);

    function deposit(
        uint256,
        uint256,
        bool
    ) external returns (bool);

    function poolInfo(uint256) external view returns (PoolInfo memory);

    function stakerRewards() external view returns (address);

    function minter() external view returns (address);
}
