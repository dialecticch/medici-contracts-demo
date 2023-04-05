// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

import "../Module.sol";
import "../../AuthContext.sol";
import "../../Libraries/Roles.sol";
import "../../Interfaces/ERC20.sol";
import "../../Interfaces/ERC165.sol";
import "../../Libraries/SafeHelper.sol";
import "../../Libraries/SwapHelper.sol";
import "../../Interfaces/GnosisSafe.sol";

/// @title AbstractStrategy
abstract contract AbstractStrategy is ERC165, Module, AuthContext {
    using SafeHelper for GnosisSafe;

    /// @notice Struct to describe harvest output.
    /// @param token The token the harvest will get.
    /// @param amount The amount of `token` the harvest will get.
    struct Harvest {
        ERC20 token;
        uint256 amount;
    }

    event Swapped(GnosisSafe indexed safe, address from, address to, uint256 amountFrom, uint256 amountTo);
    event Harvested(uint256 pool, GnosisSafe indexed safe, address indexed token, uint256 amount);
    event Deposited(uint256 pool, GnosisSafe indexed safe, uint256 amount);
    event Withdrew(uint256 pool, GnosisSafe indexed safe, uint256 amount);

    /// @notice Init the strategy
    /// @param _extRegistry ExtRegistry address.
    /// @param _authRegistry AuthRegistry address.
    constructor(ExtRegistry _extRegistry, AuthRegistry _authRegistry) AuthContext(_extRegistry, _authRegistry) {}

    /// @notice Harvest the given pool. This method will only withdraw rewards and sell.
    /// @dev Use `compound` if compounding is necessary.
    /// @param pool The pool to harvest.
    /// @param safe The GnosisSafe harvesting rewards.
    /// @param data Additional data.
    function harvest(
        uint256 pool,
        GnosisSafe safe,
        bytes calldata data
    ) external virtual authorized(Roles.HARVESTER) {
        _harvest(pool, safe, data);
    }

    /// @notice Withdraw funds from the given pool.
    /// @dev `safe` will receive pending rewards.
    /// @param pool The pool to withdraw from.
    /// @param safe The GnosisSafe withdrawing funds.
    /// @param amount The amount to withdraw.
    /// @param harvest Whether or not to also harvest pending rewards.
    /// @param data Additional data.
    function withdraw(
        uint256 pool,
        GnosisSafe safe,
        uint256 amount,
        bool harvest,
        bytes calldata data
    ) external virtual authorized(Roles.STRATEGIST) {
        (bytes memory harvestData, bytes memory withdrawData) = getHarvestAndWithdrawData(data);

        if (harvest) {
            _harvest(pool, safe, harvestData);
        }

        _withdraw(pool, safe, amount, withdrawData);
        emit Withdrew(pool, safe, amount);
    }

    /// @notice Deposit for the given pid.
    /// @dev The method will derive PoolHelper from pid.
    /// @param pool The pool id.
    /// @param safe The GnosisSafe that will deposit.
    /// @param amount The amount of underlying token to deposit.
    /// @param data Additional data.
    function deposit(
        uint256 pool,
        GnosisSafe safe,
        uint256 amount,
        bytes calldata data
    ) external virtual;

    /// @notice View function returning amount of rewards that can be harvested by a given GnosisSafe for a given pool id.
    /// @param pool The pool id.
    /// @param safe The GnosisSafe to check.
    /// @return A list of Harvest.
    function simulateClaim(
        uint256 pool,
        GnosisSafe safe,
        bytes calldata data
    ) external returns (Harvest[] memory) {
        require(msg.sender == address(0x0)); // ensure this function cannot be executed. Only `eth_call`ed
        return _simulateClaim(pool, safe, data);
    }

    /// @notice View function returning amount of funds deposited for a GnosisSafe given the pool id.
    /// @param pool The pool id.
    /// @param safe The GnosisSafe to check.
    /// @return Amount of underlying deposited.
    function depositedAmount(uint256 pool, GnosisSafe safe) external view virtual returns (uint256);

    /// @notice View function returning an identifier for a given pool id.
    /// @param pool The pool id
    /// @return A string identifier.
    function poolName(uint256 pool) external view virtual returns (string memory) {
        return depositToken(pool).name();
    }

    /// @inheritdoc ERC165
    function supportsInterface(bytes4 interfaceID) public view virtual override returns (bool) {
        return
            interfaceID == this.supportsInterface.selector ||
            interfaceID == this.harvest.selector ||
            interfaceID == this.deposit.selector ||
            interfaceID == this.withdraw.selector ||
            interfaceID == this.simulateClaim.selector;
    }

    /// @notice View function returning deposit token given the pid.
    /// @param pool The pool id.
    /// @return Underlying address.
    function depositToken(uint256 pool) public view virtual returns (ERC20);

    /// @dev Execute a swap through a 3rd party aggregator.
    /// @param params A `SwapParams` struct containing swap parameters.
    /// @return amountOut The amount gained for the output token.
    function swap(GnosisSafe safe, SwapHelper.SwapParams memory params) internal returns (uint256) {
        require(extRegistry.isExternalAddressAllowed(params.router), "S03");
        require(extRegistry.isExternalAddressAllowed(params.spender), "S04");

        uint256 outputAmount = SwapHelper.swap(safe, params);

        emit Swapped(safe, params.input, params.output, params.amountIn, outputAmount);

        return outputAmount;
    }

    /// @dev Execute a list of swaps through a 3rd party aggregator.
    /// @param params A list of `SwapParams` structs containing swap parameters.
    /// @return amountOut The amount gained for the output token.
    function executeSwaps(GnosisSafe safe, SwapHelper.SwapParams[] memory params) internal returns (uint256) {
        uint256 swapped;
        uint256 amountOut;
        uint256 paramsLength = params.length;
        for (uint256 i; i < paramsLength; ) {
            require(extRegistry.isExternalAddressAllowed(params[i].router), "S03");
            require(extRegistry.isExternalAddressAllowed(params[i].spender), "S04");

            amountOut += (swapped = SwapHelper.swap(safe, params[i]));

            emit Swapped(safe, params[i].input, params[i].output, params[i].amountIn, swapped);

            unchecked {
                ++i;
            }
        }

        return amountOut;
    }

    function getHarvestAndWithdrawData(bytes calldata data) internal pure returns (bytes memory, bytes memory) {
        bytes memory harvestData;
        bytes memory withdrawData;

        if (data.length != 0) {
            (harvestData, withdrawData) = abi.decode(data, (bytes, bytes));
        }

        return (harvestData, withdrawData);
    }

    function _simulateClaim(
        uint256 pool,
        GnosisSafe safe,
        bytes calldata data
    ) internal virtual returns (Harvest[] memory);

    function _harvest(
        uint256 pool,
        GnosisSafe safe,
        bytes memory data
    ) internal virtual;

    function _withdraw(
        uint256 pool,
        GnosisSafe safe,
        uint256 amount,
        bytes memory data
    ) internal virtual;
}
