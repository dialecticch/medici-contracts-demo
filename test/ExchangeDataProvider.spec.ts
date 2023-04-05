import { ethers, network } from "hardhat";
import { forkNetwork } from "./utils/forkNetwork";
import { expect } from "chai";
import { Contract } from "@ethersproject/contracts";

//STRATEGY SPECIFIC DATA
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

const deployedStrategy = "0x7f9f3480ff262d4b65728e95d5cd1b0990d4a742";
const safe = "0x4fee396c8d940b801747ca84632580f917690e87";

const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const pool = 63;

const Booster = "0xf403c135812408bfbe8713b5a23a04b3d48aae31";

describe("ExchangeDataProvider", async () => {
  let strategy: Contract;
  let dataProvider: Contract;

  let snapshotId: number;

  before(async () => {
    await forkNetwork("ethereum", 14779630);

    dataProvider = await (
      await ethers.getContractFactory("ExchangeDataProvider")
    ).deploy();

    const extRegistry = await (
      await ethers.getContractFactory("ExtRegistry")
    ).deploy(safe);
    const authRegistry = await (
      await ethers.getContractFactory("AuthRegistry")
    ).deploy(safe);

    const strategy = await (
      await ethers.getContractFactory("ConvexStrategy")
    ).deploy(extRegistry.address, authRegistry.address, Booster);

    const code = await network.provider.send("eth_getCode", [strategy.address]);

    await network.provider.send("hardhat_setCode", [deployedStrategy, code]);
  });

  beforeEach(async () => {
    snapshotId = await ethers.provider.send("evm_snapshot", []);

    strategy = await ethers.getContractAt("ConvexStrategy", deployedStrategy);
  });

  afterEach(async () => [
    await ethers.provider.send("evm_revert", [snapshotId]),
  ]);

  it("should return best price", async () => {
    let signer = new ethers.VoidSigner(
      ethers.constants.AddressZero,
      ethers.provider
    );
    let strategyInstance = await ethers.getContractAt(
      "ConvexStrategy",
      strategy.address,
      signer
    );
    const harvests = await strategyInstance.callStatic.simulateClaim(
      pool,
      safe,
      "0x"
    );

    expect(harvests[0].amount).to.be.gt(0);

    const swaps = await dataProvider.swaps(
      ethers.constants.AddressZero,
      harvests,
      [
        "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
        "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
      ],
      WETH,
      USDC
    );

    expect(swaps[0].amountIn).to.be.equal(harvests[0].amount);
    expect(swaps[0].amountOutMin).to.be.gt(0);
  });
});
