// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

interface Module {
    // solhint-disable-next-line func-name-mixedcase
    function NAME() external pure returns (string memory);

    // solhint-disable-next-line func-name-mixedcase
    function VERSION() external pure returns (string memory);
}
