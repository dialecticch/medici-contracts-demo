// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

import "../../../../Interfaces/ERC20.sol";

interface CVXRewardPool {
    function earned(address) external view returns (uint256);

    function rewardToken() external view returns (ERC20);

    function extraRewards(uint256) external view returns (address);

    function extraRewardsLength() external view returns (uint256);

    function getReward(
        address,
        bool,
        bool
    ) external;
}
