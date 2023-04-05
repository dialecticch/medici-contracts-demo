import { BigNumber } from "ethers";
import { task } from "hardhat/config";
import { AuthRegistry } from "../typechain";

task(
  "info",
  "Returns all info about medici infrastructure on the selected chain"
).setAction(async (_, hre) => {
  const { ethers, deployments, getNamedAccounts } = hre;
  const { harvester, operator, strategist, oneinch } = await getNamedAccounts();

  const authRegistryDeployment = await deployments.get("AuthRegistry");
  const extRegistryDeployment = await deployments.get("ExtRegistry");

  if (authRegistryDeployment.address == null) {
    console.log("AuthRegistry is not deployed!");
  } else {
    console.log(
      `======== AuthRegistry (${authRegistryDeployment.address}) ========`
    );

    const authSafe = await ethers.provider.getStorageAt(
      authRegistryDeployment.address,
      BigNumber.from(0)
    );
    const authRegistry = (await ethers.getContractAt(
      "AuthRegistry",
      authRegistryDeployment.address
    )) as AuthRegistry;
    const operatorHasRole = await authRegistry.hasRole(
      operator,
      BigNumber.from(1)
    );
    const strategistHasRole = await authRegistry.hasRole(
      strategist,
      BigNumber.from(2)
    );
    const harvesterHasRole = await authRegistry.hasRole(
      harvester,
      BigNumber.from(3)
    );

    console.log(`The safe for AuthRegistry is: 0x${authSafe.slice(-40)}`);
    console.log(
      `Operator address (${operator}) has operator role: `,
      operatorHasRole
    );
    console.log(
      `Strategist address (${strategist}) has strategist role: `,
      strategistHasRole
    );
    console.log(
      `Harvester address (${harvester}) has harvester role: `,
      harvesterHasRole
    );
    console.log("\n");
  }

  if (extRegistryDeployment.address == null) {
    console.log("ExtRegistry is not deployed!");
  } else {
    console.log(
      `======== ExtRegistry (${extRegistryDeployment.address}) ========`
    );

    const extSafe = await ethers.provider.getStorageAt(
      extRegistryDeployment.address,
      BigNumber.from(0)
    );
    const extRegistry = await ethers.getContractAt(
      "ExtRegistry",
      extRegistryDeployment.address
    );
    const isOneInchEnabled = await extRegistry.isExternalAddressAllowed(
      oneinch
    );

    console.log(`The safe for ExtRegistry is: 0x${extSafe.slice(-40)}`);
    console.log(
      `OneInch address (${oneinch}) has been enabled: `,
      isOneInchEnabled
    );
  }
});

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
};
