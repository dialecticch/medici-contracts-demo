// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

import "../../../../Interfaces/ERC20.sol";

interface ConvexToken is ERC20 {
    function reductionPerCliff() external view returns (uint256);

    function totalCliffs() external view returns (uint256);

    function maxSupply() external view returns (uint256);
}
