import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer, usdc } = await getNamedAccounts();

  const extRegistry = await deployments.get("ExtRegistry");
  const authRegistry = await deployments.get("AuthRegistry");

  await deploy("BridgeBouncerHop", {
    from: deployer,
    args: [extRegistry.address, authRegistry.address, usdc],
    log: true,
  });
};

export default func;
func.tags = ["BridgeBouncerHop"];
func.dependencies = ["AuthRegistry", "ExtRegistry"];
