// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

import "../AbstractStrategy.sol";
import "./Interfaces/CToken.sol";
import "./Interfaces/Comptroller.sol";
import "./Interfaces/IERC3156FlashLender.sol";
import "./Interfaces/IERC3156FlashBorrower.sol";

/// @title Compound Leverage Flash DAI Strategy
/// @notice This strategy opens a leveraged position on Compound through flash mints (https://mips.makerdao.com/mips/details/MIP25).
/// @notice The DssFlash module has no fees at the moment of writing of this strategy.
contract CompoundLeverageFlashDAIStrategy is AbstractStrategy, IERC3156FlashBorrower {
    using SafeHelper for GnosisSafe;

    string public constant override VERSION = "2.0.0";
    string public constant override NAME = "CompoundLeverageFlash DAI Strategy";

    bytes32 public constant CALLBACK_SUCCESS = keccak256("ERC3156FlashBorrower.onFlashLoan");

    ERC20 public immutable dai;
    ERC20 public immutable comp;
    CToken public immutable ctoken;
    Comptroller public immutable comptroller;
    IERC3156FlashLender public immutable dssFlash;

    /// @notice Collateral ratio target.
    uint256 public collateralTarget;

    /// @notice This indicates if we want to use flash loan or not.
    bool public useFlashMint;

    constructor(
        ExtRegistry _extRegistry,
        AuthRegistry _authRegistry,
        address _comp,
        address _ctoken,
        address _comptroller,
        address _dssFlash,
        uint256 _collateralTarget,
        bool _useFlashMint
    ) AbstractStrategy(_extRegistry, _authRegistry) {
        comp = ERC20(_comp);
        ctoken = CToken(_ctoken);
        dai = ERC20(CToken(_ctoken).underlying());
        comptroller = Comptroller(_comptroller);
        dssFlash = IERC3156FlashLender(_dssFlash);

        collateralTarget = _collateralTarget;
        useFlashMint = _useFlashMint;

        address[] memory markets = new address[](1);
        markets[0] = address(_ctoken);
        Comptroller(_comptroller).enterMarkets(markets);
    }

    struct DepositState {
        uint256 initialBalance;
        uint256 adjustment;
        uint256 balanceBeforeBorrow;
    }

    /// @inheritdoc AbstractStrategy
    function deposit(
        uint256, /* pool */
        GnosisSafe safe,
        uint256 amount,
        bytes calldata /* data */
    ) external override authorized(Roles.STRATEGIST) {
        (uint256 borrowAmount, bool decrease) = computePosition(safe, amount, true);

        require(!decrease, "CL001");

        safe.approve(dai, address(ctoken), type(uint256).max);

        if (!useFlashMint) {
            DepositState memory depositState;

            uint256 i = 0;
            while (borrowAmount > 0) {
                depositState.adjustment = adjustPosition(safe, amount, borrowAmount, false);
                depositState.balanceBeforeBorrow = dai.balanceOf(address(safe));

                _compCallAndCheck(safe, abi.encodeWithSelector(CToken.borrow.selector, depositState.adjustment), "S05", 0);

                uint256 balDiff = dai.balanceOf(address(safe)) - depositState.balanceBeforeBorrow;

                _compCallAndCheck(safe, abi.encodeWithSelector(CToken.mint.selector, balDiff), "S05", 0);

                borrowAmount -= depositState.adjustment;

                unchecked {
                    if (++i >= 7) {
                        break;
                    }
                }
            }
        } else {
            require(borrowAmount <= dssFlash.maxFlashLoan(address(dai)), "CL002");
            doFlashMint(safe, borrowAmount, amount, decrease);
        }

        safe.approve(dai, address(ctoken), 0);

        emit Deposited(0, safe, amount);
    }

    function onFlashLoan(
        address initiator,
        address, /* token */
        uint256 amount,
        uint256, /* fee */
        bytes calldata data
    ) external override returns (bytes32) {
        require(msg.sender == address(dssFlash));
        require(initiator == address(this));

        (GnosisSafe safe, uint256 safeBalance, bool deficit) = abi.decode(data, (GnosisSafe, uint256, bool));
        dai.transfer(address(safe), amount);

        if (deficit) {
            _compCallAndCheck(safe, abi.encodeWithSelector(CToken.repayBorrow.selector, amount), "S06", 0);
            _compCallAndCheck(safe, abi.encodeWithSelector(CToken.redeemUnderlying.selector, amount), "S06", 0);
        } else {
            // if increasing, increase the known safe balance by amount flashloaned
            safeBalance += amount;

            _compCallAndCheck(safe, abi.encodeWithSelector(CToken.mint.selector, safeBalance), "S05", 0);
            _compCallAndCheck(safe, abi.encodeWithSelector(CToken.borrow.selector, amount), "S05", 0);
        }

        safe.call(address(dai), abi.encodeWithSelector(ERC20.transfer.selector, address(this), amount), "CL005");

        return CALLBACK_SUCCESS;
    }

    /// @dev This lets the operator choose whether we should use flash mints or not.
    function setFlashMint(bool enabled) external authorized(Roles.OPERATOR) {
        useFlashMint = enabled;
    }

    /// @notice Sets the collateral target (borrow / lend) to target.
    /// @dev Only OPERATOR can call this method.
    function setCollateralTarget(uint256 _collateralTarget) external authorized(Roles.OPERATOR) {
        collateralTarget = _collateralTarget;
    }

    /// @inheritdoc AbstractStrategy
    function depositedAmount(
        uint256, /* pool */
        GnosisSafe safe
    ) external view override returns (uint256) {
        (uint256 deposits, uint256 borrows) = getStoredPosition(safe);
        return deposits - borrows;
    }

    /// @inheritdoc AbstractStrategy
    function poolName(
        uint256 /* pool */
    ) external view override returns (string memory) {
        return ctoken.symbol();
    }

    /// @inheritdoc AbstractStrategy
    function depositToken(uint256) public view override returns (ERC20) {
        return dai;
    }

    function _withdraw(
        uint256, /* pool */
        GnosisSafe safe,
        uint256 amount,
        bytes memory /* data */
    ) internal override {
        (uint256 borrowAmount, bool decrease) = computePosition(safe, amount, false);

        require(decrease, "CL003");

        safe.approve(dai, address(ctoken), type(uint256).max);

        if (!useFlashMint) {
            uint256 i = 0;
            while (borrowAmount > 0) {
                uint256 adjustment = adjustPosition(safe, 0, borrowAmount, true);

                if (adjustment <= 10) break;

                _compCallAndCheck(safe, abi.encodeWithSelector(CToken.redeemUnderlying.selector, adjustment), "S06", 0);
                _compCallAndCheck(safe, abi.encodeWithSelector(CToken.repayBorrow.selector, adjustment), "S06", 0);

                borrowAmount -= adjustment;

                unchecked {
                    if (++i >= 8) {
                        break;
                    }
                }
            }
        } else {
            require(borrowAmount <= dssFlash.maxFlashLoan(address(dai)), "CL004");
            doFlashMint(safe, borrowAmount, 0, decrease);
        }

        (uint256 leftDeposits, ) = getStoredPosition(safe);
        uint256 canWithdraw = (amount > leftDeposits) ? leftDeposits : amount;
        _compCallAndCheck(safe, abi.encodeWithSelector(CToken.redeemUnderlying.selector, canWithdraw), "S06", 0);

        safe.approve(dai, address(ctoken), 0);
    }

    function _harvest(
        uint256 pool,
        GnosisSafe safe,
        bytes memory data
    ) internal override {
        CToken[] memory markets = new CToken[](1);
        markets[0] = ctoken;
        comptroller.claimComp(address(safe), markets);

        SwapHelper.SwapParams[] memory swaps = abi.decode(data, (SwapHelper.SwapParams[]));
        uint256 balance = executeSwaps(safe, swaps);

        emit Harvested(pool, safe, swaps[swaps.length - 1].output, balance);
    }

    function doFlashMint(
        GnosisSafe safe,
        uint256 amount,
        uint256 safeBalance,
        bool decrease
    ) internal returns (uint256) {
        if (amount == 0) return 0;

        // check fee is still 0
        uint256 fee = dssFlash.flashFee(address(dai), amount);
        require(fee == 0, "CL006");

        // approve the dssflash to get his dai back
        dai.approve(address(dssFlash), type(uint256).max);

        // data to pass after flashloan
        bytes memory data = abi.encode(safe, safeBalance, decrease);
        dssFlash.flashLoan(this, address(dai), amount, data);

        // approve 0
        dai.approve(address(dssFlash), 0);

        return amount;
    }

    /// @notice Compute the target borrow amount given an amount to deposit/withdraw.
    /// @param safe The safe to compute for.
    /// @param amount The amount we want to deposit/withdraw.
    /// @param isDeposit Indicates if we want to deposit or withdraw.
    function computePosition(
        GnosisSafe safe,
        uint256 amount,
        bool isDeposit
    ) internal returns (uint256, bool) {
        (uint256 deposits, uint256 borrows) = getLivePosition(safe);

        uint256 unwound = deposits - borrows;

        // if we are doing a deposit then we want to have unwound + amount as the new lent
        // if we are doing a withdrawal then we want to check how much we're trying to withdraw:
        //      - if amount > unwound position then we want the desiredLent to be 0
        //      - else we want unwound - amount
        uint256 desiredLent = (isDeposit) ? unwound + amount : (amount > unwound) ? 0 : unwound - amount;

        // compute desiredBorrow as (lent * ct) / (1 - ct)
        uint256 desiredBorrow = (desiredLent * collateralTarget) / (uint256(1e18) - collateralTarget);

        unchecked {
            if (desiredBorrow > 1e5) desiredBorrow -= 1e5; // security measure to avoid going all the way up to the collateral target
        }

        return (desiredBorrow < borrows) ? (borrows - desiredBorrow, true) : (desiredBorrow - borrows, false);
    }

    /// @notice Compute the adjustment to the position needed.
    /// @param safe The safe to compute for.
    /// @param underlyingBalance The float underlying balance (needed just for the first deposit)
    /// @param limit The borrow amount limit.
    /// @param decrease Indicates wheter we should increase or decrease the borrow position.
    function adjustPosition(
        GnosisSafe safe,
        uint256 underlyingBalance,
        uint256 limit,
        bool decrease
    ) internal returns (uint256) {
        // we can use the stored values here as we touched the token before calling this
        (uint256 deposits, uint256 borrows) = getStoredPosition(safe);

        // if we want to decrease the borrow position and borrows == 0, nothing to do
        if (borrows == 0 && decrease) return 0;

        // if deposits are 0, we should deposit before everything, this is called on first deposit
        if (deposits == 0) {
            safe.call(address(ctoken), abi.encodeWithSelector(CToken.mint.selector, underlyingBalance), "S05");
            (deposits, borrows) = getStoredPosition(safe);
        }

        // get collateral factor mantissa and check that it is != 0 as a safety measure
        (, uint256 cfMantissa, ) = comptroller.markets(address(ctoken));
        require(cfMantissa != 0, "CL007");

        return (decrease) ? computeDeleverage(limit, deposits, borrows, cfMantissa) : computeLeverage(limit, deposits, borrows, cfMantissa);
    }

    function computeDeleverage(
        uint256 limit,
        uint256 deposits,
        uint256 borrowed,
        uint256 collatRatio
    ) internal view returns (uint256) {
        uint256 exchangeRateStored = ctoken.exchangeRateStored();
        uint256 theoreticalLent = (borrowed * 1e18) / collatRatio;
        uint256 deleveraged = deposits - theoreticalLent;

        // change the trivial deleveraged amount (actual deposits - (borrowed / cr)) on certain conditions:

        //  - if deleveraged >= ACTUAL borrowed amounts, take the max between the two
        deleveraged = (deleveraged > borrowed) ? borrowed : deleveraged;

        //  - if deleveraged >= given limit, take the max between the two
        deleveraged = (deleveraged > limit) ? limit : deleveraged;

        // rounding errors
        unchecked {
            deleveraged = (deleveraged * 1e18 >= exchangeRateStored && deleveraged > 10) ? deleveraged - 10 : deleveraged;
        }

        return deleveraged;
    }

    function computeLeverage(
        uint256 limit,
        uint256 deposits,
        uint256 borrowed,
        uint256 collatRatio
    ) internal pure returns (uint256) {
        uint256 theoreticalBorrow = (deposits * collatRatio) / 1e18;
        uint256 leveraged = theoreticalBorrow - borrowed;

        // take max between given limit and the computed leveraged amount
        leveraged = (leveraged > limit) ? limit : leveraged;

        // rounding errors
        unchecked {
            leveraged = (leveraged > 10) ? leveraged - 10 : leveraged;
        }

        return leveraged;
    }

    function getLivePosition(GnosisSafe safe) internal returns (uint256, uint256) {
        uint256 deposits = ctoken.balanceOfUnderlying(address(safe));
        uint256 borrows = ctoken.borrowBalanceStored(address(safe));

        return (deposits, borrows);
    }

    function getStoredPosition(GnosisSafe safe) internal view returns (uint256, uint256) {
        (, uint256 ctokenBalance, uint256 borrowBalance, uint256 exchangeRate) = ctoken.getAccountSnapshot(address(safe));

        uint256 deposits = (ctokenBalance * exchangeRate) / 1e18;
        uint256 borrows = borrowBalance;

        return (deposits, borrows);
    }

    function _simulateClaim(
        uint256, /* pool */
        GnosisSafe safe,
        bytes calldata /* data */
    ) internal override returns (Harvest[] memory) {
        uint256 balanceCompBefore = comp.balanceOf(address(safe));

        CToken[] memory markets = new CToken[](1);
        Harvest[] memory harvests = new Harvest[](1);

        markets[0] = ctoken;
        comptroller.claimComp(address(safe), markets);

        harvests[0] = Harvest({token: comp, amount: comp.balanceOf(address(safe)) - balanceCompBefore});

        return harvests;
    }

    function _compCallAndCheck(
        GnosisSafe safe,
        bytes memory data,
        string memory err,
        uint256 expected
    ) internal {
        bytes memory ret = safe.call(address(ctoken), data, err);
        uint256 retCode = abi.decode(ret, (uint256));
        require(retCode == expected, string(abi.encodePacked("CL008: ", err)));
    }
}
