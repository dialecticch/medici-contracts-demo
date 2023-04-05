import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const useFlashMint = true;
  const collateralTarget = hre.ethers.utils.parseEther("0.82");

  const { deployer, comp, cdai, comptroller, dssFlash } =
    await getNamedAccounts();

  const extRegistry = await deployments.get("ExtRegistry");
  const authRegistry = await deployments.get("AuthRegistry");

  await deploy("CompoundLeverageFlashDAIStrategy", {
    from: deployer,
    args: [
      extRegistry.address,
      authRegistry.address,
      comp,
      cdai,
      comptroller,
      dssFlash,
      collateralTarget,
      useFlashMint,
    ],
    log: true,
  });
};

export default func;
func.tags = ["CompoundLeverageFlashDAIStrategy"];
func.dependencies = ["AuthRegistry", "ExtRegistry"];
