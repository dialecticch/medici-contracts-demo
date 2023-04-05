import "@nomicfoundation/hardhat-chai-matchers";

import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { forkNetwork } from "../utils/forkNetwork";
import { Contract } from "@ethersproject/contracts";
import { fundSafeFromWhale } from "../shared/deposit";
import { setupSafe } from "../../scripts/helpers/safe";
import { enableModule } from "../../scripts/helpers/safe";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

describe("Swapper", async () => {
  let operator: SignerWithAddress;

  before(async () => {
    [operator] = await ethers.getSigners();
  });

  describe("OneInch", async () => {
    let safe: Contract;
    let swapper: Contract;
    let usdcErc20: Contract;
    let sushiErc20: Contract;

    const sushiWhale = "0xf977814e90da44bfa03b6295a0616a897441acec";

    const ZERO_BN = BigNumber.from(0);
    const TEN_POW_EIGHTEEN = BigNumber.from(10).pow(18);
    const HUNDRED_BN = BigNumber.from(100).mul(TEN_POW_EIGHTEEN);
    const SUSHI_ADDRESS = "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2";
    const USDC_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
    const ONE_INCH_ROUTER = "0x1111111254fb6c44bac0bed2854e76f90643097d";

    const network = "ethereum";
    const forkBlockNumber = 15141129;
    const swapData = {
      router: ONE_INCH_ROUTER,
      spender: ONE_INCH_ROUTER,
      input: SUSHI_ADDRESS,
      amountIn: HUNDRED_BN,
      output: USDC_ADDRESS,
      amountOut: 122862793,
      data: "0x2e95b6c80000000000000000000000006b3595068778dd592e39a122f4f5a5cf09c90fe20000000000000000000000000000000000000000000000056bc75e2d631000000000000000000000000000000000000000000000000000000000000007495d1f0000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000200000000000000003b6d0340ce84867c3c02b05dc570d0135103d3fb9cc1943380000000000000003b6d0340397ff1542f962076d0bfe58ea045ffa2d347aca0cfee7c08",
    };

    before(async () => {
      await forkNetwork(network, forkBlockNumber);
      safe = await setupSafe(operator);
      swapper = await (await ethers.getContractFactory("SwapperMock")).deploy();

      await enableModule(safe, operator, swapper.address);

      usdcErc20 = await ethers.getContractAt("ERC20", USDC_ADDRESS);
      sushiErc20 = await ethers.getContractAt("ERC20", SUSHI_ADDRESS);
    });

    it("Should execute swap from CVX to USDC", async () => {
      // fund the safe with needed CVX
      let amount = await fundSafeFromWhale(safe, sushiWhale, SUSHI_ADDRESS);

      let cvxBalanceBefore = await sushiErc20.balanceOf(safe.address);
      let usdcBalanceBefore = await usdcErc20.balanceOf(safe.address);

      expect(cvxBalanceBefore).to.be.eq(amount);
      expect(usdcBalanceBefore).to.be.eq(ZERO_BN);

      await expect(
        await swapper.execute(safe.address, [
          swapData.router,
          swapData.spender,
          swapData.input,
          swapData.amountIn,
          swapData.output,
          swapData.amountOut,
          swapData.data,
        ])
      ).to.be.not.reverted;

      let cvxBalanceAfter = await sushiErc20.balanceOf(safe.address);
      let usdcBalanceAfter = await usdcErc20.balanceOf(safe.address);

      expect(cvxBalanceAfter).to.be.eq(amount.sub(HUNDRED_BN));
      expect(usdcBalanceAfter).to.be.gte(swapData.amountOut);
    });
  });
});
