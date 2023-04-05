// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

import "../../../Interfaces/ERC20.sol";
import "../../../Interfaces/GnosisSafe.sol";
import "../../../Libraries/Perp/PerpHelper.sol";
import "../../../Interfaces/ERC165.sol";

abstract contract HedgedSingleSide is ERC165 {
    event RebalancedHedged(GnosisSafe indexed safe, address baseToken, uint256 amount, bool isShort);

    function rebalance(
        GnosisSafe safe,
        uint256 pool,
        uint256 amount,
        bool increase,
        bytes calldata data
    ) external virtual returns (uint256, uint256);

    function addPool(
        GnosisSafe safe,
        uint256 pool,
        address baseToken
    ) external virtual;

    function getAccountValue(GnosisSafe safe) public view virtual returns (int256);

    function getOpenPosition(GnosisSafe safe, uint256 pool) public view virtual returns (int256);

    function getPendingFunding(GnosisSafe safe, uint256 pool) public view virtual returns (int256);
}
