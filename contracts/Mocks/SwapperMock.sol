// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

import "../Modules/Module.sol";
import "../Libraries/SwapHelper.sol";

contract SwapperMock is Module {
    string public constant override VERSION = "0.1";
    string public constant override NAME = "SwapperModule";

    function execute(GnosisSafe safe, SwapHelper.SwapParams memory params) external returns (uint256) {
        return SwapHelper.swap(safe, params);
    }
}
