// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

import "../../../../Interfaces/ERC20.sol";

interface VirtualBalanceRewardPool {
    function rewardToken() external view returns (ERC20);

    function earned(address) external view returns (uint256);
}
