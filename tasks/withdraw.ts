import { task } from "hardhat/config";
import { AbstractStrategy, ERC20 } from "../typechain";
import { boolean } from "hardhat/internal/core/params/argumentTypes";

task("withdraw", "Withdraws from a strategy")
  .addParam("safe", "The safe address")
  .addParam("strategy", "The strategy address")
  .addParam("pool", "The pool id")
  .addParam("amount", "The amount to withdraw")
  .addParam("harvest", "Whether to harvest on withdraw", false, boolean)
  .addOptionalParam("data", "Additional data for withdrawing", "0x")
  .addOptionalParam(
    "nosend",
    "If true, the transaction will not be sent and the data will be output instead"
  )
  .setAction(async (taskArgs, env) => {
    let strategy = (await env.ethers.getContractAt(
      "AbstractStrategy",
      taskArgs.strategy
    )) as AbstractStrategy;

    if (taskArgs.nosend) {
      let signer = new env.ethers.VoidSigner(
        env.ethers.constants.AddressZero,
        env.ethers.provider
      );

      strategy = strategy.connect(signer);
    }

    let token = (await env.ethers.getContractAt(
      "ERC20",
      await strategy.depositToken(taskArgs.pool)
    )) as ERC20;

    let amount = env.ethers.utils.parseUnits(
      taskArgs.amount,
      await token.decimals()
    );

    let tx = await strategy.populateTransaction.withdraw(
      taskArgs.pool,
      taskArgs.safe,
      amount,
      taskArgs.harvest,
      taskArgs.data
    );

    if (taskArgs.nosend) {
      console.log("To withdraw send\nData: ", tx.data, "\nTo: ", tx.to);
      return;
    }

    let [account] = await env.ethers.getSigners();

    console.log(
      "Withdrawing: ",
      taskArgs.amount,
      "\nFor Safe: ",
      taskArgs.safe,
      "\nFrom Strategy: ",
      taskArgs.strategy
    );

    await (await account.sendTransaction(tx)).wait();

    console.log("Successfully withdrawn ", taskArgs.amount);
  });
