import type {
  HardhatUserConfig,
  NetworkUserConfig,
  HardhatNetworkForkingUserConfig,
} from "hardhat/types";

import "hardhat-deploy";
import "hardhat-abi-exporter";
import "@nomicfoundation/hardhat-toolbox";

import { resolve } from "path";
import { config as dotenvConfig } from "dotenv";

const SKIP_LOAD = process.env.SKIP_LOAD === "true";

dotenvConfig({ path: resolve(__dirname, "./.env") });

// Prevent to load scripts before compilation and typechain
if (!SKIP_LOAD) {
  require("./tasks");
}

const deployerAccount = [process.env.PRIVATE_KEY as string];

const defaultAccount = {
  mnemonic: "test test test test test test test test test test test junk",
  initialIndex: 0,
  path: "m/44'/60'/0'/0",
  count: 20,
  accountsBalance: "10000000000000000000000",
};

const chainIds = {
  ethereum: 1,
  optimism: 10,
  polygon: 137,
  arbitrum: 42161,
  avalanche: 43114,
};

const infuraApiKey: string | undefined = process.env.INFURA_API_KEY;
if (!infuraApiKey) {
  throw new Error("Please set your INFURA_API_KEY in a .env file");
}

function getForkConfig(chain: number): HardhatNetworkForkingUserConfig {
  let jsonRpcUrl: string | undefined;
  let blockNumber: number | undefined;

  switch (chain) {
    case 1:
      jsonRpcUrl = process.env.ETHEREUM_API as string;
      blockNumber = 14655838;
      break;
    case 10:
      jsonRpcUrl = process.env.OPTIMISM_API as string;
      blockNumber = 8031180;
      break;
    case 137:
      jsonRpcUrl = process.env.POLYGON_API as string;
      blockNumber = 27633365;
      break;
    case 43114:
      jsonRpcUrl = process.env.ARBITRUM_API as string;
      blockNumber = 15968233;
      break;
    default:
      jsonRpcUrl = process.env.GOERLI_API as string;
      blockNumber = 7825205;
  }

  return { url: jsonRpcUrl, blockNumber: blockNumber };
}

function getChainConfig(chain: keyof typeof chainIds): NetworkUserConfig {
  let jsonRpcUrl: string;
  let gasMultiplier: number;

  switch (chain) {
    case "ethereum":
      jsonRpcUrl = process.env.ETHEREUM_API as string;
      gasMultiplier = 1;
      break;
    case "optimism":
      jsonRpcUrl = process.env.OPTIMISM_API as string;
      gasMultiplier = 1;
      break;
    case "polygon":
      jsonRpcUrl = process.env.POLYGON_API as string;
      gasMultiplier = 2;
      break;
    case "arbitrum":
      jsonRpcUrl = process.env.ARBITRUM_API as string;
      gasMultiplier = 2;
      break;
    case "avalanche":
      jsonRpcUrl = process.env.AVALANCHE_API as string;
      gasMultiplier = 2;
      break;
    default:
      jsonRpcUrl = "https://" + chain + ".infura.io/v3/" + infuraApiKey;
      gasMultiplier = 1;
  }

  return {
    url: jsonRpcUrl,
    chainId: chainIds[chain],
    accounts: deployerAccount,
    gasMultiplier: gasMultiplier,

    // harhdat-deploy config
    live: true,
    saveDeployments: true,
    tags: ["live-network"],
    deploy: ["deploy/common", "deploy/" + chain],
  };
}

const config: HardhatUserConfig = {
  // Networks
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: getForkConfig(parseInt(process.env.CHAIN_ID as string)),
      hardfork: "london",

      // harhdat-deploy config
      live: false,
      tags: ["local-fork"],
      deploy: ["deploy-test/common", "deploy-test/hardhat"],
    },

    // Needed for `solidity-coverage`
    coverage: {
      url: "http://localhost:8555",
      gas: "auto",
      hardfork: "london",
      initialBaseFeePerGas: 1,
      gasPrice: 2,
      gasMultiplier: 1.5,

      // harhdat-deploy config
      live: false,
      saveDeployments: false,
      tags: ["coverage-network"],
    },

    ganache: {
      url: "http://localhost:7545",
      chainId: 5777,
      accounts: defaultAccount,
      gas: "auto",
      hardfork: "london",
      initialBaseFeePerGas: 1,
      gasPrice: 20000000000, // 1 gwei
      gasMultiplier: 1.5,

      // harhdat-deploy config
      live: false,
      saveDeployments: true,
      tags: ["local"],
    },

    goerli: {
      accounts: deployerAccount,
      gas: "auto",
      hardfork: "london",
      url: process.env.GOERLI_API as string,

      // harhdat-deploy config
      live: false,
      saveDeployments: false,
      tags: ["test-network"],
    },

    polygon: getChainConfig("polygon"),
    ethereum: getChainConfig("ethereum"),
    arbitrum: getChainConfig("arbitrum"),
    optimism: getChainConfig("optimism"),
    avalanche: getChainConfig("avalanche"),
  },

  // Named accounts, needed for hardhat-deploy
  namedAccounts: {
    deployer: {
      default: 0,
    },
    safe: {
      default: 1,
      ethereum: process.env.MAINNET_SAFE || null,
      optimism: process.env.OPT_SAFE || null,
      avalanche: process.env.AVAX_SAFE || null,
      arbitrum: process.env.ARBITRUM_SAFE || null,
    },
    oneinch: {
      ethereum: "0x1111111254fb6c44bac0bed2854e76f90643097d",
      avalanche: "0x1111111254fb6c44bac0bed2854e76f90643097d",
      optimism: "0x1111111254760f7ab3f16433eea9304126dcd199",
      arbitrum: "0x1111111254fb6c44bac0bed2854e76f90643097d",
    },
    strategist: {
      default: "TODO",
    },
    harvester: {
      default: "TODO",
    },
    operator: {
      default: "TODO",
      arbitrum: "TODO",
    },
    usdc: {
      ethereum: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      optimism: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
      arbitrum: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
    },
    weth: {
      default: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      arbitrum: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    },
    wavax: {
      avalanche: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
    },
    usdt: {
      arbitrum: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
    },
    dai: {
      ethereum: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      arbitrum: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    },
    convexBooster: {
      hardhat: "0xF403C135812408BFbE8713b5A23a04b3D48AAE31",
      ethereum: "0xF403C135812408BFbE8713b5A23a04b3D48AAE31",
    },
    convexFraxBooster: {
      ethereum: "0x9ca3ec5f627ad5d92498fd1b006b35577760ba9a",
    },
    cdai: {
      ethereum: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
    },
    comptroller: {
      ethereum: "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B",
    },
    dssFlash: {
      ethereum: "0x1EB4CF3A948E7D72A198fe073cCb8C7a948cD853",
    },
  },

  // Compiler
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },

  // Testing
  mocha: {
    timeout: 2000000,
  },

  // typechain
  typechain: {
    outDir: "typechain",
  },

  // hardhat-abi-exporter
  abiExporter: {
    except: [".*Mock$"],
    clear: true,
    flat: true,
  },

  // hardhat-gas-reporter
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    gasPrice: 70,
  },
};

export default config;
