import { expect } from "chai";
import { ethers } from "hardhat";
import { setupSafe } from "../scripts/helpers/safe";
import { prepareStrategy } from "./utils/strategy";
import { permissionsTest } from "./shared/permissions";
import { fundSafeFromWhale } from "./shared/deposit";
import { forkNetwork } from "./utils/forkNetwork";
import { increaseBlockTime } from "./utils/ethers";
import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Context } from "./shared/context";
import { dataTest } from "./shared/data";
import { ConvexFraxStrategy } from "../typechain";
import { encodeWithdrawData } from "./utils/utils";

// STRATEGY DETAILS
const strategyModule = "ConvexFraxStrategy";

//STRATEGY SPECIFIC DATA
const Booster = "0x9ca3ec5f627ad5d92498fd1b006b35577760ba9a";

describe(strategyModule, async () => {
  let account: SignerWithAddress;

  let snapshotId: number;

  let context: Context = {
    strategy: undefined,
    safe: undefined,
    depositToken: "0xd4937682df3C8aEF4FE912A96A74121C0829E664",
    pool: 2,
    poolName: "Aave interest bearing FRAX",
    strategyName: "Convex Frax Strategy Module",
    tokenWhale: "0x74c0992f180a3b8205e4aa130e49bb9a2e1d3732",
    depositFee: 0,
    withdrawFee: 0,
  };

  before(async () => {
    await forkNetwork("ethereum", 14771865);
    [account] = await ethers.getSigners();
    context.safe = await setupSafe(account);
    expect(await context.safe!.getOwners()).to.be.deep.equal([account.address]);
  });

  beforeEach(async () => {
    snapshotId = await ethers.provider.send("evm_snapshot", []);

    context.strategy = await prepareStrategy(
      context.safe!,
      account,
      strategyModule,
      [],
      [
        {
          address: account.address,
          roles: [BigNumber.from(1), BigNumber.from(2), BigNumber.from(3)],
        },
      ],
      //STRATEGY PARAMS
      Booster
    );
  });

  afterEach(async () => [
    await ethers.provider.send("evm_revert", [snapshotId]),
  ]);

  permissionsTest(context);
  dataTest(context);

  describe("Depositing", async () => {
    it("should allow the safe to deposit", async () => {
      let amount = await fundSafeFromWhale(
        context.safe!,
        context.tokenWhale,
        context.depositToken
      );

      await context.strategy!.deposit(
        context.pool,
        context.safe!.address,
        amount.div(2),
        "0x"
      );
      await expect(
        await context.strategy!.depositedAmount(
          context.pool,
          context.safe!.address
        )
      ).to.be.eq(amount.div(2));

      await context.strategy!.deposit(
        context.pool,
        context.safe!.address,
        amount.div(2),
        "0x"
      );
      await expect(
        await context.strategy!.depositedAmount(
          context.pool,
          context.safe!.address
        )
      ).to.be.gte(amount);
    });

    it("should allow safe to redeposit when having fully withdrawn once", async () => {
      let amount = await fundSafeFromWhale(
        context.safe!,
        context.tokenWhale,
        context.depositToken
      );

      await context.strategy!.deposit(
        context.pool,
        context.safe!.address,
        amount,
        "0x"
      );
      await expect(
        await context.strategy!.depositedAmount(
          context.pool,
          context.safe!.address
        )
      ).to.be.eq(amount);

      let cooldown = await (
        context.strategy! as ConvexFraxStrategy
      ).lockDuration(context.pool, context.safe!.address);
      await increaseBlockTime(cooldown.toNumber());

      await expect(
        await (context.strategy! as ConvexFraxStrategy).isLocked(
          context.pool,
          context.safe!.address
        )
      ).to.be.false;

      let stakes = await (context.strategy! as ConvexFraxStrategy).stakesFor(
        context.pool,
        context.safe!.address
      );

      await expect(
        context.strategy!.withdraw(
          context.pool,
          context.safe!.address,
          amount,
          false,
          encodeWithdrawData(
            ["bytes32[]"],
            [
              stakes.map((v) => {
                return v.kek_id;
              }),
            ]
          )
        )
      )
        .to.emit(context.strategy, "Withdrew")
        .withArgs(
          context.pool,
          context.safe!.address,
          greaterThanOrEqual(amount)
        );

      await expect(
        await context.strategy!.depositedAmount(
          context.pool,
          context.safe!.address
        )
      ).to.be.eq(0);

      await context.strategy!.deposit(
        context.pool,
        context.safe!.address,
        amount,
        "0x"
      );
      await expect(
        await context.strategy!.depositedAmount(
          context.pool,
          context.safe!.address
        )
      ).to.be.eq(amount);
    });
  });

  describe("Withdrawing", async () => {
    it("should allow the safe to withdraw", async () => {
      let amount = await fundSafeFromWhale(
        context.safe!,
        context.tokenWhale,
        context.depositToken
      );

      await context.strategy!.deposit(
        context.pool,
        context.safe!.address,
        amount,
        "0x"
      );
      await expect(
        await context.strategy!.depositedAmount(
          context.pool,
          context.safe!.address
        )
      ).to.be.eq(amount);

      let cooldown = await (
        context.strategy! as ConvexFraxStrategy
      ).lockDuration(context.pool, context.safe!.address);
      await increaseBlockTime(cooldown.toNumber());

      await expect(
        await (context.strategy! as ConvexFraxStrategy).isLocked(
          context.pool,
          context.safe!.address
        )
      ).to.be.false;

      let stakes = await (context.strategy! as ConvexFraxStrategy).stakesFor(
        context.pool,
        context.safe!.address
      );

      await expect(
        context.strategy!.withdraw(
          context.pool,
          context.safe!.address,
          amount,
          false,
          encodeWithdrawData(
            ["bytes32[]"],
            [
              stakes.map((v) => {
                return v.kek_id;
              }),
            ]
          )
        )
      )
        .to.emit(context.strategy, "Withdrew")
        .withArgs(
          context.pool,
          context.safe!.address,
          greaterThanOrEqual(amount)
        );

      // balance may change due to yield accrual
      let balanceAfter = await context.strategy!.depositedAmount(
        context.pool,
        context.safe!.address
      );
      await expect(balanceAfter.sub(amount)).to.be.approximately(0, amount);

      let erc20 = await ethers.getContractAt(
        "ERC20",
        await context.strategy!.depositToken(context.pool)
      );

      expect(
        await erc20.balanceOf(context.safe!.address)
      ).to.be.greaterThanOrEqual(amount);
    });
  });

  function greaterThanOrEqual(x: BigNumber): (y: BigNumber) => boolean {
    return function (y): boolean {
      return y.gte(x);
    };
  }
});
