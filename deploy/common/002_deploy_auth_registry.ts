import { BigNumber } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { execute } from "../../scripts/helpers/safe";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, execute } = deployments;

  const { deployer, safe, harvester, operator, strategist } =
    await getNamedAccounts();

  await deploy("AuthRegistry", {
    from: deployer,
    args: [deployer],
    log: true,
  });

  console.log("Setting up roles");

  await execute(
    "AuthRegistry",
    { from: deployer, log: true },
    "setRole",
    operator,
    BigNumber.from(1),
    true
  );
  await execute(
    "AuthRegistry",
    { from: deployer, log: true },
    "setRole",
    strategist,
    BigNumber.from(2),
    true
  );
  await execute(
    "AuthRegistry",
    { from: deployer, log: true },
    "setRole",
    harvester,
    BigNumber.from(3),
    true
  );

  console.log("Transferring ownership to safe");

  await execute("AuthRegistry", { from: deployer, log: true }, "setSafe", safe);

  console.log("Done");

  return true;
};

export default func;
func.tags = ["AuthRegistry"];
func.id = "auth-registry-setup";
func.skip = async function (hre: HardhatRuntimeEnvironment): Promise<boolean> {
  const { deployments } = hre;

  const authRegistry = await deployments.getOrNull("AuthRegistry");

  return authRegistry !== undefined;
};
