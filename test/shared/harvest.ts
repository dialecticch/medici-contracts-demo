import { Context } from "./context";
import { checkDeposit, fundSafeFromWhale } from "./deposit";
import { ethers } from "hardhat";
import { expect } from "chai";

export function harvestTest(
  context: Context,
  setup: (context: Context) => Promise<void>
) {
  describe("Harvest", async () => {
    it("harvesting should work", async () => {
      let dataProvider = await (
        await ethers.getContractFactory("ExchangeDataProvider")
      ).deploy();

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

      let voidSigner = new ethers.VoidSigner(
        ethers.constants.AddressZero,
        ethers.provider
      );

      let voidStrategy = context.strategy!.connect(voidSigner);

      await setup(context);

      const harvests = await voidStrategy.callStatic.simulateClaim(
        context.pool,
        context.safe!.address,
        "0x" // @TODO inject
      );

      const swaps = await dataProvider.swaps(
        context.safe!.address,
        harvests.filter((harvest) => {
          return harvest.amount.toString() !== "0";
        }),
        context.routers!,
        context.wrappedToken!,
        context.outputToken!
      );

      const encoded = await dataProvider.encode(swaps);

      let outputToken = await ethers.getContractAt(
        "ERC20",
        context.outputToken!
      );
      let balanceBefore = await outputToken.balanceOf(context.safe!.address);
      await context.strategy!.harvest(
        context.pool,
        context.safe!.address,
        encoded
      );
      let balanceAfter = await outputToken.balanceOf(context.safe!.address);

      expect(balanceAfter).to.be.gt(balanceBefore);
    });
  });
}
