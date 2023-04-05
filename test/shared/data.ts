import { expect } from "chai";
import { Context } from "./context";

export function dataTest(context: Context) {
  describe("General Data", async () => {
    it("should return correct name", async () => {
      expect(await context.strategy!.NAME()).to.be.equal(context.strategyName);
    });

    it("should return correct deposit Token", async () => {
      if (context.depositToken == "") return;

      expect(await context.strategy!.depositToken(context.pool)).to.be.equal(
        context.depositToken
      );
    });

    it("should return correct pool name", async () => {
      expect(await context.strategy!.poolName(context.pool)).to.be.equal(
        context.poolName
      );
    });

    it("should have correct modules", async () => {
      expect(await context.safe!.isModuleEnabled(context.strategy!.address)).to
        .be.true;
    });
  });
}
