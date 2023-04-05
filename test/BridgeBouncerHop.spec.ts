import { expect } from "chai";
import { ethers } from "hardhat";
import { setupSafe, setupBridge } from "../scripts/helpers/safe";
import { prepareBridge } from "./utils/strategy";
import { fundSafeFromWhale } from "./shared/deposit";
import { forkNetwork } from "./utils/forkNetwork";
import { AbiCoder } from "ethers/lib/utils";
import { getLatestBlockTimestamp } from "./utils/ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { BigNumber } from "ethers";
import { AbstractBridge, GnosisSafe } from "../typechain";

// STRATEGY DETAILS
const bridgeModule = "BridgeBouncerHop";

// DEPOSIT TOKEN WHALE TO FUND THE SAFE
const tokenWhaleETH = "0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503";
const tokenWhaleOPT = "0x100bdc1431a9b09c61c0efc5776814285f8fb248";

// DEPOSIT TOKEN WHALE TO FUND THE SAFE
const depositTokenETH = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const depositTokenOPT = "0x7F5c764cBc14f9669B88837ca1490cCa17c31607";

// BRIDGE CONTRACTS
const bridgeContractETH = "0x3666f603cc164936c1b87e207f36beba4ac5f18a";
const bridgeContractOPT = "0x2ad09850b0ca4c7c1b33f5acd6cbabcab5d6e796";

const receiverAddress = "0x5AF93C34E0D03CE7D7B9a6BEE862CCC089001f73";

describe(bridgeModule, async () => {
  let safe: GnosisSafe;
  let bridge: AbstractBridge;
  let account: SignerWithAddress;

  let snapshotId: number;

  before(async () => {
    [account] = await ethers.getSigners();
  });

  beforeEach(async () => {
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async () => [
    await ethers.provider.send("evm_revert", [snapshotId]),
  ]);

  describe("Bridge L1 L2", async () => {
    let depositAmount: BigNumber;

    before(async () => {
      await forkNetwork("ethereum", 14961854);

      safe = await setupSafe(account);

      expect(await safe.getOwners()).to.be.deep.equal([account.address]);

      depositAmount = await fundSafeFromWhale(
        safe,
        tokenWhaleETH,
        depositTokenETH
      );

      const accountAddress = await account.getAddress();

      bridge = await prepareBridge(
        safe,
        account,
        bridgeModule,
        safe.address,
        accountAddress,
        //STRATEGY PARAMS
        depositTokenETH
      );

      await setupBridge(
        safe,
        account,
        bridge.address,
        10,
        bridgeContractETH,
        receiverAddress
      );
    });

    it("should bridge USDC without reverting", async () => {
      let bridgeData = new AbiCoder().encode(
        ["uint256", "uint256", "uint256"],
        [
          depositAmount,
          depositAmount.mul(99).div(100), //-1%
          (await getLatestBlockTimestamp()) + 180,
        ]
      );

      await expect(
        bridge.bridge(safe.address, receiverAddress, 10, true, bridgeData)
      ).to.not.be.reverted;
    });
  });

  describe("Bridge L2 L1", async () => {
    let depositAmount: BigNumber;

    before(async () => {
      await forkNetwork("optimism", 8039943);

      safe = await setupSafe(account);

      expect(await safe.getOwners()).to.be.deep.equal([account.address]);

      depositAmount = await fundSafeFromWhale(
        safe,
        tokenWhaleOPT,
        depositTokenOPT
      );

      const accountAddress = await account.getAddress();

      bridge = await prepareBridge(
        safe,
        account,
        bridgeModule,
        safe.address,
        accountAddress,
        //STRATEGY PARAMS
        depositTokenOPT
      );

      await setupBridge(
        safe,
        account,
        bridge.address,
        1,
        bridgeContractOPT,
        receiverAddress
      );
    });

    it("should bridge USDC without reverting", async () => {
      let bridgeData = new AbiCoder().encode(
        ["uint256", "uint256", "uint256", "uint256", "uint256", "uint256"],
        [
          depositAmount,
          depositAmount.div(400), //0.25% - assume destination gas is 0
          depositAmount.mul(99).div(100), //-1%
          (await getLatestBlockTimestamp()) + 180,
          0,
          0,
        ]
      );

      await expect(
        bridge.bridge(safe.address, receiverAddress, 1, false, bridgeData)
      ).to.not.be.reverted;
    });
  });
});
