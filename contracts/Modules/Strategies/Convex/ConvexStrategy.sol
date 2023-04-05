// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

import "../AbstractStrategy.sol";
import "./Interfaces/Booster.sol";
import "./Interfaces/RewardPool.sol";
import "./Interfaces/VirtualBalanceRewardPool.sol";
import "./Interfaces/CVXRewardPool.sol";
import "./Interfaces/ConvexToken.sol";

contract ConvexStrategy is AbstractStrategy {
    using SafeHelper for GnosisSafe;

    string public constant override VERSION = "3.0.0";
    string public constant override NAME = "Convex Strategy Module";

    // solhint-disable-next-line var-name-mixedcase
    ConvexToken public immutable CVX;

    CVXRewardPool public immutable cvxRewards;

    Booster public immutable booster;

    constructor(
        ExtRegistry _extRegistry,
        AuthRegistry _authRegistry,
        Booster _booster
    ) AbstractStrategy(_extRegistry, _authRegistry) {
        booster = _booster;
        cvxRewards = CVXRewardPool(_booster.stakerRewards());
        CVX = ConvexToken(_booster.minter());
    }

    function doHarvest(uint256 pool, GnosisSafe safe) internal {
        RewardPool rewards = RewardPool(booster.poolInfo(pool).crvRewards);

        rewards.getReward(address(safe), true);
        cvxRewards.getReward(address(safe), true, false);
    }

    function deposit(
        uint256 pool,
        GnosisSafe safe,
        uint256 amount,
        bytes calldata /* data */
    ) external override authorized(Roles.STRATEGIST) {
        safe.approve(depositToken(pool), address(booster), amount);

        safe.call(address(booster), abi.encodeWithSelector(booster.deposit.selector, pool, amount, true), "S05");

        emit Deposited(pool, safe, amount);
    }

    function depositedAmount(uint256 pool, GnosisSafe safe) external view override returns (uint256) {
        return RewardPool(booster.poolInfo(pool).crvRewards).balanceOf(address(safe));
    }

    function depositToken(uint256 pool) public view override returns (ERC20) {
        return ERC20(booster.poolInfo(pool).lptoken);
    }

    function _harvest(
        uint256 pool,
        GnosisSafe safe,
        bytes memory data
    ) internal override {
        doHarvest(pool, safe);
        SwapHelper.SwapParams[] memory swaps = abi.decode(data, (SwapHelper.SwapParams[]));

        uint256 balance = executeSwaps(safe, swaps);

        emit Harvested(pool, safe, swaps[swaps.length - 1].output, balance);
    }

    function _withdraw(
        uint256 pool,
        GnosisSafe safe,
        uint256 amount,
        bytes memory /* data */
    ) internal override {
        RewardPool rewards = RewardPool(booster.poolInfo(pool).crvRewards);

        safe.call(address(rewards), abi.encodeWithSelector(rewards.withdraw.selector, amount, true), "S06");
        safe.call(address(booster), abi.encodeWithSelector(booster.withdraw.selector, pool, amount), "S06");
    }

    function _simulateClaim(
        uint256 pool,
        GnosisSafe safe,
        bytes calldata /* _data */
    ) internal override returns (Harvest[] memory) {
        RewardPool rewards = RewardPool(booster.poolInfo(pool).crvRewards);
        uint256 length = rewards.extraRewardsLength();

        uint256[] memory balancesBeforeHarvest = new uint256[](length + 1);
        for (uint256 i = 0; i < length; i++) {
            VirtualBalanceRewardPool reward = VirtualBalanceRewardPool(rewards.extraRewards(i));
            balancesBeforeHarvest[i] = ERC20(reward.rewardToken()).balanceOf(address(safe));
        }
        balancesBeforeHarvest[length] = rewards.rewardToken().balanceOf(address(safe));

        doHarvest(pool, safe);

        Harvest[] memory harvests = new Harvest[](length + 1);
        for (uint256 i = 0; i < length; i++) {
            VirtualBalanceRewardPool reward = VirtualBalanceRewardPool(rewards.extraRewards(i));
            harvests[i] = Harvest({
                token: reward.rewardToken(),
                amount: reward.rewardToken().balanceOf(address(safe)) - balancesBeforeHarvest[i]
            });
        }
        harvests[length] = Harvest({
            token: rewards.rewardToken(),
            amount: rewards.rewardToken().balanceOf(address(safe)) - balancesBeforeHarvest[length]
        });

        return harvests;
    }
}
