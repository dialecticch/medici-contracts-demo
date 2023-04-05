import { Contract, Signer, BigNumber } from "ethers";
import { ethers } from "hardhat";
import {
  setExternalAddress,
  setRole,
  enableModule,
} from "../../scripts/helpers/safe";
import { AbstractBridge, AbstractStrategy, GnosisSafe } from "../../typechain";

export const prepareStrategy = async (
  safe: Contract,
  account: Signer,
  strategyModule: string,
  externalContracts: string[],
  accountsPermissions: { address: string; roles: BigNumber[] }[],
  ...args: Array<any>
): Promise<AbstractStrategy> => {
  // deploy external contracts registry
  const extRegistry = await (
    await ethers.getContractFactory("ExtRegistry")
  ).deploy(safe.address);

  // add external contracts
  for (const externalContract of externalContracts) {
    await setExternalAddress(
      safe,
      account,
      extRegistry.address,
      externalContract,
      true
    );
  }

  // deploy auth registry
  const authRegistry = await (
    await ethers.getContractFactory("AuthRegistry")
  ).deploy(safe.address);

  // set users roles
  for (const { address, roles } of accountsPermissions) {
    for (const role of roles) {
      await setRole(safe, account, authRegistry.address, address, role, true);
    }
  }

  const Strategy = await (
    await ethers.getContractFactory(strategyModule)
  ).deploy(extRegistry.address, authRegistry.address, ...args);

  await enableModule(safe, account, Strategy.address);

  return Strategy as AbstractStrategy;
};

export const prepareBridge = async (
  safe: GnosisSafe,
  account: Signer,
  bridgeModule: string,
  bridgeAdmin: string,
  bridgeOperator: string,
  ...args: Array<any>
): Promise<AbstractBridge> => {
  // deploy auth registry
  const authRegistry = await (
    await ethers.getContractFactory("AuthRegistry")
  ).deploy(safe.address);

  await setRole(
    safe,
    account,
    authRegistry.address,
    bridgeAdmin,
    BigNumber.from(4),
    true
  );

  await setRole(
    safe,
    account,
    authRegistry.address,
    bridgeOperator,
    BigNumber.from(5),
    true
  );

  // deploy external contracts registry
  const extRegistry = await (
    await ethers.getContractFactory("ExtRegistry")
  ).deploy(safe.address);

  const bridge = await (
    await ethers.getContractFactory(bridgeModule)
  ).deploy(extRegistry.address, authRegistry.address, ...args);
  await enableModule(safe, account, bridge.address);

  return bridge as AbstractBridge;
};
