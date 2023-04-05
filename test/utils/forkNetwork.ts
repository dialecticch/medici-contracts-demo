import { network } from "hardhat";
const hre = require("hardhat");

export const forkNetwork = async (
  name: string,
  block: number = 0
): Promise<any> => {
  let fork = hre.config.networks[name];
  return await network.provider.request({
    method: "hardhat_reset",
    params: [
      {
        forking: {
          jsonRpcUrl: fork.url,
          blockNumber: block,
        },
      },
    ],
  });
};
