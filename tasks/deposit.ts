import { task } from "hardhat/config";
import { AbstractStrategy, ERC20 } from "../typechain";

task("deposit", "Deposits into a strategy")
  .addParam("safe", "The safe address")
  .addParam("strategy", "The strategy address")
  .addParam("pool", "The pool id")
  .addParam("amount", "The amount to deposit")
  .addOptionalParam("data", "Additional data for deposit", "0x")
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

    let tx = await strategy.populateTransaction.deposit(
      taskArgs.pool,
      taskArgs.safe,
      amount,
      taskArgs.data
    );

    if (taskArgs.nosend) {
      console.log("To Deposit send\nData: ", tx.data, "\nTo: ", tx.to);
      return;
    }

    let [account] = await env.ethers.getSigners();

    console.log(
      "Depositing: ",
      taskArgs.amount,
      "\nFor Safe: ",
      taskArgs.safe,
      "\nInto Strategy: ",
      taskArgs.strategy
    );

    await (await account.sendTransaction(tx)).wait();

    console.log("Successfully deposited ", taskArgs.amount);
  });
