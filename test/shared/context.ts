import { AbstractStrategy, GnosisSafe } from "../../typechain";

export interface Context {
  strategy?: AbstractStrategy;
  safe?: GnosisSafe;
  depositToken: string;
  pool: number;
  poolName: string;
  strategyName: string;
  tokenWhale: string;
  depositData?: string;
  depositFee: number;
  withdrawFee: number;
  withdrawData?: string;
  cooldownBlocks?: number;
  routers?: string[];
  wrappedToken?: string;
  outputToken?: string;
}
