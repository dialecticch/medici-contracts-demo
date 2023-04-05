// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

interface Bridge {
    function sendToL2(
        uint256 chainId,
        address recipient,
        uint256 amount,
        uint256 amountOutMin,
        uint256 deadline,
        address relayer,
        uint256 relayerFee
    ) external;

    function swapAndSend(
        uint256 chainId,
        address recipient,
        uint256 amount,
        uint256 bonderFee,
        uint256 amountOutMin,
        uint256 deadline,
        uint256 destinationAmountOutMin,
        uint256 destinationDeadline
    ) external;

    function crossDomainMessengerWrappers(uint256 chainId) external view returns (address);
}
