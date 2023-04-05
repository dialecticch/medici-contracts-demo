import { task } from "hardhat/config";
import { AbstractStrategy } from "../typechain";

task("stats", "Returns all info about a strategy")
  .addParam("safe", "The safe address")
  .addParam("strategy", "The strategy address")
  .addParam("pool", "The pool id")
  .setAction(async (taskArgs, env) => {
    let signer = new env.ethers.VoidSigner(
      env.ethers.constants.AddressZero,
      env.ethers.provider
    );
    let strategy = (await env.ethers.getContractAt(
      "AbstractStrategy",
      taskArgs.strategy,
      signer
    )) as AbstractStrategy;

    console.log(
      `${await strategy.NAME()} - ${await strategy.poolName(
        taskArgs.pool
      )} (${await strategy.VERSION()})`
    );

    console.log(`Deposit Token: ${await strategy.depositToken(taskArgs.pool)}`);
    console.log(
      `Deposit Amount: ${await strategy.depositedAmount(
        taskArgs.pool,
        taskArgs.safe
      )}`
    );

    console.log(`\nHarvests:`);

    const harvests = await strategy.callStatic.simulateClaim(
      taskArgs.pool,
      taskArgs.safe,
      "0x"
    );

    harvests.forEach((harvest: AbstractStrategy.HarvestStruct) => {
      console.log(`${harvest.token} - ${harvest.amount.toString()}`);
    });
  });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
};
