// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

import "./../Interfaces/ERC20.sol";
import "./../Interfaces/GnosisSafe.sol";
import "./../Interfaces/Uniswap/Uniswap.sol";

library SafeHelper {
    function call(
        GnosisSafe safe,
        address to,
        bytes memory data,
        string memory reason
    ) internal returns (bytes memory) {
        return callWithValue(safe, to, 0, data, reason);
    }

    function callWithValue(
        GnosisSafe safe,
        address to,
        uint256 value,
        bytes memory data,
        string memory reason
    ) internal returns (bytes memory) {
        (bool success, bytes memory returnData) = safe.execTransactionFromModuleReturnData(to, value, data, GnosisSafe.Operation.Call);
        if (!success) {
            revertWithData(reason, returnData);
        }

        return data;
    }

    function approve(
        GnosisSafe safe,
        ERC20 token,
        address spender,
        uint256 amount
    ) internal {
        call(safe, address(token), abi.encodeWithSelector(token.approve.selector, spender, amount), "failed to approve");
    }

    /// @dev Reverts with the reason of an external call if provided.
    /// @param reason The reason we provided
    /// @param data The return data of our external call
    function revertWithData(string memory reason, bytes memory data) internal pure {
        if (data.length < 68) {
            revert(reason);
        }

        // solhint-disable-next-line no-inline-assembly
        assembly {
            data := add(data, 0x04)
        }

        revert(string(abi.encodePacked(reason, ": ", abi.decode(data, (string)))));
    }
}
