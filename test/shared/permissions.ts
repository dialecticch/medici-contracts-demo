import { expect } from "chai";
import { ethers } from "hardhat";
import { Context } from "./context";

export function permissionsTest(context: Context) {
  describe("Permissions", async () => {
    it("should revert when not strategist calls withdraw", async () => {
      const [_, randomUser] = await ethers.getSigners();

      let strategy = context.strategy!.connect(randomUser);

      await expect(
        strategy.withdraw(0, context.safe!.address, 10, false, "0x")
      ).to.be.revertedWith("AC1");
    });

    it("should revert when not harvester calls harvest", async () => {
      const [_, randomUser] = await ethers.getSigners();

      let strategy = context.strategy!.connect(randomUser);

      await expect(
        strategy.harvest(0, context.safe!.address, "0x")
      ).to.be.revertedWith("AC1");
    });

    it("should revert when not strategist calls deposit", async () => {
      const [_, randomUser] = await ethers.getSigners();

      let strategy = context.strategy!.connect(randomUser);

      await expect(
        strategy.deposit(0, context.safe!.address, 10, "0x")
      ).to.be.revertedWith("AC1");
    });
  });
}
