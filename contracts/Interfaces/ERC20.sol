// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

interface ERC20 {
    function approve(address, uint256) external returns (bool);

    function transferFrom(
        address,
        address,
        uint256
    ) external returns (bool);

    function transfer(address, uint256) external returns (bool);

    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function totalSupply() external view returns (uint256);

    function balanceOf(address) external view returns (uint256);

    function allowance(address, address) external view returns (uint256);

    function decimals() external view returns (uint8);
}
