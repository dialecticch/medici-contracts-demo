import { ethers } from "hardhat";
import { ParamType } from "@ethersproject/abi/src.ts/fragments";

export const encodeWithdrawData = (
  types: ReadonlyArray<string | ParamType>,
  values: ReadonlyArray<any>
): string => {
  const params = ethers.utils.defaultAbiCoder.encode(types, values);

  return ethers.utils.defaultAbiCoder.encode(["bytes", "bytes"], [[], params]);
};
