import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, execute } = deployments;

  const { deployer, safe, oneinch } = await getNamedAccounts();

  await deploy("ExtRegistry", {
    from: deployer,
    args: [deployer],
    log: true,
  });

  console.log("Setting up external contracts: [", oneinch, "]");

  await execute(
    "ExtRegistry",
    { from: deployer, log: true },
    "setExternalAddress",
    oneinch,
    true
  );

  console.log("Transferring ownership to safe");

  await execute("ExtRegistry", { from: deployer, log: true }, "setSafe", safe);

  console.log("Done");

  return true;
};

export default func;
func.tags = ["ExtRegistry"];
func.id = "ext-registry-setup";
func.skip = async function (hre: HardhatRuntimeEnvironment): Promise<boolean> {
  const { deployments } = hre;

  const extRegistry = await deployments.getOrNull("ExtRegistry");

  return extRegistry !== undefined;
};
