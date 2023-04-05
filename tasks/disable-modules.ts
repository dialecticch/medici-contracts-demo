import { Address } from "hardhat-deploy/types";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { GnosisSafe } from "../typechain";
import { BatchFile } from "./types/transaction-batch";

const fs = require("fs");

const SENTINEL_MODULE = "0x0000000000000000000000000000000000000001";

task("disable-modules", "Shows the list of modules approved by a safe")
  .addParam("safe", "The address of the GnosisSafe to list modules for")
  .addParam("modules", "The addresses of modules to disable")
  .addParam("output", "The output file")
  .setAction(async (taskArgs, env) => {
    let modulesToRemove = taskArgs.modules
      .replace(/\s/g, "")
      .split(",")
      .map(env.ethers.utils.getAddress);

    let gnosisSafe = (await env.ethers.getContractAt(
      "GnosisSafe",
      taskArgs.safe
    )) as GnosisSafe;

    const PAGE_SIZE = 10;
    let modules: Address[] = [SENTINEL_MODULE];
    let nextModule = SENTINEL_MODULE;
    while (true) {
      let res = await gnosisSafe.getModulesPaginated(nextModule, PAGE_SIZE);

      modules = modules.concat(res.array);
      nextModule = res.next;

      if (nextModule == SENTINEL_MODULE) break;
    }
    modules.push(SENTINEL_MODULE);

    console.log(`modules: ${modules}`);

    let linkedList: Map<Address, { prev: Address; next: Address }> =
      buildLinkedList(modules);
    let actions: { prev: Address; mod: Address }[] = [];

    for (let m of modulesToRemove) {
      let { prev, next } = linkedList.get(m)!;

      linkedList.set(prev, { prev: linkedList.get(prev)!.prev, next: next });
      linkedList.delete(m);

      actions.push({ prev: prev, mod: m });
    }

    let batch = await createBatchFromActions(env, taskArgs.safe, actions);
    fs.writeFileSync(taskArgs.output, JSON.stringify(batch));

    console.log(`Batch wrote to ${taskArgs.output}`);
  });

const buildLinkedList = (
  modules: Address[]
): Map<Address, { prev: Address; next: Address }> => {
  let modulesLinkedList = new Map<Address, { prev: Address; next: Address }>();

  for (let i = 1; i < modules.length - 1; i++) {
    modulesLinkedList.set(modules[i], {
      prev: modules[i - 1],
      next: modules[i + 1],
    });
  }

  return modulesLinkedList;
};

const createBatchFromActions = async (
  env: HardhatRuntimeEnvironment,
  safe: string,
  actions: { prev: Address; mod: Address }[]
): Promise<BatchFile> => {
  let network = await env.ethers.provider.getNetwork();

  let batch: BatchFile = {
    version: "1.0",
    chainId: network.chainId.toString(),
    createdAt: Date.now(),
    meta: {
      name: "Clear unused modules",
      txBuilderVersion: "1.4.0",
      createdFromSafeAddress: safe,
      createdFromOwnerAddress: "",
      checksum: "",
    },
    transactions: [],
  };

  for (let { prev, mod } of actions) {
    batch.transactions.push({
      to: safe,
      value: "0",
      contractMethod: {
        inputs: [
          {
            internalType: "address",
            name: "prevModule",
            type: "address",
          },
          {
            internalType: "address",
            name: "module",
            type: "address",
          },
        ],
        name: "disableModule",
        payable: false,
      },
      contractInputsValues: {
        prevModule: prev,
        module: mod,
      },
    });
  }

  return batch;
};

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
};
