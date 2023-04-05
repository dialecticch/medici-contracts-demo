// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

import "./AbstractBridge.sol";
import "./Interfaces/Hop/Bridge.sol";
import "../../Interfaces/GnosisSafe.sol";
import "../../Libraries/SafeHelper.sol";

contract BridgeBouncerHop is AbstractBridge {
    using SafeHelper for GnosisSafe;

    string public constant override VERSION = "0.1.0";
    string public constant override NAME = "Bridge Bouncer for Hop Protocol";

    struct HopL1L2Params {
        uint256 amount;
        uint256 destinationAmountOutMin;
        uint256 destinationDeadline;
    }

    struct HopL2L1Params {
        uint256 amount;
        uint256 bonderFee;
        uint256 amountOutMin;
        uint256 deadline;
        uint256 destinationAmountOutMin;
        uint256 destinationDeadline;
    }

    constructor(
        ExtRegistry _extRegistry,
        AuthRegistry _authRegistry,
        ERC20 _bridgeToken
    ) AbstractBridge(_extRegistry, _authRegistry, _bridgeToken) {}

    function bridge(
        GnosisSafe safe,
        address receiverAddress,
        uint256 destChainId,
        bool isTransferFromL1,
        bytes memory bridgeData
    ) external override authorized(Roles.BRIDGE_OPERATOR) onlyAllowedReceiver(safe, destChainId, receiverAddress) {
        address bridgeContract = allowedBridgeAddresses[destChainId];

        // L1 -> L2
        if (isTransferFromL1) {
            HopL1L2Params memory params = abi.decode(bridgeData, (HopL1L2Params));
            SafeHelper.approve(safe, bridgeToken, bridgeContract, params.amount);

            SafeHelper.call(
                safe,
                bridgeContract,
                abi.encodeWithSelector(
                    Bridge.sendToL2.selector,
                    destChainId,
                    receiverAddress,
                    params.amount,
                    params.destinationAmountOutMin,
                    params.destinationDeadline,
                    address(0), // not needed
                    0 // not needed
                ),
                "B02"
            );

            emit Bridged(safe, receiverAddress, params.amount, destChainId);

            // L2 -> L1 or L2 -> L2
        } else {
            HopL2L1Params memory params = abi.decode(bridgeData, (HopL2L1Params));

            SafeHelper.approve(safe, bridgeToken, bridgeContract, params.amount);

            SafeHelper.call(
                safe,
                bridgeContract,
                abi.encodeWithSelector(
                    Bridge.swapAndSend.selector,
                    destChainId,
                    receiverAddress,
                    params.amount,
                    params.bonderFee,
                    params.amountOutMin,
                    params.deadline,
                    params.destinationAmountOutMin,
                    params.destinationDeadline
                ),
                "B02"
            );

            emit Bridged(safe, receiverAddress, params.amount, destChainId);
        }
    }
}
