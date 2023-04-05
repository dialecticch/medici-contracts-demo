// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

interface UnifiedFarm {
    struct LockedStake {
        bytes32 kek_id;
        uint256 start_timestamp;
        uint256 liquidity;
        uint256 ending_timestamp;
        uint256 lock_multiplier; // 6 decimals of precision. 1x = 1000000
    }

    // solhint-disable-next-line func-name-mixedcase
    function lock_time_min() external view returns (uint256);

    function lockedStakesOf(address) external view returns (LockedStake[] memory);
}
