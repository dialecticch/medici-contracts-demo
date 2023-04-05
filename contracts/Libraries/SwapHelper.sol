// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

import "../Interfaces/ERC20.sol";
import "../Interfaces/GnosisSafe.sol";
import "../Libraries/SafeHelper.sol";

/// @title SwapHelper
/// @notice Implements swapping logic.
library SwapHelper {
    using SafeHelper for GnosisSafe;

    address public constant NATIVE_TOKEN = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    /// @notice Struct to handle swap parameters.
    /// @param router The swap router.
    /// @param spender The address to approve (same as `router` most of the times).
    /// @param input The input token.
    /// @param amountIn The amount of input token to sell.
    /// @param output The expected token.
    /// @param amountOutMin The expected amount out.
    /// @param data Additional data.
    struct SwapParams {
        address router;
        address spender;
        address input;
        uint256 amountIn;
        address output;
        uint256 amountOutMin;
        bytes data;
    }

    /// @notice Implements swapping logic with additional checks on the swap outcome.
    /// @param safe The safe that executes the swap.
    /// @param params The params needed to execute the swap.
    /// @return outputAmount The amount of `output` token.
    function swap(GnosisSafe safe, SwapParams memory params) internal returns (uint256) {
        uint256 balanceBefore = (params.output != NATIVE_TOKEN) ? ERC20(params.output).balanceOf(address(safe)) : address(safe).balance;

        if (params.input != NATIVE_TOKEN) {
            safe.approve(ERC20(params.input), params.spender, params.amountIn);
            safe.call(params.router, params.data, "SH01");
        } else {
            safe.callWithValue(params.router, params.amountIn, params.data, "SH01");
        }

        uint256 balanceDiff = (params.output != NATIVE_TOKEN)
            ? ERC20(params.output).balanceOf(address(safe)) - balanceBefore
            : address(safe).balance - balanceBefore;

        require(balanceDiff > 0 && balanceDiff >= params.amountOutMin, "SH02");

        return balanceDiff;
    }
}
