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

// STRATEGY DETAILS
const strategyModule = "ConvexStrategy";

//STRATEGY SPECIFIC DATA
const Booster = "0xf403c135812408bfbe8713b5a23a04b3d48aae31";

describe(strategyModule, async () => {
  let account: SignerWithAddress;

  let snapshotId: number;

  let context: Context = {
    strategy: undefined,
    safe: undefined,
    depositToken: "0x43b4FdFD4Ff969587185cDB6f0BD875c5Fc83f8c",
    pool: 36,
    poolName: "Curve.fi Factory USD Metapool: Alchemix USD",
    strategyName: "Convex Strategy Module",
    tokenWhale: "0xd44a4999df99fb92db7cdfe7dea352a28bcedb63",
    withdrawFee: 0,
    depositFee: 0,
  };

  before(async () => {
    await forkNetwork("ethereum", 12921859);
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
      [],
      [
        {
          address: account.address,
          roles: [BigNumber.from(1), BigNumber.from(2), BigNumber.from(3)],
        },
      ],
      //STRATEGY PARAMS
      Booster
    );
  });

  afterEach(async () => [
    await ethers.provider.send("evm_revert", [snapshotId]),
  ]);

  permissionsTest(context);
  dataTest(context);

  depositTest(context);
  withdrawTest(context);
});
