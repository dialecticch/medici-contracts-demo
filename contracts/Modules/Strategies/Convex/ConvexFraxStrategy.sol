// SPDX-License-Identifier: Unlicensed
pragma solidity ^0.8.17;

import "../AbstractStrategy.sol";
import "../Mixins/WithdrawLockMixin.sol";
import "./Interfaces/UnifiedFarm.sol";
import "./Interfaces/Frax/Booster.sol";
import "./Interfaces/Frax/PoolRegistry.sol";
import "./Interfaces/Frax/Vault.sol";

contract ConvexFraxStrategy is AbstractStrategy, WithdrawLockMixin {
    using SafeHelper for GnosisSafe;

    Booster public immutable booster;

    ERC20 public immutable fxs;

    string public constant override VERSION = "3.0.0";
    string public constant override NAME = "Convex Frax Strategy Module";

    constructor(
        ExtRegistry _extRegistry,
        AuthRegistry _authRegistry,
        Booster _booster
    ) AbstractStrategy(_extRegistry, _authRegistry) {
        booster = _booster;
        fxs = ERC20(_booster.fxs());
    }

    function deposit(
        uint256 pool,
        GnosisSafe safe,
        uint256 amount,
        bytes calldata /* data */
    ) external override authorized(Roles.STRATEGIST) {
        Vault vault = getVault(pool, safe);

        safe.approve(depositToken(pool), address(vault), amount);

        UnifiedFarm farm = UnifiedFarm(vault.stakingAddress());
        UnifiedFarm.LockedStake[] memory stakes = farm.lockedStakesOf(address(vault));

        // This is because of the way frax works, if we already have a stake for simplicity we add more liquidity
        // rather than creating a new one. Should probably look at yield implications of this.

        bool deposited;
        if (stakes.length > 0) {
            for (uint256 i; i < stakes.length; i++) {
                if (stakes[i].liquidity == 0) {
                    continue;
                }

                safe.call(address(vault), abi.encodeWithSelector(vault.lockAdditional.selector, stakes[i].kek_id, amount), "S05");
                deposited = true;
            }
        }

        if (!deposited) {
            safe.call(address(vault), abi.encodeWithSelector(vault.stakeLocked.selector, amount, farm.lock_time_min()), "S05");
        }

        emit Deposited(pool, safe, amount);
    }

    function triggerWithdraw(
        uint256, /* pool */
        GnosisSafe, /* safe */
        uint256 /* amount */
    ) external pure override {
        // We do not need this, we just wait.
        revert("not implemented");
    }

    function isLocked(uint256 pool, GnosisSafe safe) external view override returns (bool) {
        return lockDuration(pool, safe) > 0;
    }

    function depositedAmount(uint256 pool, GnosisSafe safe) external view override returns (uint256) {
        Vault vault = Vault(PoolRegistry(booster.poolRegistry()).vaultMap(pool, address(safe)));
        if (address(vault) == address(0x0)) {
            return 0;
        }

        UnifiedFarm farm = UnifiedFarm(vault.stakingAddress());
        UnifiedFarm.LockedStake[] memory stakes = farm.lockedStakesOf(address(vault));
        if (stakes.length == 0) {
            return 0;
        }

        uint256 liquidity;
        for (uint256 i; i < stakes.length; i++) {
            liquidity += stakes[i].liquidity;
        }

        return liquidity;
    }

    function stakesFor(uint256 pool, GnosisSafe safe) external view returns (UnifiedFarm.LockedStake[] memory) {
        Vault vault = Vault(PoolRegistry(booster.poolRegistry()).vaultMap(pool, address(safe)));
        if (address(vault) == address(0x0)) {
            return new UnifiedFarm.LockedStake[](0);
        }

        UnifiedFarm farm = UnifiedFarm(vault.stakingAddress());
        return farm.lockedStakesOf(address(vault));
    }

    function depositToken(uint256 pool) public view override returns (ERC20) {
        return ERC20(PoolRegistry(booster.poolRegistry()).poolInfo(pool).stakingToken);
    }

    function lockDuration(uint256 pool, GnosisSafe safe) public view override returns (uint256) {
        Vault vault = Vault(PoolRegistry(booster.poolRegistry()).vaultMap(pool, address(safe)));
        if (address(vault) == address(0x0)) {
            return 0;
        }

        UnifiedFarm farm = UnifiedFarm(vault.stakingAddress());
        UnifiedFarm.LockedStake[] memory stakes = farm.lockedStakesOf(address(vault));

        if (stakes.length == 0) {
            return 0;
        }

        if (block.timestamp >= stakes[0].ending_timestamp) {
            return 0;
        }

        return stakes[0].ending_timestamp - block.timestamp;
    }

    function supportsInterface(bytes4 interfaceID) public view override(AbstractStrategy, WithdrawLockMixin) returns (bool) {
        return AbstractStrategy.supportsInterface(interfaceID) || WithdrawLockMixin.supportsInterface(interfaceID);
    }

    /// @inheritdoc AbstractStrategy
    /// @notice Because of the way ConvexFrax works we can only withdraw full stakes by their ID, which can be obtained
    ///         by calling `stakesFor(pool, safe)`
    function _withdraw(
        uint256 pool,
        GnosisSafe safe,
        uint256, /* amount */
        bytes memory data
    ) internal override {
        Vault vault = getVault(pool, safe);

        bytes32[] memory stakes = abi.decode(data, (bytes32[]));

        ERC20 token = depositToken(pool);

        uint256 previous = token.balanceOf(address(safe));
        for (uint256 i; i < stakes.length; i++) {
            safe.call(address(vault), abi.encodeWithSelector(vault.withdrawLocked.selector, stakes[i]), "S06");
        }

        emit Withdrew(pool, safe, token.balanceOf(address(safe)) - previous);
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

    function _simulateClaim(
        uint256 pool,
        GnosisSafe safe,
        bytes calldata /* _data */
    ) internal override returns (Harvest[] memory) {
        Vault vault = getVault(pool, safe);

        (address[] memory addresses, ) = vault.earned();
        uint256[] memory balancesBeforeHarvest = new uint256[](addresses.length);
        for (uint256 i = 0; i < addresses.length; i++) {
            balancesBeforeHarvest[i] = ERC20(addresses[i]).balanceOf(address(safe));
        }

        doHarvest(pool, safe);

        Harvest[] memory harvests = new Harvest[](addresses.length);
        for (uint256 i = 0; i < addresses.length; i++) {
            ERC20 token = ERC20(addresses[i]);
            harvests[i] = Harvest({token: token, amount: token.balanceOf(address(safe)) - balancesBeforeHarvest[i]});
        }

        return harvests;
    }

    function doHarvest(uint256 pool, GnosisSafe safe) internal {
        Vault vault = getVault(pool, safe);
        vault.getReward();
    }

    function getVault(uint256 pool, GnosisSafe safe) internal returns (Vault) {
        PoolRegistry registry = PoolRegistry(booster.poolRegistry());
        if (registry.vaultMap(pool, address(safe)) == address(0x0)) {
            safe.call(address(booster), abi.encodeWithSelector(booster.createVault.selector, pool), "CFS02");
        }

        return Vault(registry.vaultMap(pool, address(safe)));
    }
}
