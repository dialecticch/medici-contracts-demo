import { expect } from "chai";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";
import { advanceBlockTime } from "../utils/ethers";
import { fundSafeFromWhale } from "./deposit";
import { Context } from "./context";

export function withdrawTest(context: Context) {
  describe("Withdrawing", async () => {
    it("should allow the safe to withdraw", async () => {
      let amount = await fundSafeFromWhale(
        context.safe!,
        context.tokenWhale,
        context.depositToken
      );
      await checkWithdraw(
        context.pool,
        context.safe!,
        context.strategy!,
        amount,
        context.withdrawFee,
        context.withdrawData,
        context.cooldownBlocks
      );
    });
  });
}

export const checkWithdraw = async (
  pool: number,
  safe: Contract,
  strategy: Contract,
  amount: BigNumber,
  fee: number,
  data?: string,
  cooldownBlocks?: number
) => {
  await expect(amount).to.not.be.eq(0);

  if (data === undefined) {
    data = "0x";
  }

  let balanceBefore = await strategy.depositedAmount(pool, safe.address);

  await strategy.deposit(pool, safe.address, amount, data);

  if (cooldownBlocks !== undefined) {
    await advanceBlockTime(cooldownBlocks);
  }

  await expect(strategy.withdraw(pool, safe.address, amount, false, data))
    .to.emit(strategy, "Withdrew")
    .withArgs(pool, safe.address, amount);

  // balance may change due to yield accrual
  let balanceAfter = await strategy.depositedAmount(pool, safe.address);
  await expect(balanceAfter.sub(balanceBefore)).to.be.approximately(
    0,
    amount.sub(amount.mul(1000 - fee * 1000).div(1000))
  );

  let erc20 = await ethers.getContractAt(
    "ERC20",
    await strategy.depositToken(pool)
  );
  expect(await erc20.balanceOf(safe.address)).to.be.greaterThanOrEqual(
    amount.mul(1000 - fee * 1000).div(1000)
  );
};
