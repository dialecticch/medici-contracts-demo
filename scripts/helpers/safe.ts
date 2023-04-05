import { Contract, Signer, BigNumber } from "ethers";
import {
  buildSafeTransaction,
  executeTx,
  safeApproveHash,
} from "@gnosis.pm/safe-contracts";
import { ethers } from "hardhat";
import { GnosisSafe } from "../../typechain";

const GnosisSafeAbi = require("@gnosis.pm/safe-contracts/build/artifacts/contracts/GnosisSafe.sol/GnosisSafe.json");
const GnosisSafeFactory = require("@gnosis.pm/safe-contracts/build/artifacts/contracts/proxies/GnosisSafeProxyFactory.sol/GnosisSafeProxyFactory.json");

const EnableModuleInterface = new ethers.utils.Interface([
  "function enableModule(address)",
]);

const ExtRegistryInterface = new ethers.utils.Interface([
  "function setExternalAddress(address , bool)",
]);

const AuthRegistryInterface = new ethers.utils.Interface([
  "function setRole(address , uint8 , bool)",
]);

const BridgeModuleInterface = new ethers.utils.Interface([
  "function allowBridgeContract(uint256 , address)",
  "function allowReceiverAddress(address, uint256 , address, bool)",
]);

const SetupInterface = new ethers.utils.Interface([
  "function setup(address[],uint256,address,bytes,address,address,uint256,address)",
]);

export const execute = async (
  safe: Contract,
  target: string,
  account: Signer,
  data: string
): Promise<any> => {
  const nonce = await safe.callStatic.nonce();
  const safeTx = buildSafeTransaction({ to: target, data, nonce });
  return executeTx(safe, safeTx, [
    await safeApproveHash(account, safe, safeTx, true),
  ]);
};

const BURN = "0x0000000000000000000000000000000000000000";
export const setupSafe = async (account: Signer): Promise<GnosisSafe> => {
  let factory: any = await (
    await ethers.getContractFactoryFromArtifact(GnosisSafeFactory)
  ).deploy();
  let singleton = await (
    await ethers.getContractFactoryFromArtifact(GnosisSafeAbi)
  ).deploy();

  let tx = await factory.createProxy(
    singleton.address,
    SetupInterface.encodeFunctionData("setup", [
      [await account.getAddress()],
      1,
      BURN,
      "0x",
      BURN,
      BURN,
      0,
      BURN,
    ])
  );

  const receipt = await tx.wait();

  return (await ethers.getContractAt(
    GnosisSafeAbi["abi"],
    receipt.events[1].args.proxy
  )) as unknown as GnosisSafe;
};

export const enableModule = async (
  safe: Contract,
  account: Signer,
  module: string
): Promise<any> => {
  return await execute(
    safe,
    safe.address,
    account,
    EnableModuleInterface.encodeFunctionData("enableModule", [module])
  );
};

export const setExternalAddress = async (
  safe: Contract,
  account: Signer,
  extRegistry: string,
  externalContract: string,
  enabled: boolean
): Promise<any> => {
  return await execute(
    safe,
    extRegistry,
    account,
    ExtRegistryInterface.encodeFunctionData("setExternalAddress", [
      externalContract,
      enabled,
    ])
  );
};

export const setRole = async (
  safe: Contract,
  account: Signer,
  authRegistry: string,
  address: string,
  permission: BigNumber,
  enable: boolean
): Promise<any> => {
  return await execute(
    safe,
    authRegistry,
    account,
    AuthRegistryInterface.encodeFunctionData("setRole", [
      address,
      permission,
      enable,
    ])
  );
};

export const setupBridge = async (
  safe: Contract,
  account: Signer,
  to: string,
  destinationChainId: number,
  bridgeContract: string,
  receiverAddress: string
): Promise<any> => {
  let tx = await execute(
    safe,
    to,
    account,
    BridgeModuleInterface.encodeFunctionData("allowBridgeContract", [
      destinationChainId,
      bridgeContract,
    ])
  );

  await tx.wait();

  await execute(
    safe,
    to,
    account,
    BridgeModuleInterface.encodeFunctionData("allowReceiverAddress", [
      safe.address,
      destinationChainId,
      receiverAddress,
      true,
    ])
  );
};
