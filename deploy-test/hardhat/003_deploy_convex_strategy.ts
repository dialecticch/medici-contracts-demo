import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer, convexBooster } = await getNamedAccounts();

  const extRegistry = await deployments.get("ExtRegistry");
  const authRegistry = await deployments.get("AuthRegistry");

  await deploy("ConvexStrategy", {
    from: deployer,
    args: [extRegistry.address, authRegistry.address, convexBooster],
    log: true,
  });
};

export default func;
func.tags = ["ConvexStrategy"];
