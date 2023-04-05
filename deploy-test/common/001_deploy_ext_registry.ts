import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer, safe } = await getNamedAccounts();

  await deploy("ExtRegistry", {
    from: deployer,
    args: [safe],
    log: true,
  });
};

export default func;
func.tags = ["ExtRegistry"];
