// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

import "../Libraries/SwapHelper.sol";
import "../Interfaces/GnosisSafe.sol";
import "../Interfaces/Uniswap/Uniswap.sol";
import "../Modules/Strategies/AbstractStrategy.sol";

/// @dev This contract provides the optimal prices and swaps for a harvest, only for testing purposes.
contract ExchangeDataProvider {
    /// @dev Returns the best swaps for a harvest.
    /// @param harvests The expected harvests from the pool
    /// @param routers The exchanges to check.
    /// @return An array of swaps.
    function swaps(
        GnosisSafe safe,
        AbstractStrategy.Harvest[] memory harvests,
        Uniswap[] memory routers,
        address midToken,
        address outputToken
    ) external view returns (SwapHelper.SwapParams[] memory) {
        uint256 length = harvests.length;

        SwapHelper.SwapParams[] memory params = new SwapHelper.SwapParams[](length);

        address safeAddress = address(safe); // avoid stack too deep
        for (uint256 i = 0; i < length; i++) {
            AbstractStrategy.Harvest memory harvest = harvests[i];

            address[] memory shortPath = new address[](2);
            shortPath[0] = address(harvest.token);
            shortPath[1] = outputToken;

            address[] memory longPath = new address[](3);
            longPath[0] = address(harvest.token);
            longPath[1] = midToken;
            longPath[2] = outputToken;

            (Uniswap router, address[] memory path, uint256 amountOut) = dataForBestExchange(routers, shortPath, longPath, harvest.amount);

            params[i] = SwapHelper.SwapParams({
                router: address(router),
                spender: address(router),
                input: address(harvest.token),
                amountIn: harvest.amount,
                output: outputToken,
                amountOutMin: amountOut,
                data: abi.encodeWithSelector(
                    router.swapExactTokensForTokens.selector,
                    harvest.amount,
                    amountOut,
                    path,
                    safeAddress,
                    block.timestamp + 15 minutes // we assume a quote is valid for 15 minutes
                )
            });
        }

        return params;
    }

    /// @dev ABI encodes swap parameters.
    /// @param swapsParams The swaps to encode.
    /// @return A byte array of encoded swaps.
    function encode(SwapHelper.SwapParams[] memory swapsParams) external pure returns (bytes memory) {
        return abi.encode(swapsParams);
    }

    function amountOutFor(
        Uniswap exchange,
        address[] memory path,
        uint256 amountIn
    ) internal view returns (uint256) {
        try exchange.getAmountsOut(amountIn, path) returns (uint256[] memory amountsOut) {
            return amountsOut[amountsOut.length - 1];
        } catch {
            return 0;
        }
    }

    function amountInFor(
        Uniswap exchange,
        address[] memory path,
        uint256 amountIn
    ) internal view returns (uint256) {
        try exchange.getAmountsIn(amountIn, path) returns (uint256[] memory amountsIn) {
            return amountsIn[amountsIn.length - 1];
        } catch {
            return type(uint256).max;
        }
    }

    /// @dev Returns the best exchange and price for a specific swap.
    /// @param routers The exchanges to choose from.
    /// @param shortPath (inToken, outToken)
    /// @param longPath (inToken, midToken, outToken)
    /// @param amount The amount of tokens to sell.
    /// @return The exchange.
    /// @return The path.
    /// @return The amount expected.
    function dataForBestExchange(
        Uniswap[] memory routers,
        address[] memory shortPath,
        address[] memory longPath,
        uint256 amount
    )
        public
        view
        returns (
            Uniswap,
            address[] memory,
            uint256
        )
    {
        Uniswap bestExchange;
        uint256 bestAmount;

        bool isShortPath = true;

        uint256 length = routers.length;
        for (uint256 i = 0; i < length; i++) {
            uint256 out = amountOutFor(routers[i], shortPath, amount);
            if (out > bestAmount) {
                bestExchange = routers[i];
                bestAmount = out;
                isShortPath = true;
            }

            out = amountOutFor(routers[i], longPath, amount);
            if (out > bestAmount) {
                bestExchange = routers[i];
                bestAmount = out;
                isShortPath = false;
            }
        }

        require(bestAmount > 0, "no valid swaps");

        if (isShortPath) {
            return (bestExchange, shortPath, bestAmount);
        }

        return (bestExchange, longPath, bestAmount);
    }

    /// @dev Returns the best exchange and price for a specific swap.
    /// @param routers The exchanges to choose from.
    /// @param shortPath (inToken, outToken)
    /// @param longPath (inToken, midToken, outToken)
    /// @param amount The amount of tokens to sell.
    /// @return The exchange.
    /// @return The path.
    /// @return The amount expected.
    function dataForBestExchangeExactOut(
        Uniswap[] memory routers,
        address[] memory shortPath,
        address[] memory longPath,
        uint256 amount
    )
        internal
        view
        returns (
            Uniswap,
            address[] memory,
            uint256
        )
    {
        Uniswap bestExchange;
        uint256 bestAmount = type(uint256).max;

        bool isShortPath = true;

        uint256 length = routers.length;
        for (uint256 i = 0; i < length; i++) {
            uint256 into = amountInFor(routers[i], shortPath, amount);
            if (into < bestAmount) {
                bestExchange = routers[i];
                bestAmount = into;
                isShortPath = true;
            }

            into = amountInFor(routers[i], longPath, amount);
            if (into < bestAmount) {
                bestExchange = routers[i];
                bestAmount = into;
                isShortPath = false;
            }
        }
        require(bestAmount > 0, "no valid swaps");

        if (isShortPath) {
            return (bestExchange, shortPath, bestAmount);
        }

        return (bestExchange, longPath, bestAmount);
    }

    /// @dev Returns the best exchange and price for a specific swap.
    /// @param routers The exchanges to choose from.
    /// @param shortPath (inToken, outToken)
    /// @param longPath (inToken, midToken, outToken)
    /// @param amount The amount of tokens to sell.
    /// @param amountOut The amountOut expected.
    /// @return The Swap object.
    function dataForBestExchangeParams(
        GnosisSafe safe,
        Uniswap[] memory routers,
        address[] memory shortPath,
        address[] memory longPath,
        uint256 amount,
        uint256 amountOut
    ) public view returns (SwapHelper.SwapParams[] memory) {
        SwapHelper.SwapParams[] memory params = new SwapHelper.SwapParams[](1);

        (Uniswap router, address[] memory path, ) = dataForBestExchange(routers, shortPath, longPath, amount);

        params[0] = SwapHelper.SwapParams({
            router: address(router),
            spender: address(router),
            input: path[0],
            amountIn: amount,
            output: path[path.length - 1],
            amountOutMin: amountOut,
            data: abi.encodeWithSelector(
                router.swapExactTokensForTokens.selector,
                amount,
                amountOut,
                path,
                address(safe),
                block.timestamp + 15 minutes // we assume a quote is valid for 15 minutes
            )
        });

        return params;
    }

    /// @dev Returns the best exchange and price for a specific swap.
    /// @param routers The exchanges to choose from.
    /// @param shortPath (inToken, outToken)
    /// @param longPath (inToken, midToken, outToken)
    /// @param amount The amount of tokens to sell.
    /// @return The Swap object.
    function dataForBestExchangeParamsExactOut(
        GnosisSafe safe,
        Uniswap[] memory routers,
        address[] memory shortPath,
        address[] memory longPath,
        uint256 amount
    ) public view returns (SwapHelper.SwapParams[] memory) {
        SwapHelper.SwapParams[] memory params = new SwapHelper.SwapParams[](1);

        (Uniswap router, address[] memory path, uint256 inputAmount) = dataForBestExchangeExactOut(routers, shortPath, longPath, amount);

        params[0] = SwapHelper.SwapParams({
            router: address(router),
            spender: address(router),
            input: path[0],
            amountIn: inputAmount,
            output: path[path.length - 1],
            amountOutMin: amount,
            data: abi.encodeWithSelector(
                router.swapTokensForExactTokens.selector,
                inputAmount,
                amount,
                path,
                address(safe),
                block.timestamp + 15 minutes // we assume a quote is valid for 15 minutes
            )
        });

        return params;
    }
}
