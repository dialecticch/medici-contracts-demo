// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

interface GnosisSafe {
    enum Operation {
        Call,
        DelegateCall
    }

    function execTransactionFromModule(
        address to,
        uint256 value,
        bytes memory data,
        Operation operation
    ) external returns (bool);

    function execTransactionFromModuleReturnData(
        address to,
        uint256 value,
        bytes memory data,
        Operation operation
    ) external returns (bool, bytes memory);

    function isOwner(address owner) external view returns (bool);

    function getOwners() external view returns (address[] memory);

    function isModuleEnabled(address) external view returns (bool);

    function getModulesPaginated(address start, uint256 pageSize) external view returns (address[] memory array, address next);
}
