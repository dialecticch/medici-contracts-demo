// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

import "../../../Interfaces/ERC20.sol";
import "../../../Interfaces/GnosisSafe.sol";
import "../../../Libraries/Perp/PerpHelper.sol";
import "../../../Interfaces/ERC165.sol";

abstract contract HedgedLpMixin is ERC165 {
    event RebalancedHedged(GnosisSafe indexed safe, address baseToken, uint256 amount, bool increasedShort);
    event ResetLp(GnosisSafe indexed safe, address baseToken, uint256 amount, int24 upperTick, int24 lowerTick);

    //
    // WRITES - CHECK PERMISSONS WHEN IMPLEMENTING !
    //

    // rebalances the position
    function rebalance(GnosisSafe safe, uint256 pool) external virtual returns (uint256);

    // adds a pool
    function addPool(
        GnosisSafe safe,
        uint256 pool,
        address baseToken
    ) external virtual;

    // closes the LP position and re-opens it at current price
    function resetLp(
        GnosisSafe safe,
        uint256 pool,
        bytes memory data
    ) external virtual;

    //
    // VIEWS
    //

    function getSpotPrice(uint256 pool) public view virtual returns (uint256);

    function getExpectedAmountsOut(GnosisSafe safe, uint256 pool) public view virtual returns (uint256, uint256);

    function getAccountValue(GnosisSafe safe) public view virtual returns (int256);

    function getPositionDelta(GnosisSafe safe, uint256 pool) external view virtual returns (int256);

    function getOpenShort(GnosisSafe safe, uint256 pool) public view virtual returns (uint256);

    function getPendingFunding(GnosisSafe safe, uint256 pool) public view virtual returns (int256);
}
