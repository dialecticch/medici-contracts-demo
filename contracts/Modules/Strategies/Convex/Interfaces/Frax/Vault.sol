// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

interface Vault {
    function getReward() external;

    function getReward(bool _claim) external;

    function getReward(bool _claim, address[] calldata _rewardTokenList) external;

    function earned() external view returns (address[] memory token_addresses, uint256[] memory total_earned);

    function stakeLocked(uint256, uint256) external;

    function lockAdditional(bytes32, uint256) external;

    function withdrawLocked(bytes32) external;

    function stakingToken() external view returns (address);

    function stakingAddress() external view returns (address);
}
