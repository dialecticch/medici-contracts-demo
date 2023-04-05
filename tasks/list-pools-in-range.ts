import { task, types } from "hardhat/config";
import { AbstractStrategy } from "../typechain";

task("list-pools-in-range", "Returns info on all the pools in a given range")
  .addParam("strategy", "The strategy address")
  .addParam("start", "Start of the range", 0, types.int)
  .addParam("end", "End of the range", 0, types.int)
  .setAction(async (taskArgs, env) => {
    let strategy = (await env.ethers.getContractAt(
      "AbstractStrategy",
      taskArgs.strategy
    )) as AbstractStrategy;

    console.log(
      `Listing pools for ${await strategy.NAME()} (${await strategy.VERSION()})`
    );

    for (let i = taskArgs.start; i < taskArgs.end; i++) {
      console.log(`${i} - ${await strategy.poolName(i)}`);
    }
  });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
};
