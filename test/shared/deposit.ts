import { expect } from "chai";
import { ethers } from "hardhat";
import { bless, impersonate } from "../utils/ethers";
import { BigNumber, Contract } from "ethers";
import { Context } from "./context";

export function depositTest(context: Context) {
  describe("Depositing", async () => {
    it("should allow the safe to deposit", async () => {
      let amount = await fundSafeFromWhale(
        context.safe!,
        context.tokenWhale,
        context.depositToken
      );
      await checkDeposit(
        context.pool,
        context.safe!,
        context.strategy!,
        amount,
        context.depositFee,
        context.depositData
      );
    });
  });
}

export const checkDeposit = async (
  pool: number,
  safe: Contract,
  strategy: Contract,
  amount: BigNumber,
  fee: number,
  data?: any
) => {
  if (data === undefined) {
    data = "0x";
  }

  let token = await ethers.getContractAt(
    "ERC20",
    await strategy.depositToken(pool)
  );

  await expect(strategy.deposit(pool, safe.address, amount, data))
    .to.emit(strategy, "Deposited")
    .withArgs(pool, safe.address, amount)
    .and.to.changeTokenBalance(token, safe.address, amount.mul(-1));

  const delta = amount.mul(1000 - fee * 1000).div(1000);
  const upper = amount.add(delta);
  const lower = amount.sub(delta);

  await expect(
    await strategy.depositedAmount(pool, safe.address)
  ).to.be.approximately(lower, upper);
};

// impersonates the whale and transfers token to the safe
export const fundSafeFromWhale = async (
  safe: Contract,
  whale: string,
  token: string
): Promise<BigNumber> => {
  const signer = await impersonate(whale);
  await bless(whale);
  let erc20 = await ethers.getContractAt("ERC20", token, signer);

  let amount = await erc20.balanceOf(whale);

  await erc20.transfer(safe.address, amount);

  return amount;
};
