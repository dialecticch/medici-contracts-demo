import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GnosisSafe, Module } from "../typechain";

const DEPOSIT_SELECTOR = "0x1423feba";
const WITHDRAW_SELECTOR = "0xdcbd7a53";
const HARVEST_SELECTOR = "0xf023a693";
const SIMULATE_CLAIM_SELECTOR = "0xbdcceb0f";

task("list-modules", "Shows the list of modules approved by a safe")
  .addParam("safe", "The address of the GnosisSafe to list modules for")
  .setAction(async (taskArgs, env) => {
    let gnosisSafe = (await env.ethers.getContractAt(
      "GnosisSafe",
      taskArgs.safe
    )) as GnosisSafe;

    const PAGE_SIZE = 10;
    const SENTINEL_MODULE = "0x0000000000000000000000000000000000000001";

    let modules;
    let nextModule = SENTINEL_MODULE;
    while (true) {
      let res = await gnosisSafe.getModulesPaginated(nextModule, PAGE_SIZE);

      modules = res.array;
      nextModule = res.next;

      for (const m of modules) {
        const moduleInstance = await env.ethers.getContractAt("Module", m);
        await printModule(env, moduleInstance);
      }

      if (nextModule == SENTINEL_MODULE) break;
    }
  });

const printModule = async (env: HardhatRuntimeEnvironment, mod: Module) => {
  let isStrategy: boolean;

  try {
    let strategy = await env.ethers.getContractAt(
      "AbstractStrategy",
      mod.address
    );

    let supportsDeposit = await strategy.supportsInterface(DEPOSIT_SELECTOR);
    let supportsWithdraw = await strategy.supportsInterface(WITHDRAW_SELECTOR);
    let supportsHarvest = await strategy.supportsInterface(HARVEST_SELECTOR);
    let supportsSimulateClaim = await strategy.supportsInterface(
      SIMULATE_CLAIM_SELECTOR
    );

    isStrategy =
      supportsDeposit &&
      supportsWithdraw &&
      supportsHarvest &&
      supportsSimulateClaim;
  } catch (error) {
    isStrategy = false;
  }

  let name = await mod.NAME();
  let version = await mod.VERSION();
  let address = mod.address;

  console.log("module name: ", name);
  console.log("module version: ", version);
  console.log("module address: ", address);
  console.log("the module is a strategy: ", isStrategy);
  console.log("\n");
};

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
};
