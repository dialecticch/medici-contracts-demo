import { expect } from "chai";
import { ethers } from "hardhat";
import { setupSafe } from "../scripts/helpers/safe";
import { prepareStrategy } from "./utils/strategy";
import { permissionsTest } from "./shared/permissions";
import { depositTest } from "./shared/deposit";
import { withdrawTest } from "./shared/withdraw";
import { forkNetwork } from "./utils/forkNetwork";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { BigNumber } from "ethers";
import { Context } from "./shared/context";
import { dataTest } from "./shared/data";
import { harvestTest } from "./shared/harvest";
import { advanceBlockTime } from "./utils/ethers";

// STRATEGY DETAILS
const strategyModule = "CompoundLeverageFlashDAIStrategy";
const poolName = "cDAI";
const strategyName = "CompoundLeverageFlash DAI Strategy";
const tokenWhale = "0x79007a3fccc08351bf8e7c790bca7b9d8f49729b";

const COMPTROLLER = "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B";
const COMP = "0xc00e94Cb662C3520282E6f5717214004A7f26888";
const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const CDAI = "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643";
const DSS_FLASH = "0x1EB4CF3A948E7D72A198fe073cCb8C7a948cD853";
const COLLATERAL_TARGET = ethers.utils.parseEther("0.82");
const USE_FLASH_MINT = true;

const POOL_0 = 0;
const UNIV2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const SUSHI_ROUTER = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

describe(strategyModule, async () => {
  let account: SignerWithAddress;

  let snapshotId: number;

  let context: Context = {
    strategy: undefined,
    safe: undefined,
    depositToken: DAI,
    pool: POOL_0,
    poolName: poolName,
    strategyName: strategyName,
    tokenWhale: tokenWhale,
    depositFee: 0,
    withdrawFee: 0.001,
    routers: [UNIV2_ROUTER, SUSHI_ROUTER],
    outputToken: USDC,
    wrappedToken: WETH,
  };

  before(async () => {
    await forkNetwork("ethereum", 15674538);

    [account] = await ethers.getSigners();
    context.safe = await setupSafe(account);

    expect(await context.safe!.getOwners()).to.be.deep.equal([account.address]);
  });

  beforeEach(async () => {
    snapshotId = await ethers.provider.send("evm_snapshot", []);

    context.strategy = await prepareStrategy(
      context.safe!,
      account,
      strategyModule,
      [UNIV2_ROUTER, SUSHI_ROUTER],
      [
        {
          address: account.address,
          roles: [BigNumber.from(1), BigNumber.from(2), BigNumber.from(3)],
        },
      ],
      //STRATEGY PARAMS
      COMP,
      CDAI,
      COMPTROLLER,
      DSS_FLASH,
      COLLATERAL_TARGET,
      USE_FLASH_MINT
    );
  });

  afterEach(async () => [
    await ethers.provider.send("evm_revert", [snapshotId]),
  ]);

  permissionsTest(context);
  dataTest(context);
  depositTest(context);
  withdrawTest(context);
  harvestTest(context, async (_) => {
    await advanceBlockTime(86400 * 3);
  });
});
