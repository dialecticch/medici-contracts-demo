import { ethers, network } from "hardhat";
import { mine } from "@nomicfoundation/hardhat-network-helpers";

export const advanceBlockTime = async (interval: number) => {
  await mine(1, { interval: interval });
};

export async function mineBlocks(blocks: number): Promise<void> {
  await mine(blocks);
}

export async function getChainId(): Promise<number> {
  return parseInt(await ethers.provider.send("eth_chainId", ["latest", false]));
}

export async function getLatestBlockTimestamp(): Promise<number> {
  return parseInt((await getLatestBlock()).timestamp);
}

export async function getLatestBlock(): Promise<any> {
  return await ethers.provider.send("eth_getBlockByNumber", ["latest", false]);
}

export const increaseBlockTime = async (seconds: number): Promise<void> => {
  const block = await ethers.provider.send("eth_getBlockByNumber", [
    "latest",
    false,
  ]);
  const currentTs = parseInt(block.timestamp);
  const timeInFuture = seconds + currentTs;

  await ethers.provider.send("evm_setNextBlockTimestamp", [timeInFuture]);
  await mine();
};

export const impersonate = async (account: string): Promise<any> => {
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [account],
  });

  return ethers.provider.getSigner(account);
};

export const bless = async (account: string) => {
  await network.provider.request({
    method: "hardhat_setBalance",
    params: [account, ethers.utils.parseEther("10.0").toHexString()],
  });
};
